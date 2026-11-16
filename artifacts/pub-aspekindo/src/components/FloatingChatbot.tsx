import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { X, MessageCircle, Search, ChevronRight, ChevronDown, ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { KEPDIRJEN_281_FAQS } from "@/data/lkut-281-reference";

interface FloatingChatbotProps {
  variant?: "landing" | "dashboard";
  initialOpen?: boolean;
  standalone?: boolean;
}

type Article = { q: string; a: string };
type Category = { icon: string; label: string; articles: Article[] };
type ChatMsg = { from: "user" | "bot"; text: string };
type ChatbotContentPart = { kind: "text"; value: string } | { kind: "link"; label: string; href: string };

const CHATBOT_LINK_PATTERN = /<a\b[^>]*\bhref\s*=\s*(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a\s*>|\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/gi;

function decodeChatbotEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'");
}

function cleanChatbotText(value: string): string {
  return decodeChatbotEntities(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, "$1")
    .replace(/\*\*|__|~~|`/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getSafeChatbotHref(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return value;
  } catch {
    return null;
  }
}

function parseChatbotContent(value: string): ChatbotContentPart[] {
  const parts: ChatbotContentPart[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(CHATBOT_LINK_PATTERN)) {
    const matchIndex = match.index ?? 0;
    const rawHref = match[2] || match[5] || "";
    const rawLabel = match[3] || match[4] || "";

    if (matchIndex > lastIndex) {
      parts.push({ kind: "text", value: cleanChatbotText(value.slice(lastIndex, matchIndex)) });
    }

    const safeHref = getSafeChatbotHref(rawHref);
    const label = cleanChatbotText(rawLabel);
    if (safeHref && label) {
      parts.push({ kind: "link", label, href: safeHref });
    } else if (label) {
      parts.push({ kind: "text", value: label });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < value.length) {
    parts.push({ kind: "text", value: cleanChatbotText(value.slice(lastIndex)) });
  }

  return parts.filter((part) => part.kind === "link" || part.value.length > 0);
}

function ChatbotContent({ value }: { value: string }): ReactNode {
  return parseChatbotContent(value).map((part, index) => {
    if (part.kind === "link") {
      const isExternal = /^https?:\/\//i.test(part.href) && !part.href.startsWith(window.location.origin);
      return (
        <a
          key={`link-${index}`}
          href={part.href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-pub-sky underline underline-offset-2"
        >
          {part.label}
        </a>
      );
    }
    return <span key={`text-${index}`}>{part.value}</span>;
  });
}

const CATEGORIES: Category[] = [
  {
    icon: "🏠",
    label: "Memulai & Akun",
    articles: [
      { q: "Bagaimana cara mendaftar?", a: "Klik 'Daftar Sekarang' di halaman utama. Isi data email dan buat password. Setelah verifikasi email, lengkapi profil BUJK Anda di halaman Onboarding." },
      { q: "Bagaimana cara masuk/login?", a: "Buka halaman Login, masukkan email dan password yang terdaftar. Jika lupa password, klik 'Lupa password?' untuk reset via email." },
      { q: "Cara mengubah profil saya?", a: "Masuk ke menu Profil di sidebar. Anda dapat mengubah nama, jabatan, foto profil, dan data BUJK di sini." },
    ],
  },
  {
    icon: "📋",
    label: "Assessment & Kompetensi",
    articles: [
      { q: "Apa itu Pre-test Kompetensi?", a: "Pre-test memberi gambaran awal kemampuan pada materi assessment. Gunakan hasil dan rekomendasi yang tersedia sebagai bahan belajar, bukan sebagai sertifikasi atau penilaian resmi." },
      { q: "Bagaimana cara mengikuti assessment?", a: "Buka menu Assessment, mulai sesi, jawab soal, lalu periksa Review Jawaban sebelum mengirim. Waktu mengikuti acuan server. Jawaban yang tersimpan di server sebelum tenggat yang dinilai; jangan menunggu sampai detik terakhir untuk menyimpan." },
      { q: "Apa arti skor dan level kompetensi?", a: "Baca rincian skor, level, dan rekomendasi yang ditampilkan pada hasil assessment. Interpretasinya adalah panduan belajar internal PUB, bukan bukti pemenuhan standar atau keputusan lembaga berwenang." },
    ],
  },
  {
    icon: "🎓",
    label: "Pusat Pembelajaran PUB",
    articles: [
      { q: "Bagaimana cara mengikuti pembelajaran?", a: "Buka Pusat Pembelajaran PUB atau LMS ASPEKINDO, pilih kursus dan pelajaran yang tersedia, lalu ikuti materi serta kuis yang diwajibkan. Periksa status progres setelah tiap langkah." },
      { q: "Apa itu sesi SIAP PUB?", a: "SIAP PUB adalah sesi pembelajaran sebagai bagian dari pelaksanaan Pengembangan Usaha Berkelanjutan. Materinya membantu anggota BUJK memahami PUB dan mengarahkan penerapannya secara lebih terstruktur." },
      { q: "Di mana melihat kesiapan 4 SIAP?", a: "Setelah masuk, buka menu <a href='/siap-kompetensi' class='text-pub-sky underline'>Peta Kompetensi 4 SIAP</a>. Halaman tersebut merangkum kesiapan Legalitas, Sertifikasi, Tender, dan Proyek dari data internal yang sudah tersedia." },
      { q: "Apa yang terjadi setelah menyelesaikan kuis?", a: "Nilai dan status lulus mengikuti bobot serta batas lulus yang ditampilkan untuk kuis tersebut. Jawaban dinilai oleh server. Jika belum lulus, ikuti petunjuk untuk mencoba lagi dan periksa progres pelajaran." },
      { q: "Di mana melihat sertifikat?", a: "Jika kegiatan atau kursus menerbitkan sertifikat, buka menu Sertifikat untuk melihat yang tersedia. Sertifikat PUB adalah catatan pembelajaran atau pencapaian internal, bukan pengganti SBU, SKK, sertifikat ISO, atau sertifikat resmi lembaga lain." },
    ],
  },
  {
    icon: "📊",
    label: "LKUT, PANCEK & SMAP",
    articles: [
      { q: "Apa itu LKUT?", a: "LKUT (Laporan Kegiatan Usaha Tahunan) adalah laporan tahunan BUJK dengan rujukan Permen PUPR Nomor 7 Tahun 2024 tentang Pengembangan Usaha Berkelanjutan. Program PUB ASPEKINDO membantu anggota menyiapkan data dan dokumen pendukungnya melalui ekosistem digital." },
      { q: "Apa rujukan PUB-LKUT dan LSBUKI?", a: "Rujukan utama PUB-LKUT terdiri dari Permen PUPR Nomor 7 Tahun 2024 dan Program PUB ASPEKINDO. PP Nomor 28 Tahun 2025 serta Permen PU Nomor 6 Tahun 2025 menjadi rujukan pendukung. Untuk informasi Lembaga Sertifikasi Badan Usaha Konstruksi Indonesia, kunjungi <a href='https://lsbukonstruksi.co.id' target='_blank' rel='noopener noreferrer' class='text-pub-sky underline'>lsbukonstruksi.co.id</a>." },
      { q: "Apa isi Program PUB ASPEKINDO?", a: "PUB ASPEKINDO menyediakan fitur pembelajaran, assessment, pengelolaan profil dan dokumen di Ruang Simpan, alat kerja proyek, layanan konsultasi, dan bantuan AI. Gunakan petunjuk pada tiap fitur; sinkronisasi atau pertukaran data tidak otomatis berlaku untuk semua layanan." },
      { q: "Apa itu PANCEK?", a: "PANCEK adalah fitur penilaian mandiri dan pengelolaan informasi terkait capaian kompetensi. Periksa status serta petunjuk di halaman PANCEK; hasil aplikasi bukan keputusan verifikasi lembaga berwenang." },
      { q: "Apa itu SMAP?", a: "SMAP membantu mencatat informasi dan bukti terkait Sistem Manajemen Anti Penyuapan. Gunakan sebagai alat bantu internal dan verifikasi penerapan terhadap standar serta persyaratan yang berlaku." },
      ...KEPDIRJEN_281_FAQS.map(({ question: q, answer: a }) => ({ q, a })),
    ],
  },
  {
    icon: "🏗️",
    label: "Proyek & Manajemen",
    articles: [
      { q: "Apa itu menu Proyek Saya?", a: "Menu Proyek membantu Anda mencatat dan meninjau data proyek di PUB. Lengkapi informasi pada proyek yang tepat dan periksa hasil simpan sebelum menggunakannya pada laporan lain." },
      { q: "Bagaimana cara pakai Risk Register?", a: "Buka Risk Register, pilih proyek, lalu catat risiko dan rencana mitigasinya. Periksa kembali pemilik risiko, dampak, dan tindak lanjut sesuai data proyek Anda." },
      { q: "Apa fungsi K3 Checklist?", a: "K3 Checklist membantu mencatat pemeriksaan dan tindak lanjut K3. Checklist aplikasi tidak menggantikan inspeksi lapangan, dokumen keselamatan, atau verifikasi kepatuhan." },
      { q: "Apa hubungan PUB dengan DokumenProyek?", a: "DokumenProyek berada dalam satu ekosistem pengembangan, tetapi merupakan layanan dengan domain dan alur tersendiri. Jangan menganggap akun, dokumen, atau data tersinkron otomatis; periksa layanan tujuan sebelum melanjutkan." },
    ],
  },
  {
    icon: "🤖",
    label: "AI Mentor & Helpdesk Aplikasi",
    articles: [
      { q: "Apa itu AI Mentor?", a: "AI Mentor dan Pakar Cerdas membantu menjelaskan materi atau pertanyaan sesuai mode yang dipilih. Periksa sumber jawaban dan verifikasi informasi penting sebelum bertindak." },
      { q: "Apa fungsi Helpdesk Aplikasi?", a: "Helpdesk menyediakan tab Panduan untuk menelusuri FAQ dan tab Tanya HelpDesk untuk bertanya. Anda juga bisa membuka Pusat Bantuan untuk langkah penggunaan per fitur." },
      { q: "Apakah Helpdesk memakai acuan Ruang Simpan?", a: "Tidak secara otomatis. Di Helpdesk AI, centang pilihan penggunaan acuan bisnis Ruang Simpan bila Anda ingin profil dan potongan dokumen terpilih dipakai untuk pesan berikutnya. Matikan pilihan itu jika tidak ingin mengirim konteks tersebut." },
      { q: "Bagaimana kuota AI dihitung?", a: "Halaman Helpdesk AI menampilkan batas lokal aplikasi akun dan waktu reset bila tersedia. Batas ini bukan saldo penyedia AI; server memeriksa setiap pengiriman. Model tidak diganti otomatis saat kuota atau layanan bermasalah." },
    ],
  },
  {
    icon: "🗂️",
    label: "Ruang Simpan & layanan AI",
    articles: [
      { q: "Apa fungsi Ruang Simpan?", a: "Ruang Simpan menjadi acuan utama profil perusahaan dan dokumen PUB. Anda tetap memilih sumber pada fitur yang mendukungnya; perubahan data tidak otomatis menjalankan ulang analisis atau mengirim semua berkas ke AI. PUB tidak terintegrasi dengan Gustafta." },
      { q: "Bagaimana memakai Bedah Dokumen?", a: "Masuk ke Bedah Dokumen, unggah PDF/TXT/JPG/PNG atau pilih berkas milik Anda dari Ruang Simpan. Persetujuan analisis AI berlaku untuk dokumen terpilih; OCR untuk berkas pindai memerlukan persetujuan terpisah. Periksa cakupan ekstraksi, kutipan, dan dokumen asli." },
      { q: "Apa yang terjadi bila dokumen berubah setelah dianalisis?", a: "Hasil sebelumnya tetap menjadi catatan saat dibuat. Jika sumber Ruang Simpan berubah, periksa pemberitahuan versi dan jalankan analisis ulang secara sengaja setelah teks terbaru siap; chat tidak memakai hasil lama sebagai telaah terbaru." },
      { q: "Apa itu Brain Project?", a: "Brain Project menggabungkan fakta proyek yang Anda isi dengan perhitungan Earned Value (EVM) bila datanya tersedia, lalu dapat meminta satu analisis AI dari enam sudut pandang. Analisis perlu login dan persetujuan per sesi; fitur ini tidak memantau proyek di latar belakang." },
      { q: "Bagaimana Konsultasi terpandu bekerja?", a: "Masuk, pilih peran, lalu gunakan tiga tahap: Diagnosis, Eksplorasi, dan Blueprint. Tahap hanya berlanjut setelah jawaban AI berhasil diterima. Periksa hasil dan sesuaikan dengan kondisi serta bukti proyek Anda." },
      { q: "Bagaimana menggunakan Klinik Konsultasi?", a: "Pilih loket topik dan masuk untuk memulai. Persetujuan pengiriman pesan ke AI dan penggunaan acuan Ruang Simpan adalah pilihan terpisah. Jika meminta operator PUB, tulis dan kirim ringkasan sendiri; transkrip chat tidak otomatis diteruskan dan waktu respons tidak dijanjikan." },
      { q: "Apakah data PUB tersinkron otomatis ke semua fitur?", a: "Tidak. Ruang Simpan adalah acuan utama profil dan dokumen, tetapi tiap fitur hanya memakai data yang didukung dan dipilih dalam alurnya. Persetujuan tetap diperlukan untuk pengiriman konteks ke layanan AI eksternal. Tidak ada integrasi data PUB dengan Gustafta." },
    ],
  },
  {
    icon: "🏆",
    label: "Leaderboard & Nilai",
    articles: [
      { q: "Apa itu Performance Grade?", a: "Performance Grade merangkum indikator yang tersedia pada periode penilaian. Buka halaman Grade untuk melihat komponen, status data, dan catatan perhitungannya." },
      { q: "Bagaimana sistem poin bekerja?", a: "Poin dan capaian mengikuti aktivitas serta aturan yang ditampilkan di halaman terkait. Periksa rincian di Dashboard atau Leaderboard; jangan mengasumsikan nilai tetap untuk aktivitas yang tidak dijelaskan di sana." },
      { q: "Apa manfaat masuk Leaderboard?", a: "Leaderboard menampilkan peringkat berdasarkan data yang tersedia di aplikasi. Peringkat tidak menjamin promosi, kemitraan, tender, pengakuan resmi, atau hasil bisnis tertentu." },
    ],
  },
  {
    icon: "🛒",
    label: "Marketplace & Direktori",
    articles: [
      { q: "Apa itu Marketplace PUB?", a: "Marketplace menampilkan produk atau penawaran yang tersedia. Periksa deskripsi, harga, syarat, dan status pesanan sebelum membeli atau mengunduh." },
      { q: "Bagaimana cara memperbarui Direktori?", a: "Buka Profil dan periksa data perusahaan yang digunakan untuk Direktori. Publikasi atau perubahan mengikuti pengaturan dan status yang ditampilkan aplikasi; jangan menganggap semua data profil langsung tampil." },
      { q: "Apa itu Inovasi PUB?", a: "Innovation Hub adalah ruang berbagi inovasi, praktik terbaik, dan solusi konstruksi antar anggota ASPEKINDO untuk mendorong daya saing BUJK." },
    ],
  },
];

const ALL_ARTICLES = CATEGORIES.flatMap((c) => c.articles.map((a) => ({ ...a, catLabel: c.label })));

const FALLBACK_MSG = "Maaf, saya tidak dapat menjawab saat ini. Silakan telusuri kategori di tab Panduan, hubungi kami di <a href='https://aspekindo.id' target='_blank' class='text-pub-sky underline'>aspekindo.id</a>, atau kunjungi <a href='https://lsbukonstruksi.co.id' target='_blank' class='text-pub-sky underline'>lsbukonstruksi.co.id</a>.";

// Cari jawaban di knowledge base lokal (prioritas utama)
function findKBAnswer(query: string): string | null {
  const q = query.toLowerCase();
  // Stopwords umum yang diabaikan
  const stopwords = new Set(["apa","itu","ini","yang","dan","di","ke","dari","cara","bagaimana","apakah","bisa","saya","ada","tidak","untuk","dengan","atau","juga","sudah","bisa","boleh","ya","dong","dong","kah","lah","tolong","jelaskan","ceritakan","tentang"]);
  const words = q.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w));

  if (words.length === 0) return null;

  let bestScore = 0;
  let bestAnswer: string | null = null;

  for (const art of ALL_ARTICLES) {
    const haystack = (art.q + " " + art.a).toLowerCase();
    let score = 0;
    for (const w of words) {
      if (haystack.includes(w)) score++;
    }
    // Bonus jika kata kunci utama ada di pertanyaan KB
    const qHaystack = art.q.toLowerCase();
    for (const w of words) {
      if (qHaystack.includes(w)) score += 1.5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = art.a;
    }
  }

  // Hanya pakai jawaban KB jika skor cukup (minimal 2 kata cocok)
  return bestScore >= 2 ? bestAnswer : null;
}

async function askAI(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const res = await fetch("/api/helpdesk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.slice(-10).map((m) => ({ ...m, content: m.content.slice(0, 4000) })) }),
      signal: AbortSignal.timeout(35_000),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      return typeof error?.error === "string" ? error.error : `Layanan AI belum tersedia. ${FALLBACK_MSG}`;
    }
    const data = await res.json();
    if (typeof data?.reply !== "string" || !data.reply.trim()) return `Layanan AI belum memberikan jawaban. ${FALLBACK_MSG}`;
    return data.reply;
  } catch {
    return `Layanan AI belum dapat dihubungi. ${FALLBACK_MSG}`;
  }
}

export default function FloatingChatbot({ variant = "dashboard", initialOpen = false, standalone = false }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(standalone || initialOpen);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [tab, setTab] = useState<"browse" | "chat">("browse");
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [openArticle, setOpenArticle] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { from: "bot", text: "Halo! Ada yang bisa saya bantu mengenai fitur-fitur platform PUB ASPEKINDO?" },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, tab]);

  const handleOpen = () => { setIsOpen(true); setHasInteracted(true); };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedCat(null);
    setSearch("");
    setOpenArticle(null);
  };

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || aiLoading) return;

    setChatHistory((h) => [...h, { from: "user", text }]);
    setChatInput("");

    // Prioritas 1: cari di knowledge base lokal
    const kbAnswer = findKBAnswer(text);
    if (kbAnswer) {
      setChatHistory((h) => [...h, { from: "bot", text: kbAnswer }]);
      return;
    }

    // Prioritas 2: tanya AI jika KB tidak punya jawaban
    setAiLoading(true);
    const aiMessages = [
      ...chatHistory
        .filter((m) => m.from === "user" || m.from === "bot")
        .slice(-10)
        .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text })),
      { role: "user", content: text },
    ];
    const reply = await askAI(aiMessages);
    setAiLoading(false);
    setChatHistory((h) => [...h, { from: "bot", text: reply }]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const searchResults = search.trim().length > 1
    ? ALL_ARTICLES.filter((a) => a.q.toLowerCase().includes(search.toLowerCase()) || a.a.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <>
      {/* Floating button — LEFT */}
      <AnimatePresence mode="wait">
        {!isOpen && !standalone && (
          <motion.div
            key="helpdesk-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 left-6 z-50"
          >
            {!hasInteracted && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3 }}
                className="absolute bottom-16 left-0 bg-card border border-border rounded-xl px-3 py-2 shadow-card text-xs font-body text-foreground whitespace-nowrap pointer-events-none"
              >
                 ❓ Panduan & Cara Pakai aplikasi PUB
              </motion.div>
            )}
            <button
              onClick={handleOpen}
               title="Panduan & Cara Pakai aplikasi PUB"
              id="floating-helpdesk-btn"
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-pub-sky to-pub-navy hover:brightness-110 transition-all border-2 border-[hsl(0,0%,100%)/20%] relative"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {!hasInteracted && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pub-sky opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-pub-sky" />
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="helpdesk-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${standalone ? "relative w-full max-w-3xl mx-auto rounded-3xl shadow-2xl" : "fixed bottom-6 left-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl"} overflow-hidden border border-border bg-card flex flex-col`}
            style={{ height: standalone ? "min(680px, calc(100vh - 180px))" : "540px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pub-sky to-pub-navy px-4 py-3 flex items-center gap-3 shrink-0">
              {tab === "browse" && selectedCat && (
                <button
                  onClick={() => { setSelectedCat(null); setOpenArticle(null); }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm font-heading leading-none">PUB HelpDesk</p>
                 <p className="text-white/60 text-xs font-body mt-0.5">Panduan & Cara Pakai aplikasi PUB dan chatbot LKUT-PUB-LSBUKI</p>
              </div>
              {!standalone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-border shrink-0">
              <button
                onClick={() => setTab("browse")}
                className={`flex-1 py-2 text-xs font-semibold font-heading transition-colors ${tab === "browse" ? "text-pub-sky border-b-2 border-pub-sky" : "text-muted-foreground hover:text-foreground"}`}
              >
                📚 Panduan
              </button>
              <button
                onClick={() => setTab("chat")}
                className={`flex-1 py-2 text-xs font-semibold font-heading transition-colors ${tab === "chat" ? "text-pub-sky border-b-2 border-pub-sky" : "text-muted-foreground hover:text-foreground"}`}
              >
                💬 Tanya HelpDesk
              </button>
            </div>

            {/* ── TAB: BROWSE ── */}
            {tab === "browse" && (
              <>
                {!selectedCat && (
                  <div className="px-3 pt-3 pb-2 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Cari panduan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-1 focus:ring-pub-sky"
                      />
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto">
                  {/* Search results */}
                  {!selectedCat && search.trim().length > 1 && (
                    <div className="p-3 space-y-2">
                      {searchResults.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-body text-center py-4">Tidak ditemukan. Coba di tab 💬 Tanya HelpDesk.</p>
                      ) : (
                        searchResults.map((r, i) => (
                          <div key={i} className="rounded-xl border border-border p-3">
                            <p className="text-xs text-pub-sky font-heading mb-0.5">{r.catLabel}</p>
                            <p className="text-xs font-semibold font-heading text-foreground mb-1">{r.q}</p>
                            <p className="text-xs text-muted-foreground font-body leading-relaxed">{r.a}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {/* Category list */}
                  {!selectedCat && search.trim().length <= 1 && (
                    <div className="p-3 space-y-1.5">
                      <p className="text-xs text-muted-foreground font-body px-1 mb-2">Pilih topik bantuan:</p>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.label}
                          onClick={() => { setSelectedCat(cat); setOpenArticle(null); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 hover:border-pub-sky/30 transition-all text-left group"
                        >
                          <span className="text-base shrink-0">{cat.icon}</span>
                          <span className="text-xs font-semibold font-heading text-foreground flex-1">{cat.label}</span>
                          <span className="text-xs text-muted-foreground font-body shrink-0">{cat.articles.length}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-pub-sky transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Articles in category */}
                  {selectedCat && (
                    <div className="p-3 space-y-2">
                      {selectedCat.articles.map((article, i) => (
                        <div key={i} className="rounded-xl border border-border overflow-hidden">
                          <button
                            className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
                            onClick={() => setOpenArticle(openArticle === i ? null : i)}
                          >
                            <ChevronDown className={`w-4 h-4 text-pub-sky shrink-0 transition-transform ${openArticle === i ? "rotate-180" : ""}`} />
                            <span className="text-xs font-semibold font-heading text-foreground">{article.q}</span>
                          </button>
                          <AnimatePresence>
                            {openArticle === i && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs text-muted-foreground font-body px-3 pb-3 pt-1 leading-relaxed border-t border-border">
                                   <ChatbotContent value={article.a} />
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TAB: CHAT ── */}
            {tab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.from === "bot" && (
                        <div className="w-6 h-6 rounded-full bg-pub-sky/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                          <MessageCircle className="w-3 h-3 text-pub-sky" />
                        </div>
                      )}
                       <div
                         className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs font-body leading-relaxed whitespace-pre-line ${
                           msg.from === "user"
                             ? "bg-pub-sky text-white rounded-br-sm"
                             : "bg-muted text-foreground rounded-bl-sm border border-border"
                         }`}
                       >
                         <ChatbotContent value={msg.text} />
                       </div>
                    </div>
                  ))}

                  {/* AI typing indicator */}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-full bg-pub-sky/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <MessageCircle className="w-3 h-3 text-pub-sky" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm border border-border px-3 py-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pub-sky animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-pub-sky animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-pub-sky animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className="border-t border-border p-3 shrink-0">
                  <div className="flex gap-2 items-end">
                    <input
                      type="text"
                      placeholder="Ketik pertanyaan Anda..."
                      value={chatInput}
                      maxLength={4000}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground font-body focus:outline-none focus:ring-1 focus:ring-pub-sky resize-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || aiLoading}
                      className="w-9 h-9 rounded-xl bg-pub-sky flex items-center justify-center text-white hover:bg-pub-sky/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground font-body mt-1.5 text-center">
                    Tekan Enter untuk kirim · PUB ASPEKINDO HelpDesk
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
