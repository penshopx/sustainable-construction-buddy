import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, FileText, Shield, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle2, HardHat, ClipboardCheck, FolderKanban, Users, BarChart3,
  Package, ShoppingCart, FileCheck, ChevronRight, Briefcase
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RoleMetric {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bg: string;
  link?: string;
}

interface RoleConfig {
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  metrics: RoleMetric[];
  quickLinks: { label: string; link: string; icon: any }[];
}

const useRoleStats = (position: string, userId: string) => {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    if (!userId || !position) return;
    const fetch = async () => {
      const [projects, risks, budget, k3] = await Promise.all([
        supabase.from("projects").select("status, value_amount, complexity_score").eq("user_id", userId),
        supabase.from("risk_registers").select("risk_level, status").eq("user_id", userId),
        supabase.from("budget_entries").select("planned_amount, actual_amount, deviation_percent").eq("user_id", userId),
        supabase.from("k3_checklists").select("status, score_percent").eq("user_id", userId),
      ]);
      setStats({
        projects: projects.data || [],
        risks: risks.data || [],
        budget: budget.data || [],
        k3: k3.data || [],
      });
    };
    fetch();
  }, [userId, position]);

  return stats;
};

function getRoleConfig(position: string, stats: any): RoleConfig | null {
  const projects = stats.projects || [];
  const risks = stats.risks || [];
  const budget = stats.budget || [];
  const k3 = stats.k3 || [];

  const activeProjects = projects.filter((p: any) => p.status === "active").length;
  const totalValue = projects.reduce((s: number, p: any) => s + (p.value_amount || 0), 0);
  const highRisks = risks.filter((r: any) => r.risk_level === "high" || r.risk_level === "extreme").length;
  const openRisks = risks.filter((r: any) => r.status === "open").length;
  const totalPlanned = budget.reduce((s: number, b: any) => s + (b.planned_amount || 0), 0);
  const totalActual = budget.reduce((s: number, b: any) => s + (b.actual_amount || 0), 0);
  const budgetDeviation = totalPlanned > 0 ? Math.round(((totalActual - totalPlanned) / totalPlanned) * 100) : 0;
  const budgetWarnings = budget.filter((b: any) => Math.abs(b.deviation_percent || 0) >= 5).length;
  const k3Completed = k3.filter((c: any) => c.status === "completed").length;
  const avgK3Score = k3.length > 0 ? Math.round(k3.reduce((s: number, c: any) => s + (c.score_percent || 0), 0) / k3.length) : 0;

  const fmt = (n: number) => {
    if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}M`;
    if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(0)}Jt`;
    return `Rp ${n.toLocaleString("id-ID")}`;
  };

  if (position.includes("PJBU") || position.includes("Direktur")) {
    return {
      title: "Dashboard PJBU / Direktur",
      subtitle: "Tata Kelola & Pemantauan Kapasitas Organisasi",
      icon: Building2,
      gradient: "from-pub-navy to-pub-sky",
      metrics: [
        { label: "Proyek Aktif", value: activeProjects, icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/projects" },
        { label: "Total Nilai Proyek", value: fmt(totalValue), icon: TrendingUp, color: "text-pub-emerald", bg: "bg-pub-emerald/10" },
        { label: "Risiko Tinggi", value: highRisks, icon: AlertTriangle, color: highRisks > 0 ? "text-destructive" : "text-pub-emerald", bg: highRisks > 0 ? "bg-destructive/10" : "bg-pub-emerald/10", link: "/risk-register" },
        { label: "Deviasi Anggaran", value: `${budgetDeviation}%`, icon: DollarSign, color: Math.abs(budgetDeviation) >= 5 ? "text-destructive" : "text-pub-emerald", bg: Math.abs(budgetDeviation) >= 5 ? "bg-destructive/10" : "bg-pub-emerald/10", link: "/budget-tracker" },
      ],
      quickLinks: [
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "Risk Register", link: "/risk-register", icon: Shield },
        { label: "Budget Tracker", link: "/budget-tracker", icon: DollarSign },
        { label: "Analitik", link: "/analytics", icon: BarChart3 },
      ],
    };
  }

  if (position.includes("PJT")) {
    return {
      title: "Dashboard PJT",
      subtitle: "Dokumentasi Risiko & Teknis Proyek",
      icon: HardHat,
      gradient: "from-pub-amber to-pub-amber-light",
      metrics: [
        { label: "Proyek Aktif", value: activeProjects, icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/projects" },
        { label: "Risiko Terbuka", value: openRisks, icon: Shield, color: openRisks > 0 ? "text-pub-amber" : "text-pub-emerald", bg: openRisks > 0 ? "bg-pub-amber/10" : "bg-pub-emerald/10", link: "/risk-register" },
        { label: "Risiko Tinggi", value: highRisks, icon: AlertTriangle, color: highRisks > 0 ? "text-destructive" : "text-pub-emerald", bg: highRisks > 0 ? "bg-destructive/10" : "bg-pub-emerald/10", link: "/risk-register" },
        { label: "Inspeksi K3", value: k3Completed, icon: ClipboardCheck, color: "text-pub-emerald", bg: "bg-pub-emerald/10", link: "/k3-checklist" },
      ],
      quickLinks: [
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "Risk Register", link: "/risk-register", icon: Shield },
        { label: "K3 Checklist", link: "/k3-checklist", icon: ClipboardCheck },
        { label: "Generator Dokumen", link: "/generator", icon: FileText },
      ],
    };
  }

  if (position.includes("PJSKBU")) {
    return {
      title: "Dashboard PJSKBU",
      subtitle: "Subklasifikasi & Kompetensi Teknis",
      icon: FileCheck,
      gradient: "from-pub-violet to-pub-sky",
      metrics: [
        { label: "Proyek Aktif", value: activeProjects, icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/projects" },
        { label: "Risiko Terbuka", value: openRisks, icon: Shield, color: "text-pub-amber", bg: "bg-pub-amber/10", link: "/risk-register" },
        { label: "Inspeksi K3", value: k3Completed, icon: ClipboardCheck, color: "text-pub-emerald", bg: "bg-pub-emerald/10", link: "/k3-checklist" },
        { label: "Total Proyek", value: projects.length, icon: BarChart3, color: "text-pub-violet", bg: "bg-pub-violet/10", link: "/projects" },
      ],
      quickLinks: [
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "E-Course", link: "/courses", icon: FileText },
        { label: "Risk Register", link: "/risk-register", icon: Shield },
        { label: "Sertifikat", link: "/certificates", icon: FileCheck },
      ],
    };
  }

  if (position.includes("Keuangan")) {
    return {
      title: "Dashboard Manajer Keuangan",
      subtitle: "Kontrol Arus Kas & Peringatan Dini Deviasi",
      icon: DollarSign,
      gradient: "from-pub-emerald to-pub-sky",
      metrics: [
        { label: "Total Anggaran", value: fmt(totalPlanned), icon: DollarSign, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/budget-tracker" },
        { label: "Total Realisasi", value: fmt(totalActual), icon: TrendingUp, color: "text-pub-emerald", bg: "bg-pub-emerald/10", link: "/budget-tracker" },
        { label: "Deviasi Rata-rata", value: `${budgetDeviation}%`, icon: Math.abs(budgetDeviation) >= 5 ? AlertTriangle : CheckCircle2, color: Math.abs(budgetDeviation) >= 5 ? "text-destructive" : "text-pub-emerald", bg: Math.abs(budgetDeviation) >= 5 ? "bg-destructive/10" : "bg-pub-emerald/10", link: "/budget-tracker" },
        { label: "Item Warning", value: budgetWarnings, icon: AlertTriangle, color: budgetWarnings > 0 ? "text-pub-amber" : "text-pub-emerald", bg: budgetWarnings > 0 ? "bg-pub-amber/10" : "bg-pub-emerald/10", link: "/budget-tracker" },
      ],
      quickLinks: [
        { label: "Budget Tracker", link: "/budget-tracker", icon: DollarSign },
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "Analitik", link: "/analytics", icon: BarChart3 },
        { label: "Generator Laporan", link: "/generator", icon: FileText },
      ],
    };
  }

  if (position.includes("Logistik")) {
    return {
      title: "Dashboard Manajer Logistik",
      subtitle: "Logistik & Rantai Pasok",
      icon: Package,
      gradient: "from-pub-amber to-pub-emerald",
      metrics: [
        { label: "Proyek Aktif", value: activeProjects, icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/projects" },
        { label: "Budget Warning", value: budgetWarnings, icon: AlertTriangle, color: budgetWarnings > 0 ? "text-pub-amber" : "text-pub-emerald", bg: budgetWarnings > 0 ? "bg-pub-amber/10" : "bg-pub-emerald/10", link: "/budget-tracker" },
        { label: "Risiko Terbuka", value: openRisks, icon: Shield, color: "text-pub-amber", bg: "bg-pub-amber/10", link: "/risk-register" },
        { label: "Inspeksi K3", value: k3Completed, icon: ClipboardCheck, color: "text-pub-emerald", bg: "bg-pub-emerald/10", link: "/k3-checklist" },
      ],
      quickLinks: [
        { label: "Budget Tracker", link: "/budget-tracker", icon: DollarSign },
        { label: "Risk Register", link: "/risk-register", icon: Shield },
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "K3 Checklist", link: "/k3-checklist", icon: ClipboardCheck },
      ],
    };
  }

  if (position.includes("Pengadaan") || position.includes("Tender")) {
    return {
      title: "Dashboard Manajer Pengadaan",
      subtitle: "Pengadaan & Tender Management",
      icon: ShoppingCart,
      gradient: "from-pub-sky to-pub-violet",
      metrics: [
        { label: "Proyek Aktif", value: activeProjects, icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/projects" },
        { label: "Total Nilai Proyek", value: fmt(totalValue), icon: TrendingUp, color: "text-pub-emerald", bg: "bg-pub-emerald/10" },
        { label: "Budget Warning", value: budgetWarnings, icon: AlertTriangle, color: budgetWarnings > 0 ? "text-pub-amber" : "text-pub-emerald", bg: budgetWarnings > 0 ? "bg-pub-amber/10" : "bg-pub-emerald/10", link: "/budget-tracker" },
        { label: "Total Risiko", value: risks.length, icon: Shield, color: "text-pub-amber", bg: "bg-pub-amber/10", link: "/risk-register" },
      ],
      quickLinks: [
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "Budget Tracker", link: "/budget-tracker", icon: DollarSign },
        { label: "Risk Register", link: "/risk-register", icon: Shield },
        { label: "Generator Dokumen", link: "/generator", icon: FileText },
      ],
    };
  }

  if (position.includes("Administrasi")) {
    return {
      title: "Dashboard Manajer Administrasi",
      subtitle: "Administrasi & Dokumentasi",
      icon: FileText,
      gradient: "from-pub-navy to-pub-amber",
      metrics: [
        { label: "Total Proyek", value: projects.length, icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/projects" },
        { label: "Proyek Aktif", value: activeProjects, icon: CheckCircle2, color: "text-pub-emerald", bg: "bg-pub-emerald/10", link: "/projects" },
        { label: "Inspeksi K3", value: k3Completed, icon: ClipboardCheck, color: "text-pub-amber", bg: "bg-pub-amber/10", link: "/k3-checklist" },
        { label: "Total Risiko", value: risks.length, icon: Shield, color: "text-pub-violet", bg: "bg-pub-violet/10", link: "/risk-register" },
      ],
      quickLinks: [
        { label: "Generator Dokumen", link: "/generator", icon: FileText },
        { label: "Sertifikat", link: "/certificates", icon: FileCheck },
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "K3 Checklist", link: "/k3-checklist", icon: ClipboardCheck },
      ],
    };
  }

  if (position.includes("K3")) {
    return {
      title: "Dashboard Petugas K3",
      subtitle: "Dokumentasi Inspeksi & Keselamatan Kerja",
      icon: Shield,
      gradient: "from-pub-emerald to-pub-sky",
      metrics: [
        { label: "Inspeksi Selesai", value: k3Completed, icon: ClipboardCheck, color: "text-pub-emerald", bg: "bg-pub-emerald/10", link: "/k3-checklist" },
        { label: "Skor K3 Rata-rata", value: `${avgK3Score}%`, icon: BarChart3, color: avgK3Score >= 80 ? "text-pub-emerald" : "text-pub-amber", bg: avgK3Score >= 80 ? "bg-pub-emerald/10" : "bg-pub-amber/10", link: "/k3-checklist" },
        { label: "Risiko Tinggi", value: highRisks, icon: AlertTriangle, color: highRisks > 0 ? "text-destructive" : "text-pub-emerald", bg: highRisks > 0 ? "bg-destructive/10" : "bg-pub-emerald/10", link: "/risk-register" },
        { label: "Proyek Aktif", value: activeProjects, icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10", link: "/projects" },
      ],
      quickLinks: [
        { label: "K3 Checklist", link: "/k3-checklist", icon: ClipboardCheck },
        { label: "Risk Register", link: "/risk-register", icon: Shield },
        { label: "Kelola Proyek", link: "/projects", icon: FolderKanban },
        { label: "Generator Laporan", link: "/generator", icon: FileText },
      ],
    };
  }

  return null;
}

export function RoleDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const position = profile?.position || "";
  const stats = useRoleStats(position, user?.id || "");
  const config = getRoleConfig(position, stats);

  if (!position || !config) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-card text-center"
      >
        <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-heading font-semibold text-foreground mb-1">Jabatan belum dipilih</p>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Pilih jabatan di halaman Profil untuk melihat dashboard yang dipersonalisasi.
        </p>
        <button
          onClick={() => navigate("/profile")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-amber text-accent-foreground font-heading font-semibold text-sm shadow-amber hover:brightness-110 transition-all"
        >
          <Briefcase className="w-4 h-4" /> Atur Jabatan
        </button>
      </motion.div>
    );
  }

  const RoleIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Role Header */}
      <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-5 text-primary-foreground relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <RoleIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading">{config.title}</h2>
            <p className="text-sm opacity-80 font-body">{config.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Role Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {config.metrics.map((m, i) => (
          <motion.button
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => m.link && navigate(m.link)}
            className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-card-hover transition-all text-left group"
          >
            <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className="text-xl font-bold font-heading text-foreground">{m.value}</p>
            <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
              {m.label}
              {m.link && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {config.quickLinks.map((ql, i) => (
          <button
            key={ql.label}
            onClick={() => navigate(ql.link)}
            className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3 hover:shadow-card-hover transition-all text-left group"
          >
            <ql.icon className="w-4 h-4 text-muted-foreground group-hover:text-pub-amber transition-colors" />
            <span className="text-sm font-heading text-foreground">{ql.label}</span>
            <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
