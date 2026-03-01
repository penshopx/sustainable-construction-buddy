import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  FolderKanban,
  ShieldAlert,
  DollarSign,
  HardHat,
  FileText,
  GraduationCap,
  Award,
  TrendingUp,
  Lightbulb,
  Store,
  Building2,
  ArrowRight,
  ArrowLeft,
  Rocket,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    icon: Rocket,
    title: "Selamat Datang di PUB ASPEKINDO!",
    subtitle: "Platform Pengembangan Usaha Berkelanjutan",
    description:
      "Mari kita jelajahi fitur-fitur utama platform ini. Kami telah menyiapkan data demo agar Anda bisa langsung melihat bagaimana setiap fitur bekerja.",
    color: "from-pub-amber to-pub-amber-light",
    iconBg: "bg-pub-amber/20 text-pub-amber",
    tips: [
      "Data demo otomatis dimuat saat Anda mendaftar",
      "Anda bisa menghapus/mengubah data demo kapan saja",
      "Gunakan sidebar kiri untuk navigasi antar modul",
    ],
    route: "/dashboard",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard Utama",
    subtitle: "Pusat kontrol bisnis Anda",
    description:
      "Dashboard menampilkan ringkasan keseluruhan: level kompetensi, skor kinerja, proyek aktif, dan notifikasi penting. Semua informasi kunci dalam satu pandangan.",
    color: "from-blue-500 to-blue-400",
    iconBg: "bg-blue-500/20 text-blue-500",
    tips: [
      "Lihat 4 Engine skor kompetensi (Learning, Project, Toolkit, Contribution)",
      "Widget proyek aktif menunjukkan status real-time",
      "Notifikasi SBU expiry muncul otomatis",
    ],
    route: "/dashboard",
  },
  {
    id: "projects",
    icon: FolderKanban,
    title: "Manajemen Proyek",
    subtitle: "Kelola seluruh portofolio proyek konstruksi",
    description:
      "Catat dan pantau semua proyek Anda. Setiap proyek terhubung dengan Risk Register, Budget Tracker, dan K3 Checklist untuk pengelolaan terintegrasi.",
    color: "from-emerald-500 to-emerald-400",
    iconBg: "bg-emerald-500/20 text-emerald-500",
    tips: [
      "3 proyek demo sudah tersedia: Gedung, Jalan Tol, Drainase",
      "Complexity Score dihitung otomatis dari parameter proyek",
      "Klik proyek untuk melihat detail & toolkit terhubung",
    ],
    route: "/projects",
  },
  {
    id: "risk",
    icon: ShieldAlert,
    title: "Risk Register",
    subtitle: "Identifikasi & mitigasi risiko proyek",
    description:
      "Dokumentasikan risiko proyek menggunakan matriks probabilitas × dampak. Tetapkan penanggung jawab dan rencana mitigasi untuk setiap risiko yang teridentifikasi.",
    color: "from-red-500 to-orange-400",
    iconBg: "bg-red-500/20 text-red-500",
    tips: [
      "Risk Matrix 5×5 menampilkan peta risiko visual",
      "4 risiko demo sudah terhubung ke proyek",
      "Filter berdasarkan proyek atau level risiko",
    ],
    route: "/risk-register",
  },
  {
    id: "budget",
    icon: DollarSign,
    title: "Budget Tracker",
    subtitle: "Monitor cashflow & deviasi anggaran",
    description:
      "Pantau realisasi vs rencana anggaran per kategori dan periode. Identifikasi deviasi dini dan catat rencana mitigasi untuk menjaga kesehatan finansial proyek.",
    color: "from-green-500 to-emerald-400",
    iconBg: "bg-green-500/20 text-green-500",
    tips: [
      "5 entri budget demo mencakup Material, Upah, Peralatan",
      "Grafik deviasi menunjukkan tren per bulan",
      "Summary card menampilkan total planned vs actual",
    ],
    route: "/budget-tracker",
  },
  {
    id: "k3",
    icon: HardHat,
    title: "K3 Checklist",
    subtitle: "Inspeksi Keselamatan & Kesehatan Kerja",
    description:
      "Lakukan inspeksi K3 dengan checklist terstruktur. Dokumentasikan temuan, tindakan korektif, dan hitung skor kepatuhan secara otomatis.",
    color: "from-yellow-500 to-amber-400",
    iconBg: "bg-yellow-500/20 text-yellow-600",
    tips: [
      "1 inspeksi demo dengan skor 90% dan 10 item pemeriksaan",
      "Kategori: APD, Lingkungan, Peralatan, Prosedur",
      "2 temuan minor sudah terisi sebagai contoh",
    ],
    route: "/k3-checklist",
  },
  {
    id: "lkut",
    icon: FileText,
    title: "Laporan LKUT",
    subtitle: "Laporan Kinerja Usaha Tahunan",
    description:
      "Buat laporan LKUT yang komprehensif mencakup data SBU, keuangan, SDM, sertifikasi, dan penghargaan. Ekspor ke PDF untuk dilampirkan pada perpanjangan SBU.",
    color: "from-indigo-500 to-violet-400",
    iconBg: "bg-indigo-500/20 text-indigo-500",
    tips: [
      "1 laporan LKUT 2024 dengan data lengkap sudah tersedia",
      "Data keuangan terisi: aset, penjualan, laba, ekuitas",
      "Sertifikasi ISO dan penghargaan sudah tercatat",
    ],
    route: "/lkut",
  },
  {
    id: "courses",
    icon: GraduationCap,
    title: "E-Learning & Assessment",
    subtitle: "Tingkatkan kompetensi melalui pembelajaran",
    description:
      "Akses modul e-learning berdasarkan domain kompetensi. Ikuti pre-test untuk menentukan level awal, lalu selesaikan kuis di setiap modul untuk mendapatkan sertifikat.",
    color: "from-purple-500 to-pink-400",
    iconBg: "bg-purple-500/20 text-purple-500",
    tips: [
      "Pre-Test menentukan level: Pemula → Muda → Madya → Utama",
      "Skor ≥70% di kuis modul = sertifikat digital",
      "Bookmark modul favorit untuk akses cepat",
    ],
    route: "/courses",
  },
  {
    id: "grading",
    icon: TrendingUp,
    title: "Performance Grading",
    subtitle: "Penilaian kinerja komprehensif",
    description:
      "Sistem grading otomatis menghitung skor dari 4 pilar: Keuangan, Proyek, Kepatuhan, dan Risiko. Hasil grade (A+ sampai F) menjadi tolok ukur kinerja BUJK Anda.",
    color: "from-cyan-500 to-teal-400",
    iconBg: "bg-cyan-500/20 text-cyan-500",
    tips: [
      "Grade demo: B+ dengan total skor 78.75",
      "4 pilar skor: Financial 82, Project 88, Compliance 75, Risk 70",
      "Tren grade per periode ditampilkan dalam grafik",
    ],
    route: "/grading",
  },
  {
    id: "innovation",
    icon: Lightbulb,
    title: "Inovasi & Marketplace",
    subtitle: "Kolaborasi dan jual-beli antar BUJK",
    description:
      "Ajukan proposal inovasi untuk ditinjau asosiasi. Gunakan marketplace untuk menjual/membeli jasa, material, dan dokumen template antar sesama anggota BUJK.",
    color: "from-orange-500 to-rose-400",
    iconBg: "bg-orange-500/20 text-orange-500",
    tips: [
      "Kategori inovasi: Teknologi, Manajemen, Keberlanjutan",
      "Marketplace mendukung jasa konsultan & material",
      "Direktori BUJK menampilkan profil perusahaan anggota",
    ],
    route: "/inovasi",
  },
  {
    id: "finish",
    icon: Sparkles,
    title: "Anda Siap Memulai! 🎉",
    subtitle: "Semua fitur sudah siap digunakan",
    description:
      "Selamat! Anda telah mengenal semua fitur utama PUB ASPEKINDO. Data demo sudah tersedia di setiap modul. Mulailah dari Dashboard untuk melihat gambaran keseluruhan.",
    color: "from-pub-amber to-yellow-400",
    iconBg: "bg-pub-amber/20 text-pub-amber",
    tips: [
      "Eksplorasi setiap modul dengan data demo yang sudah terisi",
      "Tambahkan data proyek nyata Anda kapan saja",
      "Hubungi Helpdesk AI jika ada pertanyaan",
    ],
    route: "/dashboard",
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;
  const Icon = step.icon;

  const handleFinish = () => {
    localStorage.setItem("pub_onboarding_done", "1");
    navigate("/dashboard");
  };

  const handleSkip = () => {
    localStorage.setItem("pub_onboarding_done", "1");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading font-bold text-foreground">PUB ASPEKINDO</span>
          <Badge variant="outline" className="text-xs">Onboarding</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {currentStep + 1} / {STEPS.length}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground text-xs">
            Lewati
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 md:px-8 pt-4">
        <Progress value={progress} className="h-1.5 max-w-2xl mx-auto" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <Card className="p-6 md:p-10 border-border/50 shadow-lg">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center ${step.iconBg}`}
                  >
                    <Icon className="w-10 h-10" />
                  </motion.div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-foreground mb-1">
                    {step.title}
                  </h1>
                  <p className={`text-sm font-semibold bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                    {step.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="text-center text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
                  {step.description}
                </p>

                {/* Tips */}
                <div className="space-y-3 mb-8">
                  {step.tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{tip}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep((s) => s - 1)}
                    disabled={isFirst}
                    className="gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                  </Button>

                  {!isLast && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(step.route)}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Lihat halaman ini <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}

                  {isLast ? (
                    <Button
                      onClick={handleFinish}
                      className="bg-gradient-to-r from-pub-amber to-pub-amber-light text-accent-foreground font-heading shadow-amber hover:brightness-110 gap-1"
                    >
                      Mulai Sekarang <Rocket className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => setCurrentStep((s) => s + 1)} className="gap-1">
                      Lanjut <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>

              {/* Step dots */}
              <div className="flex justify-center gap-1.5 mt-6">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStep
                        ? "bg-primary w-6"
                        : i < currentStep
                        ? "bg-primary/40"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
