import HeroSection from "@/components/HeroSection";
import IndustryProblemSection from "@/components/IndustryProblemSection";
import TheOneThingSection from "@/components/TheOneThingSection";
import SocialProofSection from "@/components/SocialProofSection";
import EngineCards from "@/components/EngineCards";
import TeamSection from "@/components/TeamSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FloatingChatbot from "@/components/FloatingChatbot";
import FloatingGustafta from "@/components/FloatingGustafta";

const Index = () => {
  return (
    <main className="min-h-screen">
      {/* A — ATTENTION: Hero with shocking industry data */}
      <HeroSection />

      {/* I — INTEREST: Deep dive into real problems + public data */}
      <IndustryProblemSection />

      {/* D — DESIRE: The One Thing solution + before/after + features */}
      <TheOneThingSection />

      {/* Social proof: logos, legal basis, reach */}
      <SocialProofSection />

      {/* System architecture */}
      <EngineCards />

      {/* Team credibility */}
      <TeamSection />

      {/* A — ACTION: Urgent CTA */}
      <CTASection />

      <Footer />
      {/* Kiri: HelpDesk layanan & info */}
      <FloatingChatbot variant="landing" />
      {/* Kanan: Gustafta Socratic Dialog */}
      <FloatingGustafta />
    </main>
  );
};

export default Index;
