import { lazy, Suspense, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppWindow, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Lazy-loaded mini app components
const BidCalculator = lazy(() => import("./BidCalculator"));
const CashflowStressTest = lazy(() => import("./CashflowStressTest"));
const MarginLeakScanner = lazy(() => import("./MarginLeakScanner"));
const FuelLossTracker = lazy(() => import("./FuelLossTracker"));
const SurvivalSimulator = lazy(() => import("./SurvivalSimulator"));
const ProductivityChecker = lazy(() => import("./ProductivityChecker"));
const DustNoiseIndex = lazy(() => import("./DustNoiseIndex"));
const RetentionPlanner = lazy(() => import("./RetentionPlanner"));
const MultiProjectRadar = lazy(() => import("./MultiProjectRadar"));
const ContractTrapScanner = lazy(() => import("./ContractTrapScanner"));
const TenderRiskScorecard = lazy(() => import("./TenderRiskScorecard"));
const ResourceClashDetector = lazy(() => import("./ResourceClashDetector"));
const HiddenDelayCalculator = lazy(() => import("./HiddenDelayCalculator"));
const ScheduleBufferAnalyzer = lazy(() => import("./ScheduleBufferAnalyzer"));
const CostDriftAlarm = lazy(() => import("./CostDriftAlarm"));
const VODefenseTracker = lazy(() => import("./VODefenseTracker"));
const ReworkCostCalculator = lazy(() => import("./ReworkCostCalculator"));
const TheftImpactCalculator = lazy(() => import("./TheftImpactCalculator"));
const SiteSecurityScorer = lazy(() => import("./SiteSecurityScorer"));
const AssetDepreciationTracker = lazy(() => import("./AssetDepreciationTracker"));
const CarbonCostTool = lazy(() => import("./CarbonCostTool"));
const EnvironmentalComplianceCheck = lazy(() => import("./EnvironmentalComplianceCheck"));
const LessonsPatternAnalyzer = lazy(() => import("./LessonsPatternAnalyzer"));
const DefectLiabilityTracker = lazy(() => import("./DefectLiabilityTracker"));
const FinalAccountChecker = lazy(() => import("./FinalAccountChecker"));
const PortfolioCashPlanner = lazy(() => import("./PortfolioCashPlanner"));
const ResourceAllocationMatrix = lazy(() => import("./ResourceAllocationMatrix"));
const DebtServiceCalculator = lazy(() => import("./DebtServiceCalculator"));
const BreakEvenAnalyzer = lazy(() => import("./BreakEvenAnalyzer"));

export interface MiniAppDef {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
}

export const miniAppRegistry: MiniAppDef[] = [
  // Tender Blind Spot (4)
  { id: "bid-calculator", name: "Risk-Adjusted Bid Calculator", description: "Hitung harga tender minimal aman + margin sehat", categorySlug: "tender-blind-spot" },
  { id: "cashflow-stress", name: "Tender Cashflow Stress Test", description: "Simulasi apakah proyek survive jika skenario terburuk", categorySlug: "tender-blind-spot" },
  { id: "contract-trap", name: "Contract Trap Scanner", description: "Checklist klausul kontrak berbahaya yang sering terlewat", categorySlug: "tender-blind-spot" },
  { id: "tender-scorecard", name: "Tender Risk Scorecard", description: "Evaluasi kelayakan mengikuti tender berdasarkan 5 faktor", categorySlug: "tender-blind-spot" },
  // Realistic Baseline (4)
  { id: "productivity-checker", name: "Productivity Reality Checker", description: "Bandingkan estimasi produktivitas vs standar histori", categorySlug: "realistic-baseline" },
  { id: "resource-clash", name: "Resource Clash Detector", description: "Deteksi konflik sumber daya antar proyek bersamaan", categorySlug: "realistic-baseline" },
  { id: "hidden-delay", name: "Hidden Delay Factor Library", description: "Faktor keterlambatan tersembunyi yang sering terlewat", categorySlug: "realistic-baseline" },
  { id: "schedule-buffer", name: "Schedule Buffer Analyzer", description: "Hitung buffer waktu berdasarkan profil risiko", categorySlug: "realistic-baseline" },
  // Margin Protection (4)
  { id: "margin-leak", name: "Margin Leak Scanner", description: "Deteksi sumber kebocoran margin proyek", categorySlug: "margin-protection" },
  { id: "cost-drift", name: "Real-Time Cost Drift Alarm", description: "Monitor deviasi biaya per item pekerjaan", categorySlug: "margin-protection" },
  { id: "vo-defense", name: "Variation Order Defense Tracker", description: "Catat & lacak semua VO untuk klaim yang kuat", categorySlug: "margin-protection" },
  { id: "rework-cost", name: "Rework & Waste Cost Calculator", description: "Hitung biaya tersembunyi dari rework dan waste", categorySlug: "margin-protection" },
  // Project Security (4)
  { id: "fuel-loss", name: "Equipment & Fuel Loss Tracker", description: "Monitor anomali konsumsi BBM alat berat", categorySlug: "project-security" },
  { id: "theft-impact", name: "Theft Cost Impact Calculator", description: "Hitung total kerugian finansial per insiden pencurian", categorySlug: "project-security" },
  { id: "site-security", name: "Site Security Scorer", description: "Skor keamanan proyek berdasarkan 10 aspek", categorySlug: "project-security" },
  { id: "asset-depreciation", name: "Asset Depreciation Tracker", description: "Lacak nilai buku aset dan rencana penggantian", categorySlug: "project-security" },
  // Environmental Risk (3)
  { id: "dust-noise", name: "Dust & Noise Risk Index", description: "Skor risiko protes masyarakat dari debu & kebisingan", categorySlug: "environmental-risk" },
  { id: "carbon-cost", name: "Carbon Cost Awareness Tool", description: "Estimasi emisi karbon dan biaya karbon tersembunyi", categorySlug: "environmental-risk" },
  { id: "env-compliance", name: "Environmental Compliance Check", description: "Checklist kepatuhan lingkungan proyek konstruksi", categorySlug: "environmental-risk" },
  // Post-Project Recovery (4)
  { id: "retention-planner", name: "Retention Recovery Planner", description: "Tracking retensi proyek & jatuh tempo pencairan", categorySlug: "post-project-recovery" },
  { id: "lessons-pattern", name: "Lessons Pattern Analyzer", description: "Deteksi pola kesalahan berulang dari histori proyek", categorySlug: "post-project-recovery" },
  { id: "defect-tracker", name: "Defect Liability Tracker", description: "Tracking defect/snag list selama masa pemeliharaan", categorySlug: "post-project-recovery" },
  { id: "final-account", name: "Final Account Checker", description: "Pastikan dokumen penutupan proyek lengkap", categorySlug: "post-project-recovery" },
  // Multi-Project Radar (3)
  { id: "multi-project-radar", name: "Multi-Project Risk Radar", description: "Pantau risiko gabungan semua proyek aktif", categorySlug: "multi-project-radar" },
  { id: "portfolio-cash", name: "Portfolio Cash Planner", description: "Rencanakan arus kas gabungan semua proyek", categorySlug: "multi-project-radar" },
  { id: "resource-allocation", name: "Resource Allocation Matrix", description: "Alokasi sumber daya antar proyek & deteksi konflik", categorySlug: "multi-project-radar" },
  // Business Survival (4)
  { id: "survival-sim", name: "Business Survival Simulator", description: "Berapa bulan perusahaan bertahan?", categorySlug: "business-survival" },
  { id: "debt-service", name: "Debt Service Coverage Ratio", description: "Kemampuan perusahaan membayar utang dari pendapatan", categorySlug: "business-survival" },
  { id: "break-even", name: "Break-Even Analyzer", description: "Berapa proyek minimum untuk mencapai BEP?", categorySlug: "business-survival" },
];

const componentMap: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  "bid-calculator": BidCalculator,
  "cashflow-stress": CashflowStressTest,
  "margin-leak": MarginLeakScanner,
  "fuel-loss": FuelLossTracker,
  "survival-sim": SurvivalSimulator,
  "productivity-checker": ProductivityChecker,
  "dust-noise": DustNoiseIndex,
  "retention-planner": RetentionPlanner,
  "multi-project-radar": MultiProjectRadar,
  "contract-trap": ContractTrapScanner,
  "tender-scorecard": TenderRiskScorecard,
  "resource-clash": ResourceClashDetector,
  "hidden-delay": HiddenDelayCalculator,
  "schedule-buffer": ScheduleBufferAnalyzer,
  "cost-drift": CostDriftAlarm,
  "vo-defense": VODefenseTracker,
  "rework-cost": ReworkCostCalculator,
  "theft-impact": TheftImpactCalculator,
  "site-security": SiteSecurityScorer,
  "asset-depreciation": AssetDepreciationTracker,
  "carbon-cost": CarbonCostTool,
  "env-compliance": EnvironmentalComplianceCheck,
  "lessons-pattern": LessonsPatternAnalyzer,
  "defect-tracker": DefectLiabilityTracker,
  "final-account": FinalAccountChecker,
  "portfolio-cash": PortfolioCashPlanner,
  "resource-allocation": ResourceAllocationMatrix,
  "debt-service": DebtServiceCalculator,
  "break-even": BreakEvenAnalyzer,
};

export function MiniAppLauncher({ appId, children }: { appId: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const app = miniAppRegistry.find(a => a.id === appId);
  const Component = componentMap[appId];

  if (!app || !Component) return null;

  return (
    <>
      {children ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">{children}</span>
      ) : (
        <Button onClick={() => setOpen(true)} className="gap-2" size="sm">
          <AppWindow className="w-4 h-4" /> Buka {app.name}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{app.name}</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
            <Component />
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MiniAppGrid({ categorySlug }: { categorySlug: string }) {
  const apps = miniAppRegistry.filter(a => a.categorySlug === categorySlug);
  if (apps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold font-heading flex items-center gap-2">
        <AppWindow className="w-5 h-5 text-pub-emerald" /> Mini Apps Tersedia ({apps.length})
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {apps.map((app) => (
          <MiniAppLauncher key={app.id} appId={app.id}>
            <Card className="cursor-pointer hover:shadow-card-hover transition-all border-pub-emerald/20 hover:border-pub-emerald/40 group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-pub-emerald/10 flex items-center justify-center shrink-0 group-hover:bg-pub-emerald/20 transition-colors">
                  <AppWindow className="w-5 h-5 text-pub-emerald" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{app.name}</p>
                  <p className="text-xs text-muted-foreground">{app.description}</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1 text-pub-emerald border-pub-emerald/30 hover:bg-pub-emerald/10">
                  Buka
                </Button>
              </CardContent>
            </Card>
          </MiniAppLauncher>
        ))}
      </div>
    </div>
  );
}
