import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Clock, Headphones } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-r from-pub-navy via-pub-navy to-pub-navy-light">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-primary-foreground mb-4">
            Jangan Tunggu Sampai SBU Tidak Diperpanjang
          </h2>
          <p className="text-primary-foreground/60 font-body mb-8">
            Bergabung sekarang dan mulai perjalanan PUB badan usaha Anda. Gratis untuk anggota ASPEKINDO.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-amber text-accent-foreground font-semibold font-heading shadow-amber hover:brightness-110 transition-all"
          >
            Daftar Gratis Sekarang <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex justify-center gap-8 mt-10">
            {[
              { icon: Shield, label: "Data Aman & Terenkripsi" },
              { icon: Clock, label: "Setup < 5 Menit" },
              { icon: Headphones, label: "Support 24/7" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-primary-foreground/50 text-sm font-body">
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
