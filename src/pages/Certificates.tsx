import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
  id: string;
  level: string;
  certificate_number: string;
  issued_at: string;
  full_name: string;
  company: string;
  position: string;
}

interface LevelStatus {
  level: string;
  totalModules: number;
  completedModules: number;
  certificate: Certificate | null;
}

const LEVELS = ["Pemula", "Muda", "Madya", "Utama"];

const levelColors: Record<string, string> = {
  Pemula: "from-emerald-500 to-teal-600",
  Muda: "from-blue-500 to-indigo-600",
  Madya: "from-violet-500 to-purple-600",
  Utama: "from-amber-500 to-orange-600",
};

const levelBorderColors: Record<string, string> = {
  Pemula: "border-emerald-500/30",
  Muda: "border-blue-500/30",
  Madya: "border-violet-500/30",
  Utama: "border-amber-500/30",
};

export default function Certificates() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<LevelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchStatuses();
  }, [user]);

  const fetchStatuses = async () => {
    if (!user) return;

    const [modulesRes, progressRes, certsRes] = await Promise.all([
      supabase.from("e_course_modules").select("id, level"),
      supabase.from("module_progress").select("module_id, status").eq("user_id", user.id),
      supabase.from("certificates").select("*").eq("user_id", user.id),
    ]);

    const modules = modulesRes.data || [];
    const progress = progressRes.data || [];
    const certs = (certsRes.data || []) as Certificate[];

    const completedSet = new Set(
      progress.filter((p) => p.status === "completed").map((p) => p.module_id)
    );

    const result: LevelStatus[] = LEVELS.map((level) => {
      const levelModules = modules.filter((m) => m.level === level);
      const completedCount = levelModules.filter((m) => completedSet.has(m.id)).length;
      const cert = certs.find((c) => c.level === level) || null;
      return { level, totalModules: levelModules.length, completedModules: completedCount, certificate: cert };
    });

    setStatuses(result);
    setLoading(false);
  };

  const handleGenerate = async (level: string) => {
    setGenerating(level);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("generate-certificate", {
        body: { level },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error) throw res.error;
      if (res.data?.error) {
        toast({ title: "Gagal", description: res.data.error, variant: "destructive" });
      } else {
        toast({ title: "Sertifikat diterbitkan!", description: `Sertifikat level ${level} berhasil dibuat.` });
        fetchStatuses();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  };

  const downloadCertificate = (cert: Certificate) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const W = 1200, H = 850;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    // Border
    const colors: Record<string, string> = {
      Pemula: "#10B981", Muda: "#3B82F6", Madya: "#8B5CF6", Utama: "#F59E0B",
    };
    const color = colors[cert.level] || "#3B82F6";
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Inner border
    ctx.strokeStyle = color + "40";
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, W - 70, H - 70);

    // Header
    ctx.fillStyle = "#1F2937";
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PUB KONSTRUKSI — ASPEKINDO", W / 2, 90);

    // Title
    ctx.fillStyle = color;
    ctx.font = "bold 42px Arial, sans-serif";
    ctx.fillText("SERTIFIKAT KOMPETENSI", W / 2, 160);

    // Level
    ctx.fillStyle = "#6B7280";
    ctx.font = "20px Arial, sans-serif";
    ctx.fillText(`Level: ${cert.level}`, W / 2, 200);

    // Awarded to
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText("Diberikan kepada:", W / 2, 270);

    // Name
    ctx.fillStyle = "#111827";
    ctx.font = "bold 38px Arial, sans-serif";
    ctx.fillText(cert.full_name || "—", W / 2, 330);

    // Company & position
    if (cert.position || cert.company) {
      ctx.fillStyle = "#6B7280";
      ctx.font = "18px Arial, sans-serif";
      ctx.fillText([cert.position, cert.company].filter(Boolean).join(" — "), W / 2, 370);
    }

    // Description
    ctx.fillStyle = "#4B5563";
    ctx.font = "16px Arial, sans-serif";
    const desc = `Telah menyelesaikan seluruh modul pembelajaran`;
    const desc2 = `Pengembangan Usaha Berkelanjutan pada level ${cert.level}`;
    ctx.fillText(desc, W / 2, 430);
    ctx.fillText(desc2, W / 2, 455);

    // Decorative line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, 490);
    ctx.lineTo(850, 490);
    ctx.stroke();

    // Certificate number
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText(`No. ${cert.certificate_number}`, W / 2, 530);

    // Date
    ctx.fillText(
      `Diterbitkan pada ${new Date(cert.issued_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      W / 2, 555
    );

    // Footer
    ctx.fillStyle = "#D1D5DB";
    ctx.font = "12px Arial, sans-serif";
    ctx.fillText("Pengembangan Usaha Berkelanjutan — Konstruksi Indonesia", W / 2, H - 50);

    // Download
    const link = document.createElement("a");
    link.download = `Sertifikat-${cert.level}-${cert.certificate_number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <Award className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Sertifikat Digital</h1>
          <p className="text-sm text-muted-foreground">
            Selesaikan semua modul per level untuk mendapatkan sertifikat
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statuses.map((s) => {
          const allDone = s.totalModules > 0 && s.completedModules >= s.totalModules;
          const hasCert = !!s.certificate;
          const noModules = s.totalModules === 0;

          return (
            <Card key={s.level} className={`relative overflow-hidden border-2 ${hasCert ? levelBorderColors[s.level] : "border-border"}`}>
              {hasCert && (
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${levelColors[s.level]}`} />
              )}
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  {hasCert ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : allDone ? (
                    <Award className="w-5 h-5 text-accent" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                  Level {s.level}
                </CardTitle>
                <Badge variant={hasCert ? "default" : "secondary"}>
                  {hasCert ? "Diterbitkan" : noModules ? "Belum tersedia" : `${s.completedModules}/${s.totalModules} modul`}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {!noModules && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${levelColors[s.level]} transition-all`}
                      style={{ width: `${(s.completedModules / s.totalModules) * 100}%` }}
                    />
                  </div>
                )}

                {hasCert ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      No. {s.certificate!.certificate_number} •{" "}
                      {new Date(s.certificate!.issued_at).toLocaleDateString("id-ID")}
                    </p>
                    <Button
                      onClick={() => downloadCertificate(s.certificate!)}
                      className={`w-full bg-gradient-to-r ${levelColors[s.level]} text-white hover:opacity-90`}
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Sertifikat
                    </Button>
                  </div>
                ) : allDone ? (
                  <Button
                    onClick={() => handleGenerate(s.level)}
                    disabled={generating === s.level}
                    className="w-full"
                  >
                    {generating === s.level ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membuat...</>
                    ) : (
                      <><Award className="w-4 h-4 mr-2" /> Terbitkan Sertifikat</>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {noModules
                        ? "Modul untuk level ini belum tersedia."
                        : `Selesaikan ${s.totalModules - s.completedModules} modul lagi untuk mendapatkan sertifikat.`}
                    </p>
                    {!noModules && !hasCert && (
                      <div className="text-xs text-muted-foreground/70 bg-muted/30 rounded-lg p-2.5 border border-dashed border-border">
                        <p className="font-heading font-semibold text-foreground/80 mb-1">💡 Tips:</p>
                        <p>Buka menu <strong>E-Learning</strong> → pilih modul level <strong>{s.level}</strong> → selesaikan materi & kuis (min. 70%) untuk mendapat sertifikat digital.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
