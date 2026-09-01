import { lazy, Suspense, useEffect, useRef, useState } from "react";
import HeroSection from "@/components/HeroSection";
import FloatingChatbot from "@/components/FloatingChatbot";
import FloatingLkut from "@/components/FloatingLkut";
import InformationLandingSection from "@/components/InformationLandingSection";

const ProjectVideoSection = lazy(() => import("@/components/ProjectVideoSection"));
const IndustryProblemSection = lazy(() => import("@/components/IndustryProblemSection"));
const TheOneThingSection = lazy(() => import("@/components/TheOneThingSection"));
const ReadinessToolsSection = lazy(() => import("@/components/ReadinessToolsSection"));
const QualityGovernanceSection = lazy(() => import("@/components/QualityGovernanceSection"));
const SkkSection = lazy(() => import("@/components/SkkSection"));
const SiapPubSection = lazy(() => import("@/components/SiapPubSection"));
const ProjectEcosystemSection = lazy(() => import("@/components/ProjectEcosystemSection"));
const AspekindoLearningSection = lazy(() => import("@/components/AspekindoLearningSection"));
const DokumenProyekSection = lazy(() => import("@/components/DokumenProyekSection"));
const SocialProofSection = lazy(() => import("@/components/SocialProofSection"));
const EngineCards = lazy(() => import("@/components/EngineCards"));
const TeamSection = lazy(() => import("@/components/TeamSection"));
const CTASection = lazy(() => import("@/components/CTASection"));
const Footer = lazy(() => import("@/components/Footer"));

function DeferredSection({
  children,
  minHeight = 420,
}: {
  children: React.ReactNode;
  minHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "700px 0px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ minHeight }}>
      {isVisible && (
        <Suspense
          fallback={
            <div
              className="min-h-[inherit]"
              aria-label="Memuat bagian halaman"
              aria-busy="true"
            />
          }
        >
          {children}
        </Suspense>
      )}
    </div>
  );
}

const Index = () => {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* A — ATTENTION: Hero with shocking industry data */}
      <HeroSection />

      {/* Official industry and PUB publication center */}
      <InformationLandingSection />

      {/* Motion piece: 4 Siap menghadapi perubahan industri */}
      <DeferredSection minHeight={480}>
        <ProjectVideoSection />
      </DeferredSection>

      {/* I — INTEREST: Deep dive into real problems + public data */}
      <DeferredSection>
        <IndustryProblemSection />
      </DeferredSection>

      {/* D — DESIRE: The One Thing solution + before/after + features */}
      <DeferredSection>
        <TheOneThingSection />
      </DeferredSection>

      {/* Readiness tools for SBU and LKUT preparation */}
      <DeferredSection>
        <ReadinessToolsSection />
      </DeferredSection>

      {/* Quality, anti-bribery governance, and legal support */}
      <DeferredSection>
        <QualityGovernanceSection />
      </DeferredSection>

      {/* Supporting access for the SKK session */}
      <DeferredSection>
        <SkkSection />
      </DeferredSection>

      {/* Learning session: implementation of PUB through structured learning */}
      <DeferredSection>
        <SiapPubSection />
      </DeferredSection>

      {/* From 4 SIAP readiness into project management and opportunities */}
      <DeferredSection>
        <ProjectEcosystemSection />
      </DeferredSection>

      {/* ASPEKINDO's own learning activities and public agenda */}
      <DeferredSection>
        <AspekindoLearningSection />
      </DeferredSection>

      {/* Siap Proyek: third-party document administration service */}
      <DeferredSection>
        <DokumenProyekSection />
      </DeferredSection>

      {/* Social proof: logos, legal basis, reach */}
      <DeferredSection>
        <SocialProofSection />
      </DeferredSection>

      {/* System architecture */}
      <DeferredSection>
        <EngineCards />
      </DeferredSection>

      {/* Team credibility */}
      <DeferredSection minHeight={560}>
        <TeamSection />
      </DeferredSection>

      {/* A — ACTION: Urgent CTA */}
      <DeferredSection>
        <CTASection />
      </DeferredSection>

      <DeferredSection minHeight={260}>
        <Footer />
      </DeferredSection>
      {/* Kiri: Helpdesk aplikasi */}
      <FloatingChatbot variant="landing" />
      {/* Kanan: produk asli ASPEKINDO */}
      <FloatingLkut />
    </main>
  );
};

export default Index;
