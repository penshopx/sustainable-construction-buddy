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
// New batch 1 mini-apps
const DailyProgressIntelligence = lazy(() => import("./DailyProgressIntelligence"));
const QualityInspectionApp = lazy(() => import("./QualityInspectionApp"));
const SupplierScorecard = lazy(() => import("./SupplierScorecard"));
const MaterialPriceForecast = lazy(() => import("./MaterialPriceForecast"));
const ProcurementTimingOptimizer = lazy(() => import("./ProcurementTimingOptimizer"));
const SkillGapAnalyzer = lazy(() => import("./SkillGapAnalyzer"));
const TrainingROICalculator = lazy(() => import("./TrainingROICalculator"));
const WorkforceOptimizer = lazy(() => import("./WorkforceOptimizer"));
const ProductivityBenchmark = lazy(() => import("./ProductivityBenchmark"));
const SmartDocumentControl = lazy(() => import("./SmartDocumentControl"));
const AutoReportGenerator = lazy(() => import("./AutoReportGenerator"));
const WarrantyRiskTracker = lazy(() => import("./WarrantyRiskTracker"));

export interface MiniAppDef {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
}

export const miniAppRegistry: MiniAppDef[] = [
  // I. Strategic Business & Tender Intelligence (7 mini apps)
  { id: "bid-calculator", name: "Risk-Adjusted Tender Pricing Engine", description: "Hitung harga tender dengan penyesuaian risiko agar margin aman", categorySlug: "strategic-business" },
  { id: "cashflow-stress", name: "Tender Cashflow Survival Simulator", description: "Simulasi ketahanan arus kas jika pembayaran mundur", categorySlug: "strategic-business" },
  { id: "contract-trap", name: "Contract Trap Analyzer", description: "Deteksi klausul berbahaya dalam kontrak sebelum tanda tangan", categorySlug: "strategic-business" },
  { id: "tender-scorecard", name: "Tender Risk Scorecard", description: "Evaluasi kelayakan mengikuti tender berdasarkan 5 faktor", categorySlug: "strategic-business" },
  { id: "multi-project-radar", name: "Multi-Project Risk Radar", description: "Pantau risiko gabungan semua proyek aktif", categorySlug: "strategic-business" },

  // II. Financial Control & Profit Protection (6 mini apps)
  { id: "cost-drift", name: "Real-Time Cost Drift Alarm", description: "Monitor deviasi biaya per item pekerjaan", categorySlug: "financial-control" },
  { id: "margin-leak", name: "Margin Leak Scanner", description: "Deteksi sumber kebocoran margin proyek", categorySlug: "financial-control" },
  { id: "survival-sim", name: "Business Survival Simulator", description: "Berapa bulan perusahaan bertahan?", categorySlug: "financial-control" },
  { id: "debt-service", name: "Debt Service Coverage Ratio", description: "Kemampuan perusahaan membayar utang dari pendapatan", categorySlug: "financial-control" },
  { id: "break-even", name: "Break-Even Analyzer", description: "Berapa proyek minimum untuk mencapai BEP?", categorySlug: "financial-control" },
  { id: "portfolio-cash", name: "Portfolio Cash Planner", description: "Rencanakan arus kas gabungan semua proyek", categorySlug: "financial-control" },

  // III. Project Planning Excellence (5 mini apps)
  { id: "productivity-checker", name: "Productivity Reality Checker", description: "Bandingkan estimasi produktivitas vs standar histori", categorySlug: "project-planning" },
  { id: "resource-clash", name: "Resource Clash Detector", description: "Deteksi konflik sumber daya antar proyek bersamaan", categorySlug: "project-planning" },
  { id: "hidden-delay", name: "Hidden Delay Factor Library", description: "Faktor keterlambatan tersembunyi yang sering terlewat", categorySlug: "project-planning" },
  { id: "schedule-buffer", name: "Schedule Buffer Analyzer", description: "Hitung buffer waktu berdasarkan profil risiko", categorySlug: "project-planning" },
  { id: "resource-allocation", name: "Resource Allocation Matrix", description: "Alokasi sumber daya antar proyek & deteksi konflik", categorySlug: "project-planning" },

  // IV. Execution & Site Control (4 mini apps)
  { id: "vo-defense", name: "Variation Order Defense Tracker", description: "Catat & lacak semua VO untuk klaim yang kuat", categorySlug: "execution-control" },
  { id: "rework-cost", name: "Rework & Waste Cost Calculator", description: "Hitung biaya tersembunyi dari rework dan waste", categorySlug: "execution-control" },
  { id: "daily-progress", name: "Daily Progress Intelligence", description: "Monitoring progres harian berbasis data aktual", categorySlug: "execution-control" },
  { id: "quality-inspection", name: "Mobile Quality Inspection", description: "Checklist mutu digital di lapangan", categorySlug: "execution-control" },

  // V. Supply Chain & Supplier Innovation (3 mini apps)
  { id: "supplier-scorecard", name: "Supplier Reliability Scorecard", description: "Menilai kinerja vendor berdasarkan mutu dan waktu", categorySlug: "supply-chain" },
  { id: "material-forecast", name: "Material Price Forecast Tool", description: "Prediksi tren harga material konstruksi", categorySlug: "supply-chain" },
  { id: "procurement-timing", name: "Procurement Timing Optimizer", description: "Menentukan waktu beli paling menguntungkan", categorySlug: "supply-chain" },

  // VI. Human Capital Advantage (4 mini apps)
  { id: "skill-gap", name: "Skill Gap Mapping Analyzer", description: "Identifikasi kekurangan kompetensi SDM", categorySlug: "human-capital" },
  { id: "training-roi", name: "Training ROI Calculator", description: "Mengukur dampak pelatihan terhadap produktivitas", categorySlug: "human-capital" },
  { id: "workforce-optimizer", name: "Workforce Allocation Optimizer", description: "Distribusi tenaga kerja optimal antar proyek", categorySlug: "human-capital" },
  { id: "productivity-benchmark", name: "Productivity Benchmark Engine", description: "Standar produktivitas per jenis pekerjaan", categorySlug: "human-capital" },

  // VII. Technology & Digital Transformation (2 mini apps)
  { id: "smart-docs", name: "Smart Document Control", description: "Manajemen dokumen proyek digital terintegrasi", categorySlug: "digital-transformation" },
  { id: "auto-report", name: "Automated Reporting Generator", description: "Laporan proyek otomatis berbasis data aktual", categorySlug: "digital-transformation" },

  // VIII. Risk & Security Management (4 mini apps)
  { id: "fuel-loss", name: "Equipment & Fuel Loss Tracker", description: "Monitor anomali konsumsi BBM alat berat", categorySlug: "risk-security" },
  { id: "theft-impact", name: "Theft Cost Impact Calculator", description: "Hitung total kerugian finansial per insiden", categorySlug: "risk-security" },
  { id: "site-security", name: "Site Security Scorer", description: "Skor keamanan proyek berdasarkan 10 aspek", categorySlug: "risk-security" },
  { id: "asset-depreciation", name: "Asset Depreciation Tracker", description: "Lacak nilai buku aset dan rencana penggantian", categorySlug: "risk-security" },

  // IX. Environmental & ESG Innovation (3 mini apps)
  { id: "dust-noise", name: "Dust & Noise Risk Index", description: "Skor risiko protes masyarakat dari debu & kebisingan", categorySlug: "environmental-esg" },
  { id: "carbon-cost", name: "Carbon Cost Awareness Tool", description: "Estimasi emisi karbon dan biaya karbon tersembunyi", categorySlug: "environmental-esg" },
  { id: "env-compliance", name: "Environmental Compliance Check", description: "Checklist kepatuhan lingkungan proyek konstruksi", categorySlug: "environmental-esg" },

  // X. Post-Project & Long-Term Sustainability (5 mini apps)
  { id: "retention-planner", name: "Retention Recovery Planner", description: "Tracking retensi proyek & jatuh tempo pencairan", categorySlug: "post-project" },
  { id: "lessons-pattern", name: "Lessons Pattern Analyzer", description: "Deteksi pola kesalahan berulang dari histori proyek", categorySlug: "post-project" },
  { id: "defect-tracker", name: "Defect Liability Tracker", description: "Tracking defect selama masa pemeliharaan", categorySlug: "post-project" },
  { id: "final-account", name: "Final Account Checker", description: "Pastikan dokumen penutupan proyek lengkap", categorySlug: "post-project" },
  { id: "warranty-tracker", name: "Warranty Risk Tracker", description: "Monitoring risiko masa pemeliharaan", categorySlug: "post-project" },
];

const componentMap: Record<string, React.LazyExoticComponent<React.ComponentType<Record<string, never>>>> = {
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
  // New batch 1
  "daily-progress": DailyProgressIntelligence,
  "quality-inspection": QualityInspectionApp,
  "supplier-scorecard": SupplierScorecard,
  "material-forecast": MaterialPriceForecast,
  "procurement-timing": ProcurementTimingOptimizer,
  "skill-gap": SkillGapAnalyzer,
  "training-roi": TrainingROICalculator,
  "workforce-optimizer": WorkforceOptimizer,
  "productivity-benchmark": ProductivityBenchmark,
  "smart-docs": SmartDocumentControl,
  "auto-report": AutoReportGenerator,
  "warranty-tracker": WarrantyRiskTracker,
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
