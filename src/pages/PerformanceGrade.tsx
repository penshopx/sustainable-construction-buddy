import { useState } from "react";
import { usePerformanceGrades, gradeColor, gradeBg, PerformanceGrade } from "@/hooks/usePerformanceGrades";
import { useAuth } from "@/hooks/useAuth";
import { exportGradingPdf } from "@/lib/gradingPdf";
import GradeTrendChart from "@/components/grading/GradeTrendChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Calculator,
  Loader2,
  Banknote,
  FolderKanban,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  FileDown,
} from "lucide-react";

const currentYear = new Date().getFullYear();

const pillarConfig = [
  { key: "financial", label: "Keuangan", icon: Banknote, color: "text-pub-emerald", bg: "bg-pub-emerald/10" },
  { key: "project", label: "Kinerja Proyek", icon: FolderKanban, color: "text-pub-sky", bg: "bg-pub-sky/10" },
  { key: "compliance", label: "Kepatuhan & SDM", icon: ShieldCheck, color: "text-pub-amber", bg: "bg-pub-amber/10" },
  { key: "risk", label: "Risk & K3", icon: AlertTriangle, color: "text-pub-violet", bg: "bg-pub-violet/10" },
];

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <Progress value={score} className={`h-2 ${color}`} />
    </div>
  );
}

export default function PerformanceGradePage() {
  const { grades, loading, computing, computeGrade } = usePerformanceGrades();
  const { profile } = useAuth();
  const [detailGrade, setDetailGrade] = useState<PerformanceGrade | null>(null);

  const latestGrade = grades[0];

  const handleCompute = () => {
    const period = `${currentYear}`;
    computeGrade(period);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Kinerja & Grading BUJK
          </h2>
          <p className="text-sm text-muted-foreground">
            Kalkulasi otomatis grade AAA–F berdasarkan 4 pilar kinerja
          </p>
        </div>
        <div className="flex gap-2">
          {latestGrade && (
            <Button variant="outline" onClick={() => exportGradingPdf(latestGrade, profile?.full_name)}>
              <FileDown className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          )}
          <Button onClick={handleCompute} disabled={computing}>
            {computing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
            Hitung Grade {currentYear}
          </Button>
        </div>
      </div>

      {/* Latest Grade Hero */}
      {latestGrade ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-2 ${gradeBg(latestGrade.grade)}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-heading uppercase tracking-wider mb-1">Grade Terkini</p>
                  <div className={`text-6xl font-black font-heading ${gradeColor(latestGrade.grade)}`}>
                    {latestGrade.grade}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Periode {latestGrade.period}</p>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Skor Komposit</span>
                    <span className="font-bold text-lg">{latestGrade.total_score}/100</span>
                  </div>
                  <Progress value={latestGrade.total_score} className="h-3" />
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {pillarConfig.map(p => {
                      const score = latestGrade[`${p.key}_score` as keyof PerformanceGrade] as number;
                      return (
                        <div key={p.key} className={`rounded-lg p-3 ${p.bg} text-center`}>
                          <p.icon className={`w-4 h-4 mx-auto mb-1 ${p.color}`} />
                          <p className="text-xs text-muted-foreground">{p.label}</p>
                          <p className="font-bold text-sm">{score}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : !loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Belum ada data grading</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Klik "Hitung Grade" untuk menghitung berdasarkan data LKUT, proyek, risk register, dan K3 Anda
            </p>
            <Button className="mt-4" onClick={handleCompute} disabled={computing}>
              {computing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
              Hitung Grade Sekarang
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
      )}

      {/* Grade Scale Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Skala Grade BUJK</CardTitle>
          <CardDescription>Berdasarkan skor komposit 4 pilar (Keuangan 30%, Proyek 30%, Kepatuhan 20%, Risk 20%)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { g: "AAA", min: 95, c: "bg-pub-emerald/20 text-pub-emerald border-pub-emerald/30" },
              { g: "AA", min: 85, c: "bg-pub-emerald/10 text-pub-emerald border-pub-emerald/20" },
              { g: "A", min: 75, c: "bg-pub-sky/20 text-pub-sky border-pub-sky/30" },
              { g: "BBB", min: 65, c: "bg-pub-sky/10 text-pub-sky border-pub-sky/20" },
              { g: "BB", min: 55, c: "bg-pub-amber/20 text-pub-amber border-pub-amber/30" },
              { g: "B", min: 45, c: "bg-pub-amber/10 text-pub-amber border-pub-amber/20" },
              { g: "CCC", min: 35, c: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
              { g: "CC", min: 25, c: "bg-orange-500/10 text-orange-400 border-orange-400/20" },
              { g: "C", min: 15, c: "bg-destructive/10 text-destructive border-destructive/20" },
              { g: "D", min: 5, c: "bg-destructive/10 text-destructive border-destructive/20" },
              { g: "F", min: 0, c: "bg-destructive/20 text-destructive border-destructive/30" },
            ].map(item => (
              <Badge key={item.g} variant="outline" className={`${item.c} font-heading`}>
                {item.g} ≥{item.min}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      {grades.length > 0 && <GradeTrendChart grades={grades} />}

      {/* History */}
      {grades.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">Riwayat Grading</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {grades.map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setDetailGrade(g)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-black font-heading ${gradeColor(g.grade)}`}>{g.grade}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Periode {g.period}</p>
                      <p className="text-xs text-muted-foreground">
                        Dihitung: {new Date(g.computed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold">{g.total_score}</p>
                      <p className="text-xs text-muted-foreground">poin</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailGrade} onOpenChange={open => { if (!open) setDetailGrade(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailGrade && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={`text-4xl font-black font-heading ${gradeColor(detailGrade.grade)}`}>
                    {detailGrade.grade}
                  </span>
                  <div>
                    <p className="text-sm text-foreground">Periode {detailGrade.period}</p>
                    <p className="text-xs text-muted-foreground">Skor: {detailGrade.total_score}/100</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {pillarConfig.map(p => {
                  const score = detailGrade[`${p.key}_score` as keyof PerformanceGrade] as number;
                  const breakdown = (detailGrade.breakdown as any)?.[p.key] || {};
                  return (
                    <Card key={p.key} className="overflow-hidden">
                      <CardHeader className={`py-3 px-4 ${p.bg}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p.icon className={`w-4 h-4 ${p.color}`} />
                            <CardTitle className="text-sm">{p.label}</CardTitle>
                          </div>
                          <Badge variant="outline" className={`font-bold ${p.color}`}>{score}/100</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 px-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(breakdown)
                            .filter(([k]) => !["score", "weight", "reason"].includes(k))
                            .map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-muted-foreground">{k.replace(/_/g, " ")}</span>
                                <span className="font-medium">{typeof v === "boolean" ? (v ? "✓" : "✗") : String(v ?? "-")}</span>
                              </div>
                            ))}
                          {breakdown.reason && (
                            <p className="col-span-2 text-muted-foreground italic">{breakdown.reason}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => exportGradingPdf(detailGrade, profile?.full_name)}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" onClick={() => setDetailGrade(null)}>Tutup</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
