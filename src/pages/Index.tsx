import HeroSection from "@/components/HeroSection";
import CompetencyLevels from "@/components/CompetencyLevels";
import EngineCards from "@/components/EngineCards";
import CompetencyFlow from "@/components/CompetencyFlow";
import CompetencyMatrix from "@/components/CompetencyMatrix";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <CompetencyLevels />
      <CompetencyFlow />
      <EngineCards />
      <CompetencyMatrix />
      <Footer />
    </main>
  );
};

export default Index;
