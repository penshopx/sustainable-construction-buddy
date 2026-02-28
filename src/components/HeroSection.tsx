import { motion } from "framer-motion";
import { ArrowRight, Building2, Shield, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";
import logoPub from "@/assets/logo-pub.png";
import logoAspekindo from "@/assets/logo-aspekindo.jpg";
import logoLsbuki from "@/assets/logo-lsbuki.webp";
import dashboardMockup from "@/assets/dashboard-mockup.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Proyek konstruksi modern"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-hero opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-r from-pub-navy/95 via-pub-navy/80 to-pub-navy/40" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div>
            {/* All 3 logos in a row */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-3 mb-4 px-5 py-3 rounded-xl bg-[hsl(220,10%,72%)]"
            >
              <img src={logoPub} alt="Logo PUB" className="h-24 w-auto object-contain brightness-[2] contrast-125" />
              <div className="w-px h-14 bg-white/25" />
              <img src={logoAspekindo} alt="Logo ASPEKINDO" className="h-[72px] w-auto object-contain mix-blend-multiply rounded-md" />
              <div className="w-px h-14 bg-white/25" />
              <img src={logoLsbuki} alt="Logo LSBUKI" className="h-[72px] w-auto object-contain mix-blend-multiply rounded-md" />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mb-4"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pub-amber/15 border border-pub-amber/30 text-pub-amber-light text-sm font-medium font-heading">
                <Building2 className="w-3.5 h-3.5" />
                ASPEKINDO — Pemborong Kompeten & Profesional
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-primary-foreground leading-tight mb-6"
            >
              Pengembangan Usaha{" "}
              <span className="text-gradient-hero">Berkelanjutan</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-primary-foreground/70 leading-relaxed mb-10 max-w-2xl font-body"
            >
              Ekosistem kompetensi digital untuk Personil Manajerial BUJK berbasis
              knowledge capacity — dari assessment hingga leveling berkelanjutan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <button onClick={() => navigate("/auth")} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-gradient-amber text-accent-foreground font-semibold font-heading shadow-amber hover:brightness-110 transition-all duration-200">
                Mulai Assessment
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-primary-foreground/20 text-primary-foreground/90 font-semibold font-heading hover:bg-primary-foreground/10 transition-all duration-200">
                Pelajari Sistem
              </button>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-primary-foreground/10"
            >
              {[
                { icon: Shield, label: "Level Kompetensi", value: "4 Tingkat" },
                { icon: Building2, label: "Domain Keahlian", value: "6 Domain" },
                { icon: TrendingUp, label: "Evaluasi", value: "Berkelanjutan" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pub-amber/15 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-pub-amber-light" />
                  </div>
                  <div>
                    <p className="text-sm text-primary-foreground/50 font-body">{stat.label}</p>
                    <p className="text-lg font-semibold text-primary-foreground font-heading">{stat.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column - Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden md:flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-pub-amber/10 rounded-2xl blur-2xl" />
              <img
                src={dashboardMockup}
                alt="Dashboard kompetensi PUB"
                className="relative rounded-2xl shadow-hero border border-primary-foreground/10 w-full max-w-lg"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
