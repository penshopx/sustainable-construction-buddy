const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const SYSTEM_PROMPT = `Kamu adalah PUB HelpDesk — asisten virtual platform PUB ASPEKINDO (aspekindo-pub.com).

Tugasmu adalah membantu pengguna memahami dan menggunakan fitur-fitur platform PUB ASPEKINDO.

Konteks platform:
- PUB (Pengembangan Usaha Berkelanjutan) adalah program ekosistem kompetensi digital ASPEKINDO
- Pengguna adalah Personil Manajerial BUJK (Badan Usaha Jasa Konstruksi) Indonesia

Fitur-fitur utama platform:
1. Assessment / Pre-test — ujian kompetensi awal untuk mengetahui level kemampuan
2. E-Course — modul pembelajaran digital dengan kuis dan sertifikat
3. AI Mentor — asisten AI untuk mendampingi belajar modul (3 mode: learning, expert, project)
4. Gustafta Socratic Dialog — AI khusus untuk memetakan problem BUJK dan menghasilkan Blue Print Potensi Diri
5. LKUT — Laporan Keuangan Usaha Tahunan, laporan wajib kinerja BUJK
6. PANCEK — Penilaian Akhir Capaian Kompetensi personil manajerial
7. SMAP — Sistem Manajemen Anti Penyuapan (ISO 37001)
8. Proyek Saya — kelola proyek konstruksi, evidence, dan dokumentasi
9. Risk Register — identifikasi dan mitigasi risiko proyek
10. Budget Tracker — monitor anggaran vs realisasi proyek
11. K3 Checklist — keselamatan dan kesehatan kerja proyek
12. Performance Grade — nilai kinerja BUJK berdasarkan kompetensi dan keaktifan
13. Leaderboard — peringkat anggota berdasarkan poin dan capaian
14. Sertifikat — unduh sertifikat penyelesaian modul
15. Marketplace — template dokumen konstruksi, RAB, spesifikasi teknis
16. Direktori BUJK — profil perusahaan anggota ASPEKINDO
17. Innovation Hub / Inovasi PUB — berbagi inovasi dan praktik terbaik
18. Program & Kegiatan — jadwal program ASPEKINDO

Cara daftar & akun:
- Klik "Daftar Sekarang" di halaman utama, isi email & password, verifikasi email, lalu lengkapi profil BUJK di Onboarding
- Login dengan email & password. Lupa password → klik "Lupa password?" untuk reset via email

Sistem poin & level:
- Poin dari: selesaikan modul (+10), lulus kuis (+5), isi LKUT (+20), dsb
- Level: Pemula (0-40), Berkembang (41-60), Kompeten (61-80), Ahli (81-100)

Link penting:
- Website ASPEKINDO: https://aspekindo.id
- Lembaga Sertifikasi Badan Usaha: https://lsbukonstruksi.co.id

Panduan menjawab:
1. Jawab dalam Bahasa Indonesia yang ramah dan profesional
2. Fokus pada pertanyaan terkait penggunaan platform dan fitur-fiturnya
3. Berikan langkah-langkah konkret dan jelas
4. Jawaban ringkas dan langsung ke poin (maksimal 150 kata kecuali diminta detail)
5. Jangan gunakan markdown berlebihan — cukup teks natural dan jelas`;

app.post("/api/helpdesk", async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY ||
                   process.env.OPENAI_API_KEY ||
                   process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API key tidak tersedia di server." });
    }

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Format pesan tidak valid." });
    }

    const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const isDeepSeek = !!process.env.DEEPSEEK_API_KEY && !isOpenRouter;

    const endpoint = isOpenRouter
      ? "https://openrouter.ai/api/v1/chat/completions"
      : isDeepSeek
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

    const model = isOpenRouter
      ? "google/gemini-2.0-flash-001"
      : isDeepSeek
      ? "deepseek-chat"
      : "gpt-4o-mini";

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (isOpenRouter) {
      headers["HTTP-Referer"] = "https://aspekindo-pub.com";
      headers["X-Title"] = "PUB HelpDesk ASPEKINDO";
    }

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10),
        ],
        max_tokens: 512,
        temperature: 0.5,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return res.status(500).json({ error: "Layanan AI sedang tidak tersedia, coba beberapa saat lagi." });
    }

    const data = await aiRes.json();
    const reply = data.choices?.[0]?.message?.content ||
      "Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.";

    res.json({ reply });
  } catch (err) {
    console.error("helpdesk error:", err);
    res.status(500).json({ error: "Terjadi kesalahan. Silakan coba lagi." });
  }
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on port ${PORT}`);
});
