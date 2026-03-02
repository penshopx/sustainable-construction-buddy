import { lazy, Suspense, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppWindow, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const BidCalculator = lazy(() => import("./BidCalculator"));
const CashflowStressTest = lazy(() => import("./CashflowStressTest"));
const MarginLeakScanner = lazy(() => import("./MarginLeakScanner"));
const FuelLossTracker = lazy(() => import("./FuelLossTracker"));
const SurvivalSimulator = lazy(() => import("./SurvivalSimulator"));

export interface MiniAppDef {
  id: string;
  name: string;
  description: string;
  categorySlug: string; // maps to innovation_categories.slug
}

export const miniAppRegistry: MiniAppDef[] = [
  { id: "bid-calculator", name: "Risk-Adjusted Bid Calculator", description: "Hitung harga tender minimal aman + margin sehat", categorySlug: "tender-blind-spot" },
  { id: "cashflow-stress", name: "Tender Cashflow Stress Test", description: "Simulasi apakah proyek survive jika skenario terburuk", categorySlug: "tender-blind-spot" },
  { id: "margin-leak", name: "Margin Leak Scanner", description: "Deteksi sumber kebocoran margin proyek", categorySlug: "margin-protection" },
  { id: "fuel-loss", name: "Equipment & Fuel Loss Tracker", description: "Monitor anomali konsumsi BBM alat berat", categorySlug: "project-security" },
  { id: "survival-sim", name: "Business Survival Simulator", description: "Berapa bulan perusahaan bertahan?", categorySlug: "business-survival" },
];

const componentMap: Record<string, React.LazyExoticComponent<() => JSX.Element>> = {
  "bid-calculator": BidCalculator,
  "cashflow-stress": CashflowStressTest,
  "margin-leak": MarginLeakScanner,
  "fuel-loss": FuelLossTracker,
  "survival-sim": SurvivalSimulator,
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
        <AppWindow className="w-5 h-5 text-pub-emerald" /> Mini Apps Tersedia
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
