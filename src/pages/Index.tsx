import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/HeroSection";
import CompetencyLevels from "@/components/CompetencyLevels";
import EngineCards from "@/components/EngineCards";
import CompetencyFlow from "@/components/CompetencyFlow";
import CompetencyMatrix from "@/components/CompetencyMatrix";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen">
      <HeroSection />
      <CompetencyLevels />
      <CompetencyFlow />
      <EngineCards />

      {/* Inovasi PUB CTA */}
      <section className="py-16 bg-gradient-to-r from-pub-navy via-pub-navy to-pub-navy-light">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-pub-amber/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-7 h-7 text-pub-amber" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-heading text-primary-foreground">
                  Inovasi PUB Konstruksi
                </h3>
                <p className="text-primary-foreground/60 text-sm mt-1 max-w-lg">
                  Jelajahi 8 pilar inovasi — dari Green Construction hingga Smart Technology — dan ajukan proposal inovasi Anda.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/inovasi")}
              className="gap-2 bg-pub-amber hover:bg-pub-amber/90 text-pub-navy font-semibold shrink-0"
            >
              Lihat Inovasi <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      <CompetencyMatrix />
      <Footer />
    </main>
  );
};

export default Index;
