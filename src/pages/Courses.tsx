import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  GraduationCap, Clock, CheckCircle2, PlayCircle, Lock,
  Star, Award, Crown, Gem, BookOpen, ArrowRight, HelpCircle, Trophy,
  BookMarked, Filter, Search, ArrowUpDown, Bookmark, AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const levelIcons: Record<string, any> = { Pemula: Star, Muda: Award, Madya: Crown, Utama: Gem };
const levelColors: Record<string, string> = {
  Pemula: "text-pub-sky",
  Muda: "text-pub-emerald",
  Madya: "text-pub-amber",
  Utama: "text-pub-violet",
};
const levelBadgeColors: Record<string, string> = {
  Pemula: "bg-pub-sky/15 text-pub-sky border-pub-sky/30",
  Muda: "bg-pub-emerald/15 text-pub-emerald border-pub-emerald/30",
  Madya: "bg-pub-amber/15 text-pub-amber border-pub-amber/30",
  Utama: "bg-pub-violet/15 text-pub-violet border-pub-violet/30",
};

const domainIcons: Record<string, any> = {
  "Manajemen Proyek": BookOpen,
  "K3": Lock,
  "Keuangan": Star,
  "Regulasi": BookMarked,
};

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  level: string;
  duration_minutes: number;
  sort_order: number;
  domain_id: string;
  domain_name: string;
  progress?: { status: string; progress_percent: number; id?: string };
  bestQuizScore?: number | null;
  isBookmarked?: boolean;
}

interface Domain {
  id: string;
  name: string;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  sort_order: number;
}

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<number, number>;
  showResult: boolean;
  score: number;
  submitted: boolean;
}

const ModuleCardSkeleton = () => (
  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

const Courses = () => {
  const { user, profile } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: domainsData }, { data: modulesData }, { data: progressData }, { data: quizResults }, { data: bookmarksData }] = await Promise.all([
        supabase.from("competency_domains").select("*").order("sort_order"),
        supabase.from("e_course_modules").select("*, competency_domains!inner(name)").order("sort_order"),
        supabase.from("module_progress").select("*").eq("user_id", user.id),
        supabase.from("module_quiz_results" as any).select("module_id, score").eq("user_id", user.id),
        supabase.from("module_bookmarks" as any).select("module_id").eq("user_id", user.id),
      ]);

      setDomains(domainsData || []);

      const bestScores: Record<string, number> = {};
      ((quizResults as any[]) || []).forEach((r: any) => {
        if (!bestScores[r.module_id] || r.score > bestScores[r.module_id]) {
          bestScores[r.module_id] = r.score;
        }
      });

      const bookmarkedIds = new Set(((bookmarksData as any[]) || []).map((b: any) => b.module_id));

      const enriched: Module[] = (modulesData || []).map((m: any) => {
        const prog = (progressData || []).find((p: any) => p.module_id === m.id);
        return {
          ...m,
          domain_name: m.competency_domains?.name || "",
          progress: prog
            ? { status: prog.status, progress_percent: prog.progress_percent, id: prog.id }
            : undefined,
          bestQuizScore: bestScores[m.id] ?? null,
          isBookmarked: bookmarkedIds.has(m.id),
        };
      });

      setModules(enriched);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = modules.filter((m) => {
    if (selectedDomain !== "all" && m.domain_id !== selectedDomain) return false;
    if (selectedLevel !== "all" && m.level !== selectedLevel) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase()) && !m.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusTab === "in_progress" && m.progress?.status !== "in_progress") return false;
    if (statusTab === "completed" && m.progress?.status !== "completed") return false;
    if (statusTab === "not_started" && m.progress) return false;
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "duration_asc": return a.duration_minutes - b.duration_minutes;
      case "duration_desc": return b.duration_minutes - a.duration_minutes;
      case "level": {
        const order = ["Pemula", "Muda", "Madya", "Utama"];
        return order.indexOf(a.level) - order.indexOf(b.level);
      }
      case "score": return (b.bestQuizScore ?? -1) - (a.bestQuizScore ?? -1);
      default: return 0;
    }
  });

  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.progress?.status === "completed").length;
  const inProgressModules = modules.filter(m => m.progress?.status === "in_progress").length;
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Domain progress chart data
  const domainChartData = useMemo(() => {
    return domains.map((d) => {
      const domainModules = modules.filter((m) => m.domain_id === d.id);
      const completed = domainModules.filter((m) => m.progress?.status === "completed").length;
      const total = domainModules.length;
      return {
        name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
        fullName: d.name,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        completed,
        total,
      };
    });
  }, [domains, modules]);

  const domainBarColors = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--pub-amber, 38 92% 50%))", "hsl(var(--pub-sky, 199 89% 48%))"];

  // Reminder: incomplete modules
  const incompleteModules = modules.filter(m => m.progress?.status === "in_progress");

  // Toggle bookmark
  const toggleBookmark = async (e: React.MouseEvent, mod: Module) => {
    e.stopPropagation();
    if (!user) return;

    if (mod.isBookmarked) {
      await supabase.from("module_bookmarks" as any).delete().eq("user_id", user.id).eq("module_id", mod.id);
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, isBookmarked: false } : m));
      toast.success("Bookmark dihapus");
    } else {
      await supabase.from("module_bookmarks" as any).insert({ user_id: user.id, module_id: mod.id } as any);
      setModules(prev => prev.map(m => m.id === mod.id ? { ...m, isBookmarked: true } : m));
      toast.success("Modul ditandai bookmark");
    }
  };

  const startModule = async (mod: Module) => {
    if (mod.progress?.status === "in_progress" || mod.progress?.status === "completed") {
      setActiveModule(mod);
      setQuiz(null);
      return;
    }

    const { error } = await supabase.from("module_progress").insert({
      user_id: user!.id,
      module_id: mod.id,
      status: "in_progress",
      progress_percent: 0,
      started_at: new Date().toISOString(),
    });

    if (error) {
      toast.error("Gagal memulai modul.");
      return;
    }

    const updated = modules.map((m) =>
      m.id === mod.id
        ? { ...m, progress: { status: "in_progress", progress_percent: 0 } }
        : m
    );
    setModules(updated);
    setActiveModule({ ...mod, progress: { status: "in_progress", progress_percent: 0 } });
    setQuiz(null);
    toast.success(`Memulai: ${mod.title}`);
  };

  const startQuiz = async (mod: Module) => {
    setQuizLoading(true);
    const { data, error } = await supabase
      .from("module_quiz_questions" as any)
      .select("*")
      .eq("module_id", mod.id)
      .order("sort_order");

    if (error || !data || data.length === 0) {
      toast.info("Belum ada kuis untuk modul ini.");
      setQuizLoading(false);
      return;
    }

    const questions: QuizQuestion[] = (data as any[]).map((q) => ({
      id: q.id,
      question_text: q.question_text,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options),
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      sort_order: q.sort_order,
    }));

    setQuiz({
      questions,
      currentIndex: 0,
      answers: {},
      showResult: false,
      score: 0,
      submitted: false,
    });
    setQuizLoading(false);
  };

  const selectAnswer = (optionIndex: number) => {
    if (!quiz || quiz.submitted) return;
    setQuiz(prev => prev ? {
      ...prev,
      answers: { ...prev.answers, [prev.currentIndex]: optionIndex }
    } : null);
  };

  const nextQuestion = () => {
    if (!quiz) return;
    if (quiz.currentIndex < quiz.questions.length - 1) {
      setQuiz(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
    }
  };

  const prevQuestion = () => {
    if (!quiz) return;
    if (quiz.currentIndex > 0) {
      setQuiz(prev => prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null);
    }
  };

  const submitQuiz = async () => {
    if (!quiz || !activeModule) return;

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (quiz.answers[i] === q.correct_answer) correct++;
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= 70;

    await supabase.from("module_quiz_results" as any).insert({
      user_id: user!.id,
      module_id: activeModule.id,
      score,
      total_questions: quiz.questions.length,
      correct_answers: correct,
      passed,
    } as any);

    if (passed && activeModule.progress?.id && activeModule.progress.status !== "completed") {
      await supabase
        .from("module_progress")
        .update({ status: "completed", progress_percent: 100, completed_at: new Date().toISOString() })
        .eq("id", activeModule.progress.id);

      const updated = modules.map((m) =>
        m.id === activeModule.id
          ? { ...m, progress: { ...m.progress!, status: "completed", progress_percent: 100 }, bestQuizScore: Math.max(score, m.bestQuizScore ?? 0) }
          : m
      );
      setModules(updated);
    } else {
      // Update best score in local state
      const updated = modules.map((m) =>
        m.id === activeModule.id
          ? { ...m, bestQuizScore: Math.max(score, m.bestQuizScore ?? 0) }
          : m
      );
      setModules(updated);
    }

    setQuiz(prev => prev ? { ...prev, submitted: true, showResult: true, score } : null);
    
    if (passed) {
      toast.success(`Selamat! Anda lulus kuis dengan skor ${score}%! 🎉`);
    } else {
      toast.error(`Skor ${score}%. Minimal 70% untuk lulus. Coba lagi!`);
    }
  };

  const completeModule = async (mod: Module) => {
    if (!mod.progress?.id) return;

    await supabase
      .from("module_progress")
      .update({ status: "completed", progress_percent: 100, completed_at: new Date().toISOString() })
      .eq("id", mod.progress.id);

    const updated = modules.map((m) =>
      m.id === mod.id
        ? { ...m, progress: { ...m.progress!, status: "completed", progress_percent: 100 } }
        : m
    );
    setModules(updated);
    setActiveModule(null);
    setQuiz(null);
    toast.success(`Modul "${mod.title}" selesai! 🎉`);
  };

  // ===== QUIZ VIEW =====
  if (activeModule && quiz) {
    const q = quiz.questions[quiz.currentIndex];
    const selectedAnswer = quiz.answers[quiz.currentIndex];
    const allAnswered = Object.keys(quiz.answers).length === quiz.questions.length;

    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setQuiz(null)}
          className="text-sm text-muted-foreground font-body hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          ← Kembali ke materi
        </button>

        {quiz.showResult ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <Card className="overflow-hidden">
              <div className={`p-8 text-center ${quiz.score >= 70 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                <Trophy className={`w-16 h-16 mx-auto mb-4 ${quiz.score >= 70 ? 'text-emerald-500' : 'text-destructive'}`} />
                <h2 className="text-2xl font-bold font-heading text-foreground">
                  {quiz.score >= 70 ? "Selamat, Anda Lulus! 🎉" : "Belum Lulus 😔"}
                </h2>
                <p className="text-4xl font-bold font-heading mt-2 text-foreground">{quiz.score}%</p>
                <p className="text-muted-foreground mt-1">
                  {quiz.questions.filter((_, i) => quiz.answers[i] === _.correct_answer).length} dari {quiz.questions.length} benar
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                {quiz.questions.map((question, i) => {
                  const userAnswer = quiz.answers[i];
                  const isCorrect = userAnswer === question.correct_answer;
                  return (
                    <div key={question.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" /> : <HelpCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />}
                        <div>
                          <p className="font-medium text-sm text-foreground">{question.question_text}</p>
                          {!isCorrect && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Jawaban Anda: <span className="text-destructive">{question.options[userAnswer]}</span> · 
                              Benar: <span className="text-emerald-600">{question.options[question.correct_answer]}</span>
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1 italic">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-3 pt-2">
                  {quiz.score < 70 && (
                    <Button onClick={() => startQuiz(activeModule)} variant="outline" className="gap-2">
                      <HelpCircle className="w-4 h-4" /> Coba Lagi
                    </Button>
                  )}
                  <Button onClick={() => { setQuiz(null); if (quiz.score >= 70) setActiveModule(null); }}>
                    {quiz.score >= 70 ? "Kembali ke Daftar" : "Review Materi"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-bold text-foreground">Kuis: {activeModule.title}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Soal {quiz.currentIndex + 1} dari {quiz.questions.length}</span>
              <Progress value={((quiz.currentIndex + 1) / quiz.questions.length) * 100} className="h-2 flex-1" />
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="font-heading font-semibold text-foreground text-lg">{q.question_text}</p>
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                        selectedAnswer === i
                          ? "border-primary bg-primary/10 text-foreground font-medium"
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold mr-3">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={prevQuestion} disabled={quiz.currentIndex === 0}>
                    Sebelumnya
                  </Button>
                  {quiz.currentIndex < quiz.questions.length - 1 ? (
                    <Button onClick={nextQuestion} disabled={selectedAnswer === undefined}>
                      Selanjutnya <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={submitQuiz} disabled={!allAnswered} className="gap-2">
                      <Trophy className="w-4 h-4" /> Submit Kuis
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuiz(prev => prev ? { ...prev, currentIndex: i } : null)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    i === quiz.currentIndex
                      ? "bg-primary text-primary-foreground"
                      : quiz.answers[i] !== undefined
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ===== MODULE DETAIL VIEW =====
  if (activeModule) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => { setActiveModule(null); setQuiz(null); }}
          className="text-sm text-muted-foreground font-body hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          ← Kembali ke daftar modul
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-card"
        >
          <div className="bg-hero p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-heading text-pub-amber-light uppercase tracking-wider">
                {activeModule.domain_name}
              </span>
              <Badge variant="outline" className={`text-[10px] border ${levelBadgeColors[activeModule.level] || ''}`}>
                {activeModule.level}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold font-heading text-primary-foreground mt-2">
              {activeModule.title}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-primary-foreground/60 text-sm font-body">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {activeModule.duration_minutes} menit
              </span>
              {activeModule.bestQuizScore !== null && activeModule.bestQuizScore !== undefined && (
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> Skor terbaik: {activeModule.bestQuizScore}%
                </span>
              )}
            </div>
          </div>

          <div className="p-8">
            <p className="text-muted-foreground font-body leading-relaxed mb-6">{activeModule.description}</p>

            {activeModule.content ? (
              <div className="bg-muted/30 rounded-xl p-6 mb-6 border border-border prose prose-sm max-w-none dark:prose-invert font-body">
                <h3 className="font-heading font-bold text-foreground mb-3">Konten Pembelajaran</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeModule.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-xl p-6 mb-6 border border-border">
                <h3 className="font-heading font-bold text-foreground mb-3">Konten Pembelajaran</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Materi untuk modul ini sedang dalam proses penyusunan oleh tim ahli.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => startQuiz(activeModule)}
                disabled={quizLoading}
                variant="outline"
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                {quizLoading ? "Memuat..." : "Mulai Kuis"}
              </Button>

              {activeModule.progress?.status !== "completed" && (
                <Button
                  onClick={() => completeModule(activeModule)}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Tandai Selesai
                </Button>
              )}

              {activeModule.progress?.status === "completed" && (
                <div className="flex items-center gap-2 text-emerald-500 font-heading font-semibold px-3">
                  <CheckCircle2 className="w-5 h-5" />
                  Modul telah diselesaikan
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== MODULE LIST VIEW =====
  const levels = ["Pemula", "Muda", "Madya", "Utama"];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with stats */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-pub-amber" />
          E-Course
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Modul pembelajaran terstruktur per level kompetensi dan domain keahlian.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari modul..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status tabs */}
      <Tabs value={statusTab} onValueChange={setStatusTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Semua ({totalModules})</TabsTrigger>
          <TabsTrigger value="not_started">Belum Mulai ({totalModules - inProgressModules - completedModules})</TabsTrigger>
          <TabsTrigger value="in_progress">Dipelajari ({inProgressModules})</TabsTrigger>
          <TabsTrigger value="completed">Selesai ({completedModules})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Progress summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-heading text-foreground">{totalModules}</p>
            <p className="text-xs text-muted-foreground">Total Modul</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-heading text-primary">{inProgressModules}</p>
            <p className="text-xs text-muted-foreground">Sedang Dipelajari</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-heading text-emerald-500">{completedModules}</p>
            <p className="text-xs text-muted-foreground">Selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-heading font-semibold text-foreground mb-1">Progress: {overallProgress}%</p>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Reminder: incomplete modules */}
      {!loading && incompleteModules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-pub-amber/30 bg-pub-amber/5 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-pub-amber shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-heading font-semibold text-foreground">
              {incompleteModules.length} modul belum selesai
            </p>
            <p className="text-xs text-muted-foreground">
              {incompleteModules.slice(0, 3).map(m => m.title).join(", ")}
              {incompleteModules.length > 3 ? ` dan ${incompleteModules.length - 3} lainnya` : ""}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setStatusTab("in_progress")} className="shrink-0 text-xs">
            Lanjutkan
          </Button>
        </motion.div>
      )}

      {/* Domain progress chart */}
      {!loading && domainChartData.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-heading font-semibold text-foreground mb-3">Progress per Domain</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={domainChartData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" width={100} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value: number, _: string, props: any) => [`${value}% (${props.payload.completed}/${props.payload.total})`, "Progress"]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {domainChartData.map((_, index) => (
                    <Cell key={index} fill={domainBarColors[index % domainBarColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Domain filter */}

      {/* Domain filter */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDomain("all")}
            className={`px-4 py-2 rounded-lg text-sm font-heading font-medium transition-colors ${
              selectedDomain === "all"
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua Domain
          </button>
          {domains.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDomain(d.id)}
              className={`px-4 py-2 rounded-lg text-sm font-heading font-medium transition-colors ${
                selectedDomain === d.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Level filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => setSelectedLevel("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors ${
              selectedLevel === "all"
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Semua Level
          </button>
          {levels.map((level) => {
            const Icon = levelIcons[level];
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors inline-flex items-center gap-1.5 ${
                  selectedLevel === level
                    ? `border ${levelBadgeColors[level]}`
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {level}
              </button>
            );
          })}
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          {[
            { value: "default", label: "Urutan Default" },
            { value: "duration_asc", label: "Durasi ↑" },
            { value: "duration_desc", label: "Durasi ↓" },
            { value: "level", label: "Level" },
            { value: "score", label: "Skor Kuis" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors ${
                sortBy === opt.value
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ModuleCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sorted.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
            {modules.length === 0 ? "Belum Ada Modul" : "Tidak Ada Modul Ditemukan"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {modules.length === 0
              ? "Modul pembelajaran sedang dipersiapkan oleh tim ahli. Silakan kembali lagi nanti."
              : "Coba ubah filter domain atau level untuk menemukan modul yang Anda cari."
            }
          </p>
          {modules.length > 0 && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSelectedDomain("all"); setSelectedLevel("all"); setSearchQuery(""); setStatusTab("all"); }}
            >
              Reset Filter
            </Button>
          )}
        </motion.div>
      )}

      {/* Module grid */}
      {!loading && sorted.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((mod, i) => {
            const Icon = levelIcons[mod.level] || Star;
            const color = levelColors[mod.level] || "text-muted-foreground";
            const DomainIcon = domainIcons[mod.domain_name] || BookOpen;
            const isCompleted = mod.progress?.status === "completed";
            const isInProgress = mod.progress?.status === "in_progress";

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all group cursor-pointer relative"
                onClick={() => startModule(mod)}
              >
                {/* Bookmark button */}
                <button
                  onClick={(e) => toggleBookmark(e, mod)}
                  className={`absolute top-3 right-3 p-1 rounded-md transition-colors ${
                    mod.isBookmarked
                      ? "text-pub-amber"
                      : "text-muted-foreground/40 hover:text-muted-foreground"
                  }`}
                  title={mod.isBookmarked ? "Hapus bookmark" : "Bookmark modul"}
                >
                  <Bookmark className={`w-4 h-4 ${mod.isBookmarked ? "fill-current" : ""}`} />
                </button>

                <div className="flex items-start justify-between mb-3 pr-6">
                  <Badge variant="outline" className={`text-[10px] border ${levelBadgeColors[mod.level] || ''}`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {mod.level}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {mod.bestQuizScore !== null && mod.bestQuizScore !== undefined && (
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${mod.bestQuizScore >= 70 ? 'border-emerald-500/30 text-emerald-500' : 'border-destructive/30 text-destructive'}`}>
                        <Trophy className="w-2.5 h-2.5 mr-0.5" />
                        {mod.bestQuizScore}% {mod.bestQuizScore >= 70 ? "Lulus" : ""}
                      </Badge>
                    )}
                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {isInProgress && <PlayCircle className="w-5 h-5 text-pub-amber" />}
                  </div>
                </div>

                <h3 className="font-heading font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{mod.description}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {mod.duration_minutes} menit
                  </span>
                  <span className="flex items-center gap-1">
                    <DomainIcon className="w-3 h-3" />
                    {mod.domain_name}
                  </span>
                </div>

                {isInProgress && (
                  <Progress value={mod.progress?.progress_percent || 0} className="h-1.5 mt-3" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Courses;
