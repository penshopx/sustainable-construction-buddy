import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLkutReports } from "@/hooks/useLkutReports";
import { usePancekAssessment } from "@/hooks/usePancekAssessment";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarClock,
  FileCheck2,
  ClipboardCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface ComplianceItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "valid" | "expiring" | "expired" | "missing";
  deadline?: string;
  daysLeft?: number;
  fulfilled: boolean;
  details?: string;
}

function getUrgencyColor(status: ComplianceItem["status"]) {
  switch (status) {
    case "valid": return "bg-pub-emerald/15 border-pub-emerald/30 text-pub-emerald";
    case "expiring": return "bg-pub-amber/15 border-pub-amber/30 text-pub-amber";
    case "expired": return "bg-destructive/15 border-destructive/30 text-destructive";
    case "missing": return "bg-muted border-border text-muted-foreground";
  }
}

function getStatusBadge(status: ComplianceItem["status"]) {
  switch (status) {
    case "valid": return <Badge className="bg-pub-emerald/20 text-pub-emerald border-pub-emerald/30"><CheckCircle2 className="w-3 h-3 mr-1" />Aktif</Badge>;
    case "expiring": return <Badge className="bg-pub-amber/20 text-pub-amber border-pub-amber/30"><Clock className="w-3 h-3 mr-1" />Segera Habis</Badge>;
    case "expired": return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Kadaluarsa</Badge>;
    case "missing": return <Badge variant="outline" className="text-muted-foreground"><AlertTriangle className="w-3 h-3 mr-1" />Belum Ada</Badge>;
  }
}

export default function ComplianceTracker() {
  const { reports, loading } = useLkutReports();
  const { assessments, loading: pancekLoading } = usePancekAssessment();
  const navigate = useNavigate();
  const latestLkut = reports?.[0];
  const currentYear = new Date().getFullYear();
  const latestPancek = assessments?.find(a => a.period_year === currentYear) || assessments?.[0];

  const complianceItems = useMemo<ComplianceItem[]>(() => {
    if (!latestLkut) {
      return [
        { id: "sbu", label: "Sertifikat Badan Usaha (SBU)", description: "Perizinan utama BUJK", icon: FileCheck2, status: "missing", fulfilled: false, details: "Belum ada data LKUT" },
        { id: "smap", label: "SMAP (Sistem Manajemen Anti Penyuapan)", description: "Kepatuhan ISO 37001", icon: ShieldCheck, status: "missing", fulfilled: false, details: "Belum ada data LKUT" },
        { id: "tkk", label: "Tenaga Kerja Konstruksi (TKK)", description: "Penggantian/pembaruan TKK", icon: ClipboardCheck, status: "missing", fulfilled: false, details: "Belum ada data LKUT" },
        { id: "gcg", label: "Good Corporate Governance (GCG)", description: "Penerapan tata kelola perusahaan", icon: ShieldCheck, status: "missing", fulfilled: false, details: "Belum ada data LKUT" },
        { id: "smk3", label: "SMK3 (Sistem Manajemen K3)", description: "Kepatuhan keselamatan kerja", icon: ShieldCheck, status: "missing", fulfilled: false, details: "Belum ada data LKUT" },
      ];
    }

    const now = new Date();
    const items: ComplianceItem[] = [];

    // SBU
    const sbuExpiry = latestLkut.sbu_expiry_date ? parseISO(latestLkut.sbu_expiry_date) : null;
    const sbuDaysLeft = sbuExpiry ? differenceInDays(sbuExpiry, now) : null;
    let sbuStatus: ComplianceItem["status"] = "missing";
    if (latestLkut.sbu_number && sbuExpiry) {
      if (sbuDaysLeft! < 0) sbuStatus = "expired";
      else if (sbuDaysLeft! <= 90) sbuStatus = "expiring";
      else sbuStatus = "valid";
    }
    items.push({
      id: "sbu",
      label: "Sertifikat Badan Usaha (SBU)",
      description: latestLkut.sbu_number ? `No. ${latestLkut.sbu_number}` : "Belum diisi",
      icon: FileCheck2,
      status: sbuStatus,
      deadline: sbuExpiry ? format(sbuExpiry, "d MMMM yyyy", { locale: localeId }) : undefined,
      daysLeft: sbuDaysLeft ?? undefined,
      fulfilled: sbuStatus === "valid" || sbuStatus === "expiring",
      details: sbuDaysLeft !== null && sbuDaysLeft >= 0
        ? `${sbuDaysLeft} hari lagi`
        : sbuDaysLeft !== null ? `Kadaluarsa ${Math.abs(sbuDaysLeft)} hari lalu` : undefined,
    });

    // SMAP
    const smapDate = latestLkut.smap_report_date ? parseISO(latestLkut.smap_report_date) : null;
    items.push({
      id: "smap",
      label: "SMAP (Sistem Manajemen Anti Penyuapan)",
      description: "Kepatuhan ISO 37001",
      icon: ShieldCheck,
      status: latestLkut.smap_fulfilled ? "valid" : "missing",
      deadline: smapDate ? format(smapDate, "d MMMM yyyy", { locale: localeId }) : undefined,
      fulfilled: !!latestLkut.smap_fulfilled,
      details: latestLkut.smap_fulfilled
        ? `Terpenuhi${smapDate ? `, dilaporkan ${format(smapDate, "d MMM yyyy", { locale: localeId })}` : ""}`
        : "Belum terpenuhi",
    });

    // TKK
    const tkkDate = latestLkut.tkk_replacement_date ? parseISO(latestLkut.tkk_replacement_date) : null;
    items.push({
      id: "tkk",
      label: "Tenaga Kerja Konstruksi (TKK)",
      description: "Penggantian/pembaruan TKK",
      icon: ClipboardCheck,
      status: latestLkut.tkk_replacement ? "valid" : "missing",
      deadline: tkkDate ? format(tkkDate, "d MMMM yyyy", { locale: localeId }) : undefined,
      fulfilled: !!latestLkut.tkk_replacement,
      details: latestLkut.tkk_replacement
        ? `Terpenuhi${tkkDate ? `, tanggal ${format(tkkDate, "d MMM yyyy", { locale: localeId })}` : ""}`
        : latestLkut.tkk_replacement_notes || "Belum ada penggantian",
    });

    // GCG
    items.push({
      id: "gcg",
      label: "Good Corporate Governance (GCG)",
      description: "Penerapan tata kelola perusahaan",
      icon: ShieldCheck,
      status: latestLkut.gcg_applied ? "valid" : "missing",
      fulfilled: !!latestLkut.gcg_applied,
      details: latestLkut.gcg_applied
        ? `Diterapkan${latestLkut.gcg_first_year ? ` sejak ${latestLkut.gcg_first_year}` : ""}`
        : "Belum diterapkan",
    });

    // SMK3
    items.push({
      id: "smk3",
      label: "SMK3 (Sistem Manajemen K3)",
      description: "Kepatuhan keselamatan kerja",
      icon: ShieldCheck,
      status: latestLkut.smk3_applied ? "valid" : "missing",
      fulfilled: !!latestLkut.smk3_applied,
      details: latestLkut.smk3_applied
        ? `Diterapkan${latestLkut.smk3_first_year ? ` sejak ${latestLkut.smk3_first_year}` : ""}`
        : "Belum diterapkan",
    });

    // PANCEK KPK
    const pancekVerified = latestPancek?.status === "verified";
    const pancekSubmitted = latestPancek?.status === "submitted";
    let pancekStatus: ComplianceItem["status"] = "missing";
    if (pancekVerified) pancekStatus = "valid";
    else if (pancekSubmitted) pancekStatus = "expiring";

    items.push({
      id: "pancek",
      label: "PANCEK KPK (Panduan Cegah Korupsi)",
      description: "Syarat perpanjangan SBU — Verifikasi Asosiasi",
      icon: ShieldAlert,
      status: pancekStatus,
      fulfilled: pancekVerified,
      details: pancekVerified
        ? `Terverifikasi${latestPancek?.verified_at ? ` pada ${new Date(latestPancek.verified_at).toLocaleDateString("id-ID")}` : ""}`
        : pancekSubmitted
        ? `Menunggu verifikasi Asosiasi (${latestPancek?.completion_percent || 0}% terisi)`
        : latestPancek
        ? `Draft — ${latestPancek.completion_percent || 0}% terisi`
        : "Belum mengisi self-assessment PANCEK",
    });

    return items;
  }, [latestLkut, latestPancek]);

  const fulfilledCount = complianceItems.filter(i => i.fulfilled).length;
  const compliancePct = Math.round((fulfilledCount / complianceItems.length) * 100);
  const urgentItems = complianceItems.filter(i => i.status === "expiring" || i.status === "expired");

  if (loading || pancekLoading) {
    return <div className="text-center py-12 text-muted-foreground">Memuat data kepatuhan...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-accent" />
          Compliance Tracker
        </h2>
        <p className="text-sm text-muted-foreground">
          Pantau kepatuhan perizinan SBU, SMAP, TKK, GCG, SMK3 & PANCEK KPK BUJK Anda
        </p>
      </div>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="text-center min-w-[100px]">
                <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">Kepatuhan</p>
                <div className={`text-5xl font-black font-heading ${compliancePct >= 80 ? "text-pub-emerald" : compliancePct >= 50 ? "text-pub-amber" : "text-destructive"}`}>
                  {compliancePct}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">{fulfilledCount}/{complianceItems.length} terpenuhi</p>
              </div>
              <div className="flex-1 space-y-3">
                <Progress value={compliancePct} className="h-3" />
                {urgentItems.length > 0 && (
                  <div className="space-y-1.5">
                    {urgentItems.map(item => (
                      <div key={item.id} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md ${item.status === "expired" ? "bg-destructive/10 text-destructive" : "bg-pub-amber/10 text-pub-amber"}`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="text-xs">{item.details}</span>
                      </div>
                    ))}
                  </div>
                )}
                {urgentItems.length === 0 && fulfilledCount === complianceItems.length && (
                  <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-pub-emerald/10 text-pub-emerald">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Semua kepatuhan terpenuhi</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Compliance Items */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {complianceItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`border ${getUrgencyColor(item.status)} h-full`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 shrink-0" />
                    <CardTitle className="text-sm leading-tight">{item.label}</CardTitle>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {item.deadline && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">{item.deadline}</span>
                  </div>
                )}
                {item.details && (
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                )}
                {item.daysLeft !== undefined && item.daysLeft > 0 && item.daysLeft <= 90 && (
                  <Progress value={Math.max(0, 100 - (item.daysLeft / 90) * 100)} className="h-1.5" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Deadline Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-accent" />
            Referensi Batas Waktu
          </CardTitle>
          <CardDescription>Berdasarkan Permen PUPR No. 7/2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
              <FileCheck2 className="w-4 h-4 text-pub-sky mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">LKUT</p>
                <p className="text-xs text-muted-foreground">Batas pelaporan: 30 April setiap tahun</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
              <FileCheck2 className="w-4 h-4 text-pub-emerald mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">SBU</p>
                <p className="text-xs text-muted-foreground">Perpanjang sebelum masa berlaku habis</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
              <ShieldCheck className="w-4 h-4 text-pub-amber mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">SMAP</p>
                <p className="text-xs text-muted-foreground">Wajib dipenuhi sesuai ketentuan LPJK</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
              <ClipboardCheck className="w-4 h-4 text-pub-violet mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">TKK</p>
                <p className="text-xs text-muted-foreground">Penggantian dilaporkan dalam LKUT</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-md bg-pub-amber/10 border border-pub-amber/20">
              <ShieldAlert className="w-4 h-4 text-pub-amber mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-foreground">PANCEK KPK</p>
                <p className="text-xs text-muted-foreground">Verifikasi oleh Asosiasi — syarat perpanjangan SBU</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1 text-xs shrink-0" onClick={() => navigate("/smap")}>
                <ExternalLink className="w-3 h-3" />
                Buka SMAP
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
