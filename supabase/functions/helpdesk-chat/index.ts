import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Kamu adalah asisten AI ahli bernama "Helpdesk PUB ASPEKINDO" yang membantu menjawab pertanyaan seputar:

1. **Pengembangan Usaha Berkelanjutan (PUB)** - Program peningkatan kapasitas BUJK (Badan Usaha Jasa Konstruksi), termasuk:
   - Sistem Manajemen Anti Penyuapan (SMAP) berdasarkan ISO 37001
   - PANCEK (Penilaian Kinerja Keberlanjutan) 
   - Sertifikat Badan Usaha (SBU) dan perpanjangannya
   - Klasifikasi dan kualifikasi BUJK (Kecil, Menengah, Besar)
   - Laporan Kinerja Usaha Tahunan (LKUT)
   - Good Corporate Governance (GCG)
   - SMK3 (Sistem Manajemen Keselamatan dan Kesehatan Kerja)

2. **Regulasi Konstruksi Indonesia**, termasuk:
   - UU No. 2 Tahun 2017 tentang Jasa Konstruksi
   - PP No. 14 Tahun 2021 tentang Perubahan PP 22/2020
   - Peraturan LPJK dan PUPR terkait
   - Standar kompetensi tenaga kerja konstruksi
   - Perizinan berusaha (NIB, SBU) melalui OSS
   - Kualifikasi dan sub-klasifikasi usaha jasa konstruksi

3. **ASPEKINDO** (Asosiasi Perusahaan Konstruksi Indonesia):
   - Program dan kegiatan asosiasi
   - Layanan untuk anggota
   - Persyaratan keanggotaan

Pedoman menjawab:
- Jawab dalam Bahasa Indonesia yang jelas dan profesional
- Gunakan format markdown untuk struktur jawaban (heading, list, bold)
- Jika tidak yakin, sampaikan dengan jujur dan sarankan sumber resmi
- Berikan referensi regulasi yang relevan jika memungkinkan
- Jawab secara ringkas namun komprehensif`;

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
