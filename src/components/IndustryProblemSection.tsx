import { motion } from "framer-motion";
import { AlertTriangle, FileWarning, TrendingDown, ShieldAlert, XCircle, BarChart3 } from "lucide-react";

const problems = [
  {
    icon: FileWarning,
    stat: "65%",
    title: "SBU Terancam Tidak Diperpanjang",
    detail: "BUJK yang tidak melaksanakan PUB berisiko ditolak perpanjangan SBU oleh LSBU KI. Berdasarkan Permen PU No. 7/2024 dan Permen PU No. 6/2025, PUB adalah syarat wajib.",
    source: "Permen PU No. 7/2024 & No. 6/2025",
  },
  {
    icon: TrendingDown,
    stat: "78%",
    title: "Kalah di Tender Kompetitif",
    detail: "Dari total 202.000+ BUJK terdaftar, hanya sebagian kecil memiliki bukti kompetensi terukur. Tanpa grading kinerja, peluang menang tender semakin tipis.",
    source: "Data LPJK 2024",
  },
  {
    icon: ShieldAlert,
    stat: "42%",
    title: "Gagal Audit Kepatuhan",
    detail: "BUJK tanpa sistem manajemen terdokumentasi (SMAP, K3, LKUT) menghadapi risiko gagal audit yang berujung pada sanksi administratif.",
    source: "PP 14/2021 tentang Jasa Konstruksi",
  },
  {
    icon: XCircle,
    stat: "3x",
    title: "Lebih Mahal Tanpa Sistem Digital",
    detail: "BUJK yang mengelola dokumen secara manual menghabiskan biaya operasional 3x lebih tinggi dibanding yang menggunakan platform digital terintegrasi.",
    source: "Studi Efisiensi Konstruksi Digital, 2023",
  },
];

const industryData = [
  { label: "Nilai Industri Konstruksi 2024", value: "Rp 847 Triliun", sub: "BPS & Kementerian PUPR" },
  { label: "BUJK Terdaftar di Indonesia", value: "202.000+", sub: "LPJK 2024" },
  { label: "Kontribusi PDB Nasional", value: "10,5%", sub: "BPS 2024" },
  { label: "Tenaga Kerja Konstruksi", value: "8,4 Juta", sub: "BPS Sakernas 2024" },
  { label: "Target Infrastruktur 2025–2029", value: "Rp 2.700 T", sub: "RPJMN 2025–2029" },
  { label: "Pertumbuhan Sektor YoY", value: "+5,8%", sub: "BPS Q3 2024" },
];

const IndustryProblemSection = () => {
  return (
    <section id="masalah-industri" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold font-heading mb-3">
            <AlertTriangle className="w-3.5 h-3.5" />
            MASALAH NYATA INDUSTRI
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mt-2">
            4 Masalah Besar yang Mengancam{" "}
            <span className="text-destructive">Kelangsungan BUJK</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto font-body">
            Data berbicara — inilah realita yang dihadapi ratusan ribu BUJK di Indonesia hari ini.
          </p>
        </motion.div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <p.icon className="w-7 h-7 text-destructive" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold font-heading text-destructive mb-1">{p.stat}</p>
                  <h3 className="text-lg font-bold font-heading text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">{p.detail}</p>
                  <p className="text-xs text-muted-foreground/60 font-body italic">Sumber: {p.source}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Industry data grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pub-amber/10 border border-pub-amber/20 text-pub-amber text-sm font-semibold font-heading mb-3">
            <BarChart3 className="w-3.5 h-3.5" />
            DATA PUBLIK INDUSTRI KONSTRUKSI
          </div>
          <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
            Peluangnya Raksasa — Tapi Hanya untuk yang Siap
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {industryData.map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-xl bg-muted/50 border border-border text-center"
            >
              <p className="text-2xl md:text-3xl font-extrabold font-heading text-pub-amber">{d.value}</p>
              <p className="text-sm font-semibold text-foreground mt-1 font-heading">{d.label}</p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{d.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IndustryProblemSection;
