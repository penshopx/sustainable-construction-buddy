import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, CheckCircle, ClipboardCheck, GraduationCap, Wrench,
  BarChart3, Shield, FileText, Building2, ShoppingBag, Bot,
  Award, Lightbulb, BookCheck, Zap,
} from "lucide-react";
import logoPub from "@/assets/logo-pub-new.png";

const pillars = [
  { icon: ClipboardCheck, title: "Assessment & Pre-test", desc: "Tentukan level kompetensi personil secara digital & objektif" },
  { icon: GraduationCap, title: "E-Course & Modul", desc: "Pembelajaran terstruktur per level dari Pemula hingga Utama" },
  { icon: Wrench, title: "100 Mini Apps & Generator", desc: "Risk Register, Budget Tracker, K3 Checklist, dan 97 tools lainnya" },
  { icon: BarChart3, title: "Kinerja & Grading A–E", desc: "Scoring otomatis 4 pilar kinerja dengan grade terverifikasi" },
  { icon: Shield, title: "SMAP, PANCEK, & K3", desc: "Sistem Anti Penyuapan, penilaian kinerja, dan manajemen K3" },
  { icon: FileText, title: "LKUT Digital", desc: "Laporan Kinerja Usaha Tahunan untuk perpanjangan SBU" },
  { icon: Building2, title: "Direktori BUJK", desc: "Profil perusahaan & jaringan antar BUJK se-Indonesia" },
  { icon: Bot, title: "AI Mentor 24/7", desc: "Konsultan AI untuk manajemen konstruksi kapan saja" },
  { icon: Award, title: "Sertifikat Digital", desc: "Bukti kompetensi terverifikasi untuk portofolio profesional" },
  { icon: Lightbulb, title: "100 Inovasi PUB", desc: "Dari tender intelligence hingga ESG — semua dalam satu roadmap" },
  { icon: ShoppingBag, title: "Marketplace", desc: "Jual beli template, tools, dan produk digital konstruksi" },
  { icon: BookCheck, title: "Compliance Tracker", desc: "Monitor kepatuhan regulasi dan sertifikasi real-time" },
];

const TheOneThingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* The One Thing positioning */}
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
            Tidak perlu 10 aplikasi terpisah. PUB ASPEKINDO mengintegrasikan 
            <strong className="text-foreground"> assessment, learning, toolkit, grading, compliance, dan inovasi </strong>
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
                "Dokumen berserakan di Excel & WhatsApp",
                "Tidak ada bukti PUB untuk perpanjangan SBU",
                "Kompetensi personil tidak terukur",
                "Grading kinerja manual & subjektif",
                "Gagal audit, kalah tender",
                "Biaya operasional 3x lebih mahal",
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
                "Level kompetensi terukur: Pemula → Utama",
                "Grading A–E otomatis & terverifikasi",
                "Siap audit, kompetitif di tender",
                "Efisiensi operasional hingga 70%",
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
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

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading shadow-amber hover:brightness-110 transition-all"
          >
            Mulai Gratis Sekarang <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs text-muted-foreground mt-3 font-body">Gratis untuk anggota ASPEKINDO. Tanpa kartu kredit.</p>
        </div>
      </div>
    </section>
  );
};

export default TheOneThingSection;
