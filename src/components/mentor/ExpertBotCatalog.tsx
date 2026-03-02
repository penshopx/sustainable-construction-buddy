import { Brain, Scale, HardHat, Shield, DollarSign } from "lucide-react";

export interface BuiltInBot {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export const BUILT_IN_BOTS: BuiltInBot[] = [
  {
    id: "orchestrator",
    name: "Pakar Cerdas",
    description: "Orchestrator utama — tanyakan apapun, saya arahkan ke spesialis yang tepat",
    icon: Brain,
    color: "text-pub-amber",
    bgColor: "bg-pub-amber/10",
  },
  {
    id: "regulasi",
    name: "Pakar Regulasi",
    description: "PP 22/2020, UU Jasa Konstruksi, Permen PUPR, perizinan BUJK",
    icon: Scale,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "manpro",
    name: "Pakar Manajemen Proyek",
    description: "WBS, scheduling, earned value, cost control, RAB",
    icon: HardHat,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "k3",
    name: "Pakar K3 & Safety",
    description: "SMK3, ISO 45001, inspeksi keselamatan, mitigasi risiko K3",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "keuangan",
    name: "Pakar Keuangan BUJK",
    description: "Laporan keuangan, neraca, cash flow, LKUT, perpajakan",
    icon: DollarSign,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
];

interface ExpertBotCatalogProps {
  selectedBotId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}

export default function ExpertBotCatalog({ selectedBotId, onSelect, compact }: ExpertBotCatalogProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-heading font-semibold text-foreground">Pilih Pakar</h4>
        <div className="flex flex-wrap gap-1.5">
          {BUILT_IN_BOTS.map(bot => (
            <button key={bot.id} onClick={() => onSelect(bot.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                bot.id === selectedBotId
                  ? "bg-primary/10 border border-primary/20 text-foreground font-medium"
                  : "hover:bg-muted border border-border text-muted-foreground"
              }`}>
              <bot.icon className={`w-3.5 h-3.5 ${bot.color}`} />
              {bot.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-heading font-semibold text-foreground">Pilih Pakar</h4>
      <div className="space-y-1.5">
        {BUILT_IN_BOTS.map(bot => (
          <button key={bot.id} onClick={() => onSelect(bot.id)}
            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${
              bot.id === selectedBotId
                ? "bg-primary/10 border border-primary/20 shadow-sm"
                : "hover:bg-muted border border-transparent"
            }`}>
            <div className={`w-9 h-9 rounded-lg ${bot.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
              <bot.icon className={`w-5 h-5 ${bot.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold font-heading truncate ${
                bot.id === selectedBotId ? "text-foreground" : "text-muted-foreground"
              }`}>{bot.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{bot.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
