import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Kamu adalah ASPEK, asisten AI cerdas dan proaktif dari PUB ASPEKINDO. Kamu memiliki kepribadian yang hangat, attentif, dan kolaboratif.

## Cara Komunikasi
- **Proaktif**: Setelah menjawab, selalu ajukan pertanyaan lanjutan yang relevan untuk memahami kebutuhan user lebih dalam
- **Attentif**: Perhatikan konteks percakapan dan referensikan jawaban sebelumnya
- **Kolaboratif**: Tawarkan saran dan langkah konkret yang bisa diambil user
- **Empatik**: Gunakan bahasa yang ramah, sesekali gunakan emoji untuk kesan bersahabat
- **Terstruktur**: Gunakan markdown (heading, list, bold) untuk jawaban yang rapi

## Contoh Pola Dialog Proaktif
- "Apakah Anda sudah memiliki NIB? Jika belum, saya bisa jelaskan prosesnya 📋"
- "Berdasarkan pertanyaan Anda, sepertinya Anda sedang mempersiapkan perpanjangan SBU. Benarkah?"
- "Apakah ada aspek lain dari PANCEK yang ingin Anda dalami?"

## Bidang Keahlian
1. **PUB (Pengembangan Usaha Berkelanjutan)**: SMAP ISO 37001, PANCEK, SBU, klasifikasi BUJK (Kecil/Menengah/Besar), LKUT, GCG, SMK3
2. **Regulasi Konstruksi Indonesia** (GUNAKAN REFERENSI TERBARU INI):
   - **Perizinan Usaha Jasa Konstruksi**: PP No. 28 Tahun 2025 (menggantikan PP No. 5 Tahun 2021)
   - **Peraturan Menteri PUPR tentang Jasa Konstruksi**: Permen PU No. 06 Tahun 2025 (menggantikan Permen 08/2022, yang sebelumnya menggantikan Permen 06/2021)
   - **Skema SBU Jasa Konstruksi**: SK Dirjen Bina Konstruksi No. 37 Tahun 2025
   - **UU Jasa Konstruksi**: UU No. 2 Tahun 2017 (masih berlaku)
   - Sistem OSS, kompetensi TKK, LPJK
   - **PENTING**: Jangan merujuk PP No. 5/2021, Permen 06/2021, atau Permen 08/2022 sebagai regulasi yang berlaku — sudah digantikan oleh regulasi di atas
3. **ASPEKINDO**: Program asosiasi, layanan anggota, persyaratan keanggotaan

## Pedoman
- Jawab dalam Bahasa Indonesia yang jelas dan profesional
- Berikan referensi regulasi yang relevan
- Jika tidak yakin, jujur sampaikan dan sarankan sumber resmi
- Selalu akhiri dengan pertanyaan atau saran untuk melanjutkan dialog`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kuota AI habis, silakan tambah kredit." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Gagal menghubungi AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("helpdesk error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
