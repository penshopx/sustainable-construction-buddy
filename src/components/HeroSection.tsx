import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, TrendingDown, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-construction.jpg";
import logoPub from "@/assets/logo-pub-new.png";
import logoAspekindo from "@/assets/logo-aspekindo.png";

const shockStats = [
  { value: "65%", label: "BUJK gagal perpanjang SBU karena tidak memenuhi kewajiban PUB", icon: AlertTriangle },
  { value: "Rp 847 T", label: "Nilai proyek konstruksi Indonesia 2024 — persaingan makin ketat", icon: TrendingDown },
  { value: "202.000+", label: "BUJK terdaftar, mayoritas belum punya sistem kompetensi digital", icon: Users },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Proyek konstruksi modern" className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,60%,8%)/95%] via-[hsl(220,50%,12%)/90%] to-[hsl(220,40%,15%)/85%]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 md:py-24">
        {/* Logos */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[hsl(0,0%,100%)/12%] backdrop-blur-sm border border-[hsl(0,0%,100%)/10%]">
            <img src={logoPub} alt="Logo PUB ASPEKINDO" className="h-12 w-auto object-contain" />
            <span className="text-[hsl(0,0%,90%)] font-bold font-heading text-sm leading-tight">PUB<br/>ASPEKINDO</span>
            <div className="w-px h-8 bg-[hsl(0,0%,100%)/20%]" />
            <img src={logoAspekindo} alt="Logo ASPEKINDO" className="h-10 w-auto object-contain" />
          </div>
        </motion.div>

        {/* Attention-grabbing headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/15 border border-destructive/25 text-destructive text-sm font-semibold font-heading mb-5">
            <AlertTriangle className="w-3.5 h-3.5" />
            DATA INDUSTRI KONSTRUKSI 2024
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold font-heading text-[hsl(0,0%,97%)] leading-[1.1] mb-6">
            Industri Konstruksi Indonesia{" "}
            <span className="text-gradient-hero">Bernilai Rp 847 Triliun</span>
            <br />
            <span className="text-[hsl(0,0%,70%)] text-3xl md:text-4xl lg:text-[2.5rem]">
              Tapi mayoritas BUJK belum siap bersaing.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[hsl(0,0%,70%)] leading-relaxed mb-10 max-w-3xl font-body">
            Regulasi semakin ketat, SBU bisa dicabut, dan tender semakin kompetitif. 
            <strong className="text-[hsl(0,0%,90%)]"> Satu platform </strong> 
            bisa menyelesaikan semua itu — PUB ASPEKINDO.
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading text-lg shadow-amber hover:brightness-110 transition-all duration-200"
            >
              Mulai Sekarang — Gratis
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                document.getElementById("masalah-industri")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-[hsl(0,0%,100%)/20%] text-[hsl(0,0%,85%)] font-semibold font-heading hover:bg-[hsl(0,0%,100%)/8%] transition-all duration-200"
            >
              Lihat Data Industri
            </button>
          </div>
        </motion.div>

        {/* Shock stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {shockStats.map((stat, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-xl bg-[hsl(220,30%,10%)/90%] backdrop-blur-md border border-[hsl(0,0%,100%)/12%]"
            >
              <div className="w-12 h-12 rounded-lg bg-pub-amber/20 flex items-center justify-center shrink-0">
                <stat.icon className="w-6 h-6 text-pub-amber" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold font-heading text-pub-amber">{stat.value}</p>
                <p className="text-sm text-[hsl(0,0%,85%)] font-body leading-snug mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
