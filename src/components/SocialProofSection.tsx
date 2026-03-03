import { motion } from "framer-motion";
import { Building2, Users, Award, Layers, Shield, Globe } from "lucide-react";
import logoPub from "@/assets/logo-pub-new.png";
import logoAspekindo from "@/assets/logo-aspekindo.png";
import logoLsbuki from "@/assets/logo-lsbuki.webp";
import logoPu from "@/assets/logo-pu.png";


const credentials = [
  { value: "UU 02/2017", label: "Dasar Hukum", sub: "Undang-Undang Jasa Konstruksi" },
  { value: "Permen PU 7/2024", label: "Regulasi PUB", sub: "Persyaratan Perpanjangan SBU" },
  { value: "Permen PU 6/2025", label: "Regulasi Terbaru", sub: "Ketentuan Pelaksanaan PUB" },
  { value: "PP 14/2021", label: "Peraturan Pemerintah", sub: "Kewajiban BUJK" },
];

const reach = [
  { icon: Building2, value: "34", label: "Provinsi", sub: "Jangkauan Nasional" },
  { icon: Users, value: "5.000+", label: "Personil", sub: "Target Tahun Pertama" },
  { icon: Award, value: "4 Level", label: "Kompetensi", sub: "Pemula → Utama" },
  { icon: Layers, value: "6 Domain", label: "Keahlian", sub: "Komprehensif" },
  { icon: Shield, value: "100+", label: "Tools & Mini Apps", sub: "Siap Pakai" },
  { icon: Globe, value: "10 Pilar", label: "Inovasi PUB", sub: "Strategic Roadmap" },
];

const logos = [
  { src: logoPu, alt: "Kementerian PUPR", name: "Kementerian PUPR" },
  { src: logoPub, alt: "PUB ASPEKINDO", name: "PUB ASPEKINDO" },
  { src: logoAspekindo, alt: "ASPEKINDO", name: "ASPEKINDO" },
  { src: logoLsbuki, alt: "LSBU KI", name: "LSBU KI" },
];

const SocialProofSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Institutional logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider font-heading mb-6">
            Didukung & Diamanatkan Oleh
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {logos.map((logo) => (
              <div key={logo.name} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-xl bg-card border border-border shadow-card flex items-center justify-center p-3">
                  <img src={logo.src} alt={logo.alt} className="w-full h-full object-contain" />
                </div>
                <span className="text-xs font-semibold font-heading text-muted-foreground">{logo.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Legal basis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {credentials.map((c, i) => (
              <div key={c.value} className="p-4 rounded-xl bg-pub-amber/5 border border-pub-amber/15 text-center">
                <p className="text-lg font-extrabold font-heading text-pub-amber">{c.value}</p>
                <p className="text-sm font-semibold text-foreground mt-1 font-heading">{c.label}</p>
                <p className="text-xs text-muted-foreground font-body">{c.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform reach */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
            Ekosistem yang Dibangun untuk Skala Nasional
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {reach.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl bg-muted/50 border border-border text-center"
            >
              <r.icon className="w-6 h-6 text-pub-amber mx-auto mb-2" />
              <p className="text-2xl font-extrabold font-heading text-foreground">{r.value}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 font-heading">{r.label}</p>
              <p className="text-xs text-muted-foreground font-body">{r.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 p-6 rounded-xl bg-pub-amber/5 border border-pub-amber/20 text-center max-w-3xl mx-auto"
        >
          <p className="text-base italic text-muted-foreground font-body leading-relaxed">
            "Setiap Badan Usaha Jasa Konstruksi memiliki kewajiban melaksanakan kegiatan Pengembangan Usaha Berkelanjutan (PUB) untuk meningkatkan kapasitas dan daya saing."
          </p>
          <footer className="mt-3 text-sm font-semibold text-foreground not-italic font-heading">
            — PP 14/2021 tentang Perubahan PP 22/2020 tentang Jasa Konstruksi
          </footer>
        </motion.blockquote>
      </div>
    </section>
  );
};

export default SocialProofSection;
