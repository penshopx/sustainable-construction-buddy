import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, CheckCircle, ClipboardCheck, GraduationCap, Wrench,
  BarChart3, Shield, FileText, Building2, ShoppingBag, Bot,
  Award, Lightbulb, BookCheck, Zap, MessageSquare, Map,
} from "lucide-react";

const pillars = [
  { icon: ClipboardCheck, title: "Assessment & Pre-test", desc: "Tentukan level kompetensi personil secara digital & objektif" },
  { icon: GraduationCap, title: "E-Course & Modul", desc: "Pembelajaran terstruktur per level dari Pemula hingga Utama" },
  { icon: Wrench, title: "Mini Apps & Generator", desc: "Risk Register, Budget Tracker, K3 Checklist, dan tools lainnya" },
  { icon: BarChart3, title: "Kinerja & Grading", desc: "Scoring otomatis empat pilar kinerja dengan grade terverifikasi" },
  { icon: Shield, title: "SMAP, PANCEK, & K3", desc: "Sistem Anti Penyuapan, Panduan Cegah Korupsi, dan manajemen K3" },
  { icon: FileText, title: "LKUT Digital", desc: "Laporan Kegiatan Usaha Tahunan untuk perpanjangan SBU" },
  { icon: Building2, title: "Direktori BUJK", desc: "Profil perusahaan & jaringan antar BUJK se-Indonesia" },
  { icon: Bot, title: "AI Mentor", desc: "Konsultan AI untuk manajemen konstruksi kapan saja" },
  { icon: Award, title: "Sertifikat Digital", desc: "Bukti kompetensi terverifikasi untuk portofolio profesional" },
  { icon: Lightbulb, title: "Inovasi PUB", desc: "Dari tender intelligence hingga ESG — semua dalam satu roadmap" },
  { icon: ShoppingBag, title: "Marketplace", desc: "Jual beli template, tools, dan produk digital konstruksi" },
  { icon: BookCheck, title: "Compliance Tracker", desc: "Monitor kepatuhan regulasi dan sertifikasi real-time" },
];

const pubPrograms = [
  "Peningkatan kualitas manajemen BUJK secara terstruktur",
  "Pemenuhan persyaratan LKUT tahunan secara digital",
  "Penilaian PANCEK dan penerapan SMAP terintegrasi",
  "Workshop, webinar, dan belajar mandiri berbasis modul",
  "Kegiatan kolaborasi antar anggota ASPEKINDO",
  "Dokumentasi bukti PUB untuk perpanjangan SBU",
];

const TheOneThingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* AIDA: Desire — positioning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-14 h-14 rounded-xl bg-pub-amber/15 flex items-center justify-center">
              <Zap className="w-7 h-7 text-pub-amber" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-foreground leading-tight">
            Satu Platform.{" "}
            <span className="text-gradient-hero">Semua Solusi.</span>
          </h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto font-body leading-relaxed">
            PUB ASPEKINDO mengintegrasikan assessment, pembelajaran, toolkit, grading, compliance, dan inovasi
            dalam satu ekosistem digital — dirancang khusus untuk BUJK Indonesia.
          </p>
        </motion.div>

        {/* Before vs After */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-destructive/5 border border-destructive/15"
          >
            <h3 className="text-lg font-bold font-heading text-destructive mb-4">❌ Tanpa PUB ASPEKINDO</h3>
            <ul className="space-y-3 text-sm text-muted-foreground font-body">
              {[
                "Dokumen berserakan, tidak terorganisir",
                "Tidak ada bukti PUB untuk perpanjangan SBU",
                "Kompetensi personil tidak terukur",
                "Grading kinerja manual & subjektif",
                "Sulit bersaing di tender, rentan gagal audit",
                "Biaya operasional tinggi tanpa efisiensi sistem",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-pub-emerald/5 border border-pub-emerald/15"
          >
            <h3 className="text-lg font-bold font-heading text-pub-emerald mb-4">✅ Dengan PUB ASPEKINDO</h3>
            <ul className="space-y-3 text-sm text-muted-foreground font-body">
              {[
                "Semua dokumen terpusat di satu dashboard",
                "Bukti PUB otomatis terdokumentasi",
                "Level kompetensi terukur dan terverifikasi",
                "Grading kinerja otomatis dan objektif",
                "Siap audit, kompetitif di tender",
                "Operasional lebih efisien dan profesional",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-pub-emerald shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
          {pillars.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-pub-amber/10 flex items-center justify-center mb-3 group-hover:bg-pub-amber/20 transition-colors">
                <f.icon className="w-5 h-5 text-pub-amber" />
              </div>
              <h3 className="text-sm font-bold font-heading text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Program PUB */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 p-8 rounded-2xl bg-gradient-to-br from-pub-amber/10 to-pub-amber/5 border border-pub-amber/20"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-pub-amber/15 text-pub-amber text-xs font-semibold font-heading uppercase tracking-wider mb-3">
                Program PUB ASPEKINDO
              </span>
              <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground mb-3">
                Membangun BUJK yang Lebih Berkualitas
              </h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                Program PUB dirancang untuk membantu BUJK memenuhi seluruh kewajiban regulasi sekaligus 
                meningkatkan kapasitas manajerial secara berkelanjutan melalui berbagai kegiatan terstruktur.
              </p>
            </div>
            <ul className="space-y-3">
              {pubPrograms.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground font-body">
                  <CheckCircle className="w-4 h-4 text-pub-amber shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Dialog Gustafta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-[hsl(220,60%,12%)] to-[hsl(220,50%,18%)] border border-[hsl(0,0%,100%)/10%] text-white"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pub-amber/20 border border-pub-amber/30 text-pub-amber text-xs font-semibold font-heading uppercase tracking-wider mb-4">
                <MessageSquare className="w-3.5 h-3.5" />
                Dialog AI Gustafta
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-heading text-white mb-3">
                Petakan Potensi BUJK Anda dengan Dialog Cerdas
              </h3>
              <p className="text-[hsl(0,0%,75%)] font-body leading-relaxed mb-6">
                PUB ASPEKINDO menghadirkan <strong className="text-white">Dialog Gustafta</strong> — platform AI yang 
                membantu memetakan problem BUJK secara spesifik dan personal. Melalui dialog interaktif, 
                dapatkan <em className="text-pub-amber">Blue Print Potensi Diri</em> yang menjadi peta jalan 
                pengembangan BUJK Anda ke depan.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Identifikasi problem BUJK secara mendalam & personal",
                  "Dapatkan rekomendasi solusi berbasis kondisi nyata",
                  "Bangun kolaborasi untuk profil BUJK yang lebih baik",
                  "Tingkatkan efisiensi, profesionalitas & produktivitas",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[hsl(0,0%,80%)] font-body">
                    <Map className="w-4 h-4 text-pub-amber shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="https://dialog.aspekindo-pub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading shadow-amber hover:brightness-110 transition-all"
              >
                Mulai Dialog dengan Gustafta <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-xs text-[hsl(0,0%,50%)] mt-2 font-body">
                dialog.aspekindo-pub.com
              </p>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="w-full max-w-xs p-6 rounded-2xl bg-[hsl(0,0%,100%)/5%] border border-[hsl(0,0%,100%)/10%] text-center">
                <div className="w-20 h-20 rounded-2xl bg-pub-amber/20 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-pub-amber" />
                </div>
                <p className="text-white font-bold font-heading text-lg mb-1">Gustafta AI</p>
                <p className="text-[hsl(0,0%,65%)] text-sm font-body mb-4">Platform Dialog Cerdas ASPEKINDO</p>
                <div className="space-y-2 text-left">
                  {["Analisis kebutuhan BUJK", "Blue Print Potensi Diri", "Rekomendasi program PUB", "Kolaborasi & networking"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-[hsl(0,0%,70%)] font-body">
                      <div className="w-1.5 h-1.5 rounded-full bg-pub-amber" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading shadow-amber hover:brightness-110 transition-all"
          >
            Bergabung & Jadilah Kontraktor Berdaya Saing <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-muted-foreground mt-3 font-body">Platform resmi ASPEKINDO untuk personil manajerial BUJK Indonesia.</p>
        </div>
      </div>
    </section>
  );
};

export default TheOneThingSection;
