import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, DollarSign, Shield, FileText, Wrench,
  Calculator, BarChart3, ClipboardCheck, Building2,
  ChevronDown, ChevronUp, ExternalLink, Zap, AppWindow,
} from "lucide-react";

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: "module" | "tool";
  route?: string;
  comingSoon?: boolean;
}

export const MINI_APPS: MiniApp[] = [
  // Existing modules
  {
    id: "risk-register",
    name: "Risk Register",
    description: "Identifikasi & mitigasi risiko proyek",
    icon: AlertTriangle,
    color: "text-red-500",
    category: "module",
    route: "/risk-register",
  },
  {
    id: "budget-tracker",
    name: "Budget Tracker",
    description: "Monitor anggaran & deviasi biaya",
    icon: DollarSign,
    color: "text-emerald-500",
    category: "module",
    route: "/budget-tracker",
  },
  {
    id: "k3-checklist",
    name: "K3 Checklist",
    description: "Inspeksi keselamatan & kepatuhan K3",
    icon: Shield,
    color: "text-blue-500",
    category: "module",
    route: "/k3-checklist",
  },
  {
    id: "lkut-report",
    name: "LKUT Report",
    description: "Laporan kegiatan usaha tahunan",
    icon: FileText,
    color: "text-purple-500",
    category: "module",
    route: "/lkut-report",
  },
  {
    id: "performance-grade",
    name: "Performance Grade",
    description: "Grading kinerja BUJK",
    icon: BarChart3,
    color: "text-amber-500",
    category: "module",
    route: "/performance-grade",
  },
  {
    id: "pancek",
    name: "PANCEK Assessment",
    description: "Penilaian anti-korupsi & etika kerja",
    icon: ClipboardCheck,
    color: "text-teal-500",
    category: "module",
    route: "/pancek-assessment",
  },
  {
    id: "company-directory",
    name: "Direktori BUJK",
    description: "Profil & portofolio perusahaan",
    icon: Building2,
    color: "text-indigo-500",
    category: "module",
    route: "/company-directory",
  },
  // Widget tools (extensible — add more here)
  {
    id: "evm-calculator",
    name: "Kalkulator EVM",
    description: "Hitung CPI, SPI, EAC, ETC otomatis",
    icon: Calculator,
    color: "text-orange-500",
    category: "tool",
    comingSoon: true,
  },
  {
    id: "complexity-scorer",
    name: "Complexity Scorer",
    description: "Hitung skor kompleksitas proyek",
    icon: Zap,
    color: "text-yellow-500",
    category: "tool",
    route: "/projects",
  },
];

interface MiniAppsCatalogProps {
  compact?: boolean;
  onSelectApp?: (app: MiniApp) => void;
}

export default function MiniAppsCatalog({ compact, onSelectApp }: MiniAppsCatalogProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(!compact);

  const modules = MINI_APPS.filter(a => a.category === "module");
  const tools = MINI_APPS.filter(a => a.category === "tool");

  const handleClick = (app: MiniApp) => {
    if (onSelectApp) onSelectApp(app);
    if (app.route && !app.comingSoon) {
      window.open(app.route, "_blank");
    }
  };

  if (compact) {
    return (
      <div>
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-sm font-heading font-semibold text-foreground mb-1.5">
          <span className="flex items-center gap-1.5"><AppWindow className="w-4 h-4 text-emerald-500" /> Mini Apps</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {expanded && (
          <div className="flex flex-wrap gap-1.5">
            {MINI_APPS.map(app => (
              <button key={app.id} onClick={() => handleClick(app)}
                disabled={app.comingSoon}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                  app.comingSoon
                    ? "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                    : "border-border hover:bg-muted text-foreground"
                }`}>
                <app.icon className={`w-3 h-3 ${app.color}`} />
                <span className="truncate">{app.name}</span>
                {app.comingSoon && <span className="text-[10px] text-muted-foreground">(soon)</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-heading font-semibold text-foreground flex items-center gap-1.5">
        <AppWindow className="w-4 h-4 text-emerald-500" /> Mini Apps
      </h4>
      <p className="text-xs text-muted-foreground">
        AI dapat menyarankan mini app yang relevan untuk menyelesaikan masalah proyek Anda.
      </p>

      {/* Modules */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Modul</p>
        <div className="space-y-1">
          {modules.map(app => (
            <button key={app.id} onClick={() => handleClick(app)}
              className="w-full text-left flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-colors group">
              <div className={`w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                <app.icon className={`w-3.5 h-3.5 ${app.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{app.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{app.description}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tools</p>
        <div className="space-y-1">
          {tools.map(app => (
            <button key={app.id} onClick={() => handleClick(app)}
              disabled={app.comingSoon}
              className={`w-full text-left flex items-center gap-2.5 p-2 rounded-xl border border-transparent transition-colors group ${
                app.comingSoon ? "opacity-50 cursor-not-allowed" : "hover:bg-muted hover:border-border"
              }`}>
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <app.icon className={`w-3.5 h-3.5 ${app.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{app.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{app.description}</p>
              </div>
              {app.comingSoon && (
                <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">Soon</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
