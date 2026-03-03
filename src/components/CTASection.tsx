import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Clock, Headphones, CheckCircle } from "lucide-react";

const urgencyPoints = [
  "SBU Anda bisa tidak diperpanjang tanpa bukti PUB",
  "Kompetitor yang sudah digital akan menyalip Anda",
  "Regulasi Permen PU 6/2025 sudah berlaku efektif",
];

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-br from-[hsl(220,60%,12%)] via-[hsl(220,50%,16%)] to-[hsl(220,40%,20%)]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-heading text-[hsl(0,0%,97%)] mb-6 leading-tight">
            Jangan Tunggu Sampai{" "}
            <span className="text-gradient-hero">SBU Anda Dicabut</span>
          </h2>
          <p className="text-lg text-[hsl(0,0%,65%)] font-body mb-8 leading-relaxed">
            Ribuan BUJK di seluruh Indonesia sudah mulai bergerak. 
            Pertanyaannya bukan <em>apakah</em> Anda harus bergabung — tapi <em>kapan</em>.
          </p>

          {/* Urgency checklist */}
          <div className="space-y-3 mb-10 text-left max-w-md mx-auto">
            {urgencyPoints.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-pub-amber shrink-0 mt-0.5" />
                <p className="text-sm text-[hsl(0,0%,75%)] font-body">{point}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading text-lg shadow-amber hover:brightness-110 transition-all"
          >
            Daftar Gratis Sekarang <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-[hsl(0,0%,50%)] mt-3 font-body">
            Gratis untuk anggota ASPEKINDO. Setup kurang dari 5 menit.
          </p>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[
              { icon: Shield, label: "Data Aman & Terenkripsi" },
              { icon: Clock, label: "Setup < 5 Menit" },
              { icon: Headphones, label: "AI Support 24/7" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[hsl(0,0%,45%)] text-sm font-body">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
