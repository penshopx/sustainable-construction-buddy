import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, ArrowRight, Map, Bot, ExternalLink,
  Brain, Target, Lightbulb, Users, CheckCircle
} from "lucide-react";

const GUSTAFTA_URL = "https://dialog.aspekindo-pub.com";

const capabilities = [
  { icon: Map, title: "Pemetaan Problem BUJK", desc: "Dialog Socratic untuk mengidentifikasi akar masalah BUJK Anda secara mendalam dan personal." },
  { icon: Target, title: "Blue Print Potensi Diri", desc: "Hasilkan peta jalan pengembangan BUJK yang spesifik sesuai kondisi dan potensi nyata Anda." },
  { icon: Brain, title: "Asisten Regulasi & Kepatuhan", desc: "Konsultasi regulasi jasa konstruksi, SBU, LKUT, PANCEK, dan SMAP kapan saja." },
  { icon: Lightbulb, title: "Rekomendasi Program PUB", desc: "Dapatkan rekomendasi kegiatan, modul, dan langkah konkret berdasarkan kondisi BUJK Anda." },
  { icon: Users, title: "Kolaborasi & Jaringan", desc: "Temukan peluang kolaborasi dan sinergi antar anggota ASPEKINDO yang relevan." },
  { icon: Bot, title: "Tim AI yang Bekerja Bersama", desc: "Bukan sekadar chatbot — Gustafta adalah tim AI berbasis pengetahuan ASPEKINDO & konstruksi." },
];

const steps = [
  { num: "01", title: "Mulai Dialog", desc: "Klik tombol untuk membuka Gustafta Socratic Dialog. Ceritakan kondisi BUJK Anda." },
  { num: "02", title: "Dialog Interaktif", desc: "Gustafta mengajukan pertanyaan mendalam untuk memahami kebutuhan spesifik Anda." },
  { num: "03", title: "Blue Print", desc: "Dapatkan Blueprint Potensi Diri — peta jalan pengembangan BUJK yang personal." },
  { num: "04", title: "Tindak Lanjut", desc: "Implementasikan rekomendasi melalui fitur-fitur platform PUB ASPEKINDO." },
];

export default function AiPubHelpdesk() {
  const [dialogOpened, setDialogOpened] = useState(false);

  const openDialog = () => {
    window.open(GUSTAFTA_URL, "gustafta-dialog", "width=460,height=700,resizable=yes,scrollbars=yes");
    setDialogOpened(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-br from-[hsl(220,60%,14%)] to-[hsl(225,55%,22%)] p-8 border border-[hsl(0,0%,100%)/10%]">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pub-amber/20 border border-pub-amber/30 text-pub-amber text-xs font-semibold font-heading uppercase tracking-wider mb-4">
                <Bot className="w-3.5 h-3.5" />
                AI PUB HelpDesk · Powered by Gustafta
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-white mb-3 leading-snug">
                Ubah Pengetahuan & Pengalaman BUJK Anda Menjadi{" "}
                <span className="text-pub-amber">Teman Berpikir Digital</span>
              </h1>
              <p className="text-[hsl(0,0%,68%)] font-body leading-relaxed mb-6 max-w-xl">
                AI PUB HelpDesk menggunakan platform <strong className="text-white">Gustafta Socratic Dialog</strong> yang diperkaya 
                dengan pengetahuan ASPEKINDO — regulasi konstruksi, program PUB, LKUT, PANCEK, dan SMAP — 
                untuk memberikan pendampingan yang personal dan kontekstual.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={openDialog}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading shadow-amber hover:brightness-110 transition-all"
                >
                  Mulai Gustafta Socratic Dialog <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href={GUSTAFTA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[hsl(0,0%,100%)/15%] text-[hsl(0,0%,75%)] font-semibold font-heading hover:bg-[hsl(0,0%,100%)/6%] transition-all text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka di Tab Baru
                </a>
              </div>

              {dialogOpened && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-pub-emerald text-sm font-body"
                >
                  <CheckCircle className="w-4 h-4" />
                  Dialog sudah dibuka! Lanjutkan di jendela Gustafta.
                </motion.div>
              )}
            </div>

            {/* Right card */}
            <div className="md:w-64 shrink-0 p-5 rounded-xl bg-[hsl(0,0%,100%)/5%] border border-[hsl(0,0%,100%)/10%]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pub-amber/20 flex items-center justify-center">
                  <span className="text-pub-amber font-extrabold text-lg font-heading">G</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm font-heading leading-none">GUSTAFTA</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[hsl(0,0%,55%)] text-xs font-body">Online · Siap melayani</span>
                  </div>
                </div>
              </div>
              <p className="text-[hsl(0,0%,55%)] text-xs font-body mb-3">Platform Perakit AI — No Code</p>
              <div className="space-y-2">
                {["No-Code · Tanpa Coding", "Pengetahuan ASPEKINDO", "Socratic Dialog AI", "Blueprint Potensi Diri"].map((tag) => (
                  <div key={tag} className="flex items-center gap-2 text-xs text-[hsl(0,0%,65%)] font-body">
                    <div className="w-1.5 h-1.5 rounded-full bg-pub-amber shrink-0" />
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-bold font-heading text-foreground mb-5 flex items-center gap-2">
          <Bot className="w-5 h-5 text-pub-amber" />
          Kemampuan AI PUB HelpDesk
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="p-5 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-pub-amber/10 flex items-center justify-center mb-3 group-hover:bg-pub-amber/20 transition-colors">
                <c.icon className="w-5 h-5 text-pub-amber" />
              </div>
              <h3 className="text-sm font-bold font-heading text-foreground mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl border border-border p-6 shadow-card"
      >
        <h2 className="text-xl font-bold font-heading text-foreground mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pub-amber" />
          Cara Kerja Gustafta Socratic Dialog
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(50%+1.5rem)] w-[calc(100%-3rem)] h-px bg-border" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-pub-amber/10 border-2 border-pub-amber/30 flex items-center justify-center mb-3 relative z-10">
                  <span className="text-pub-amber font-extrabold font-heading text-sm">{s.num}</span>
                </div>
                <h3 className="text-sm font-bold font-heading text-foreground mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sinergi info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-xl bg-pub-amber/5 border border-pub-amber/20"
      >
        <h3 className="text-base font-bold font-heading text-foreground mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-pub-amber" />
          Sinergi AI PUB HelpDesk dengan Platform PUB ASPEKINDO
        </h3>
        <p className="text-sm text-muted-foreground font-body leading-relaxed mb-4">
          Hasil dialog Gustafta dapat langsung ditindaklanjuti di fitur-fitur platform PUB ASPEKINDO:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { link: "Ikuti rekomendasi modul", dest: "E-Course & Pembelajaran" },
            { link: "Penuhi persyaratan LKUT", dest: "Data LKUT" },
            { link: "Selesaikan PANCEK & SMAP", dest: "Modul PANCEK & SMAP" },
            { link: "Pantau kepatuhan regulasi", dest: "Compliance Tracker" },
            { link: "Kelola proyek & risiko", dest: "Project & Risk Register" },
            { link: "Lihat perkembangan skor", dest: "Performance Grade" },
          ].map((item) => (
            <div key={item.link} className="flex items-center gap-2 text-sm font-body">
              <CheckCircle className="w-4 h-4 text-pub-amber shrink-0" />
              <span className="text-foreground">{item.link}</span>
              <span className="text-muted-foreground">→ <em>{item.dest}</em></span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-center py-4"
      >
        <button
          onClick={openDialog}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading shadow-amber hover:brightness-110 transition-all text-base"
        >
          Mulai Gustafta Socratic Dialog Sekarang <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-xs text-muted-foreground mt-2 font-body">
          🔗 dialog.aspekindo-pub.com · Powered by{" "}
          <a href="https://gustafta.my.id" target="_blank" rel="noopener noreferrer" className="text-pub-amber hover:underline">
            gustafta.my.id
          </a>
        </p>
      </motion.div>
    </div>
  );
}
