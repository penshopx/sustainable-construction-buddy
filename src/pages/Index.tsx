import HeroSection from "@/components/HeroSection";
import ProjectVideoSection from "@/components/ProjectVideoSection";
import IndustryProblemSection from "@/components/IndustryProblemSection";
import TheOneThingSection from "@/components/TheOneThingSection";
import ReadinessToolsSection from "@/components/ReadinessToolsSection";
import SkkSection from "@/components/SkkSection";
import SiapPubSection from "@/components/SiapPubSection";
import AspekindoLearningSection from "@/components/AspekindoLearningSection";
import DokumenProyekSection from "@/components/DokumenProyekSection";
import SocialProofSection from "@/components/SocialProofSection";
import EngineCards from "@/components/EngineCards";
import TeamSection from "@/components/TeamSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import FloatingChatbot from "@/components/FloatingChatbot";
import FloatingLkut from "@/components/FloatingLkut";
import InformationLandingSection from "@/components/InformationLandingSection";
import ProjectEcosystemSection from "@/components/ProjectEcosystemSection";
import QualityGovernanceSection from "@/components/QualityGovernanceSection";

const Index = () => {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* A — ATTENTION: Hero with shocking industry data */}
      <HeroSection />

      {/* Official industry and PUB publication center */}
      <InformationLandingSection />

      {/* Motion piece: 4 Siap menghadapi perubahan industri */}
      <ProjectVideoSection />

      {/* I — INTEREST: Deep dive into real problems + public data */}
      <IndustryProblemSection />

      {/* D — DESIRE: The One Thing solution + before/after + features */}
      <TheOneThingSection />

      {/* Readiness tools for SBU and LKUT preparation */}
      <ReadinessToolsSection />

      {/* Quality, anti-bribery governance, and legal support */}
      <QualityGovernanceSection />

      {/* Supporting access for the SKK session */}
      <SkkSection />

      {/* Learning session: implementation of PUB through structured learning */}
      <SiapPubSection />

      {/* From 4 SIAP readiness into project management and opportunities */}
      <ProjectEcosystemSection />

      {/* ASPEKINDO's own learning activities and public agenda */}
      <AspekindoLearningSection />

      {/* Siap Proyek: third-party document administration service */}
      <DokumenProyekSection />

      {/* Social proof: logos, legal basis, reach */}
      <SocialProofSection />

      {/* System architecture */}
      <EngineCards />

      {/* Team credibility */}
      <TeamSection />

      {/* A — ACTION: Urgent CTA */}
      <CTASection />

      <Footer />
      {/* Kiri: Helpdesk aplikasi */}
      <FloatingChatbot variant="landing" />
      {/* Kanan: produk asli ASPEKINDO */}
      <FloatingLkut />
    </main>
  );
};

export default Index;
