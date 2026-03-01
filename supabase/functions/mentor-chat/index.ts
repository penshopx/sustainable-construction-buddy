import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  learning: `Kamu adalah Mentor Pembelajaran Digital — pendamping belajar yang sabar dan interaktif.

Peranmu:
- Mendampingi user mempelajari materi dari modul yang telah diupload
- Menjelaskan konsep dengan cara yang mudah dipahami
- Memberikan contoh praktis dan analogi
- Mengajukan pertanyaan reflektif untuk memastikan pemahaman
- Memberikan ringkasan dan poin-poin kunci

Panduan:
1. Jawab HANYA berdasarkan konteks modul yang diberikan
2. Jika pertanyaan di luar cakupan modul, jelaskan bahwa topik tersebut tidak ada di modul
3. Gunakan bahasa Indonesia profesional tapi ramah
4. Format dengan markdown (heading, bullet, bold)
5. Akhiri dengan pertanyaan atau saran belajar lanjutan`,

  expert: `Kamu adalah Pakar Cerdas PUB Konstruksi — knowledge management AI yang proaktif dan atentif.

Profil:
- Expert dalam seluruh domain manajemen konstruksi Indonesia
- Memahami regulasi (PP 22/2020, UU Jasa Konstruksi, Permen PUPR, FIDIC, PMI, ISO)
- Berfungsi sebagai perpustakaan hidup dan advisor strategis

Panduan:
1. Berikan jawaban mendalam dengan referensi regulasi dan standar
2. Proaktif memberikan saran dan insight tambahan yang relevan
3. Hubungkan topik dengan best practices industri
4. Tawarkan perspektif multi-dimensi (teknis, legal, manajerial, finansial)
5. Gunakan markdown, tabel, dan struktur yang jelas
6. Ajukan pertanyaan follow-up untuk menggali kebutuhan lebih dalam`,

  project: `Kamu adalah Problem Solver Proyek — asisten AI khusus yang memahami detail proyek konstruksi secara mendalam.

Peranmu:
- Menganalisis masalah proyek berdasarkan data dan dokumen yang diberikan
- Memberikan solusi praktis dan actionable
- Mengidentifikasi risiko dan memberikan mitigasi
- Membantu perencanaan dan pengambilan keputusan

Panduan:
1. Gunakan data proyek yang diberikan sebagai konteks utama
2. Berikan analisis berbasis data (anggaran, timeline, risiko)
3. Rekomendasikan langkah konkret dengan prioritas
4. Pertimbangkan regulasi dan standar Indonesia
5. Format output dengan jelas: masalah → analisis → rekomendasi
6. Proaktif identifikasi potensi masalah yang belum ditanyakan`,
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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit
    const adminClient = createClient(supabaseUrl, serviceKey);
    const windowStart = new Date(Date.now() - 60 * 60000).toISOString();
    const { count } = await adminClient
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action", "mentor_chat")
      .gte("created_at", windowStart);

    if ((count ?? 0) >= 30) {
      return new Response(JSON.stringify({ error: "Batas penggunaan tercapai. Coba lagi nanti." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
      });
    }
    await adminClient.from("rate_limits").insert({ user_id: user.id, action: "mentor_chat" });

    const { messages, mentorType, knowledgeBaseId, projectId } = await req.json();
    const systemPrompt = SYSTEM_PROMPTS[mentorType] || SYSTEM_PROMPTS.expert;

    // Build context based on mentor type
    let contextText = "";

    if (mentorType === "learning" && knowledgeBaseId) {
      // Fetch RAG chunks for learning mentor
      const { data: chunks } = await adminClient
        .from("mentor_chunks")
        .select("content, chunk_index")
        .eq("knowledge_base_id", knowledgeBaseId)
        .order("chunk_index", { ascending: true })
        .limit(20);

      if (chunks?.length) {
        contextText = "\n\n=== KONTEN MODUL PEMBELAJARAN ===\n" +
          chunks.map(c => c.content).join("\n\n---\n\n") +
          "\n=== AKHIR KONTEN MODUL ===\n";
      }
    }

    if (mentorType === "project" && projectId) {
      // Fetch project data
      const { data: project } = await adminClient
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      const { data: risks } = await adminClient
        .from("risk_registers")
        .select("*")
        .eq("project_id", projectId)
        .limit(10);

      const { data: budgets } = await adminClient
        .from("budget_entries")
        .select("*")
        .eq("project_id", projectId)
        .limit(10);

      const { data: k3 } = await adminClient
        .from("k3_checklists")
        .select("*")
        .eq("project_id", projectId)
        .limit(5);

      if (project) {
        contextText += `\n\n=== DATA PROYEK ===\nNama: ${project.name}\nLokasi: ${project.location}\nNilai: Rp ${Number(project.value_amount).toLocaleString("id-ID")}\nDurasi: ${project.duration_months} bulan\nStatus: ${project.status}\nKompleksitas: ${project.complexity_score}/100\nKelas Risiko: ${project.risk_class}\nTipe Kontrak: ${project.contract_type}\nBUJK: ${project.bujk_name}\n`;
      }

      if (risks?.length) {
        contextText += `\n--- RISIKO PROYEK ---\n` +
          risks.map(r => `• ${r.risk_description} (P:${r.probability_score} I:${r.impact_score}) - ${r.status} - Mitigasi: ${r.mitigation_action}`).join("\n");
      }

      if (budgets?.length) {
        contextText += `\n--- ANGGARAN ---\n` +
          budgets.map(b => `• ${b.category} [${b.period_month}]: Rencana ${Number(b.planned_amount).toLocaleString("id-ID")} vs Aktual ${Number(b.actual_amount).toLocaleString("id-ID")}`).join("\n");
      }

      if (k3?.length) {
        contextText += `\n--- K3 ---\n` +
          k3.map(c => `• ${c.location} [${c.inspection_date}]: ${c.completed_items}/${c.total_items} (${c.status})`).join("\n");
      }

      // Also fetch project brain documents
      if (knowledgeBaseId) {
        const { data: chunks } = await adminClient
          .from("mentor_chunks")
          .select("content, chunk_index")
          .eq("knowledge_base_id", knowledgeBaseId)
          .order("chunk_index", { ascending: true })
          .limit(15);

        if (chunks?.length) {
          contextText += "\n\n--- DOKUMEN PROYEK ---\n" +
            chunks.map(c => c.content).join("\n\n") + "\n";
        }
      }

      contextText += "\n=== AKHIR DATA PROYEK ===\n";
    }

    const fullSystemPrompt = systemPrompt + contextText;

    // Stream response
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("mentor-chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
