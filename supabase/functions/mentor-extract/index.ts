import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { knowledgeBaseId } = await req.json();
    if (!knowledgeBaseId) {
      return new Response(JSON.stringify({ error: "Missing knowledgeBaseId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get knowledge base record
    const { data: kb, error: kbError } = await adminClient
      .from("mentor_knowledge_bases")
      .select("*")
      .eq("id", knowledgeBaseId)
      .eq("user_id", user.id)
      .single();

    if (kbError || !kb) {
      return new Response(JSON.stringify({ error: "Knowledge base not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await adminClient
      .from("mentor_knowledge_bases")
      .update({ status: "processing" })
      .eq("id", knowledgeBaseId);

    // Download file from storage
    const filePath = kb.file_url.replace(/^.*\/storage\/v1\/object\/public\//, "").replace(/^mentor-uploads\//, "");
    const { data: fileData, error: dlError } = await adminClient.storage
      .from("mentor-uploads")
      .download(filePath);

    if (dlError || !fileData) {
      await adminClient.from("mentor_knowledge_bases").update({ status: "error" }).eq("id", knowledgeBaseId);
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract text content
    let textContent = "";
    const fileType = kb.file_type || "";

    if (fileType.includes("text") || kb.file_name.endsWith(".txt") || kb.file_name.endsWith(".md")) {
      textContent = await fileData.text();
    } else {
      // For non-text files, use AI to extract/summarize content
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (apiKey) {
        // Convert to base64 for AI processing
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: "Ekstrak seluruh teks dari dokumen ini. Kembalikan hanya teks konten tanpa komentar tambahan. Jika dokumen berisi tabel, format sebagai teks terstruktur." },
                  { type: "image_url", image_url: { url: `data:${fileType};base64,${base64}` } },
                ],
              },
            ],
            max_tokens: 8000,
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          textContent = aiData.choices?.[0]?.message?.content || "";
        }
      }

      if (!textContent) {
        // Fallback: try reading as text
        try {
          textContent = await new Response(fileData).text();
        } catch {
          textContent = `[Konten file: ${kb.file_name}]`;
        }
      }
    }

    // Chunk the text (roughly 500-800 chars per chunk with overlap)
    const chunks = chunkText(textContent, 700, 100);

    // Delete existing chunks
    await adminClient.from("mentor_chunks").delete().eq("knowledge_base_id", knowledgeBaseId);

    // Insert new chunks
    if (chunks.length > 0) {
      const chunkRows = chunks.map((content, i) => ({
        knowledge_base_id: knowledgeBaseId,
        user_id: user.id,
        chunk_index: i,
        content,
        metadata: { source: kb.file_name, index: i, total: chunks.length },
      }));

      await adminClient.from("mentor_chunks").insert(chunkRows);
    }

    // Update KB status
    await adminClient
      .from("mentor_knowledge_bases")
      .update({ status: "ready", chunk_count: chunks.length })
      .eq("id", knowledgeBaseId);

    return new Response(JSON.stringify({ success: true, chunkCount: chunks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("mentor-extract error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  if (!text || text.length === 0) return [];
  
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap from end of current
      const overlapText = current.slice(-overlap);
      current = overlapText + "\n\n" + para;
    } else {
      current += (current ? "\n\n" : "") + para;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  // If we only got one chunk and it's very long, split by sentences
  if (chunks.length === 1 && chunks[0].length > chunkSize * 2) {
    const sentences = chunks[0].split(/(?<=[.!?])\s+/);
    const newChunks: string[] = [];
    let cur = "";
    for (const s of sentences) {
      if (cur.length + s.length > chunkSize && cur) {
        newChunks.push(cur.trim());
        cur = cur.slice(-overlap) + " " + s;
      } else {
        cur += (cur ? " " : "") + s;
      }
    }
    if (cur.trim()) newChunks.push(cur.trim());
    return newChunks;
  }

  return chunks;
}
