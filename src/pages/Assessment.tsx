import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ClipboardCheck, ArrowRight, ArrowLeft, CheckCircle2, XCircle,
  Trophy, Star, Award, Crown, Gem, Loader2, RotateCcw, Timer, Target
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  difficulty: string;
  domain_name?: string;
}

interface AnswerResult {
  selected: number;
  is_correct: boolean;
  correct_answer: number;
  explanation: string;
}

const levelConfig: Record<string, { icon: any; color: string; minScore: number }> = {
  Pemula: { icon: Star, color: "text-pub-sky", minScore: 0 },
  Muda: { icon: Award, color: "text-pub-emerald", minScore: 60 },
  Madya: { icon: Crown, color: "text-pub-amber", minScore: 75 },
  Utama: { icon: Gem, color: "text-pub-violet", minScore: 85 },
};

function determineLevel(score: number): string {
  if (score >= 85) return "Utama";
  if (score >= 75) return "Madya";
  if (score >= 60) return "Muda";
  return "Pemula";
}

const Assessment = () => {
  const { user, refreshProfile } = useAuth();
  const [phase, setPhase] = useState<"intro" | "test" | "review" | "result">("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [answerResults, setAnswerResults] = useState<Record<string, AnswerResult>>({});
  const [preTestId, setPreTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; level: string; correct: number; total: number } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [pastTests, setPastTests] = useState<any[]>([]);
  const [checkingAnswer, setCheckingAnswer] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("pre_tests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .then(({ data }) => setPastTests(data || []));
  }, [user, result]);

  const startTest = async () => {
    setLoading(true);
    // Fetch questions via secure RPC (no correct_answer exposed)
    const [{ data: allQuestions }, { data: domains }] = await Promise.all([
      supabase.rpc("get_questions_safe"),
      supabase.from("competency_domains").select("id, name"),
    ]);

    if (!allQuestions || allQuestions.length === 0) {
      toast.error("Belum ada soal tersedia.");
      setLoading(false);
      return;
    }

    // Build domain name lookup
    const domainMap: Record<string, string> = {};
    (domains || []).forEach((d: any) => { domainMap[d.id] = d.name; });

    // Group by domain and pick questions
    const byDomain: Record<string, any[]> = {};
    (allQuestions as any[]).forEach((q: any) => {
      const domainName = domainMap[q.domain_id] || "Unknown";
      if (!byDomain[domainName]) byDomain[domainName] = [];
      byDomain[domainName].push({ ...q, domain_name: domainName });
    });

    const selected: Question[] = [];
    Object.values(byDomain).forEach((domainQs) => {
      // Shuffle and take up to 4
      const shuffled = domainQs.sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, 4));
    });

    // Create pre-test record
    const { data: preTest, error } = await supabase
      .from("pre_tests")
      .insert({ user_id: user!.id, total_questions: selected.length })
      .select()
      .single();

    if (error) {
      toast.error("Gagal memulai assessment.");
      setLoading(false);
      return;
    }

    setQuestions(selected);
    setPreTestId(preTest.id);
    setAnswers({});
    setAnswerResults({});
    setCurrentQ(0);
    setPhase("test");
    setShowExplanation(false);
    setLoading(false);
  };

  const selectAnswer = async (questionId: string, answerIdx: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIdx }));
    setCheckingAnswer(true);
    
    const { data } = await supabase.rpc("check_question_answer", {
      _question_id: questionId,
      _selected_answer: answerIdx,
    });
    
    if (data) {
      const result = data as any;
      setAnswerResults((prev) => ({
        ...prev,
        [questionId]: {
          selected: answerIdx,
          is_correct: result.is_correct,
          correct_answer: result.correct_answer,
          explanation: result.explanation,
        },
      }));
    }
    setCheckingAnswer(false);
    setShowExplanation(true);
  };

  const goNext = () => {
    setShowExplanation(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setPhase("review");
    }
  };

  const goPrev = () => {
    setShowExplanation(false);
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const submitTest = async () => {
    setLoading(true);

    // Submit assessment server-side via DB function
    const answersPayload = questions.map((q) => ({
      question_id: q.id,
      selected_answer: answers[q.id] ?? -1,
    }));

    const { data, error } = await supabase.rpc("submit_assessment", {
      _pre_test_id: preTestId!,
      _answers: answersPayload,
    });

    if (error) {
      toast.error("Gagal mengirim assessment.");
      setLoading(false);
      return;
    }

    const res = data as any;
    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
      return;
    }

    await refreshProfile();

    setResult({ score: res.score, level: res.level, correct: res.correct, total: res.total });
    setPhase("result");
    setLoading(false);
  };

  const q = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {/* INTRO */}
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-pub-amber/10 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-8 h-8 text-pub-amber" />
              </div>
              <h1 className="text-3xl font-bold font-heading text-foreground">Pre-test Assessment</h1>
              <p className="text-muted-foreground font-body mt-2 max-w-lg mx-auto">
                Uji kompetensi manajerial Anda di 6 domain keahlian BUJK. Hasil assessment menentukan level dan rekomendasi learning path.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Timer, label: "24 Soal", desc: "4 soal per domain" },
                { icon: Target, label: "Scoring Otomatis", desc: "Hasil langsung terlihat" },
                { icon: Trophy, label: "Level Determination", desc: "Pemula → Utama" },
              ].map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-card text-center">
                  <f.icon className="w-8 h-8 text-pub-amber mx-auto mb-2" />
                  <p className="font-bold font-heading text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground font-body">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={startTest}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-amber text-accent-foreground font-semibold font-heading shadow-amber hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Mulai Assessment <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {/* Past results */}
            {pastTests.length > 0 && (
              <div className="mt-10">
                <h3 className="text-lg font-bold font-heading text-foreground mb-4">Riwayat Assessment</h3>
                <div className="space-y-3">
                  {pastTests.slice(0, 5).map((t) => (
                    <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-card">
                      <div>
                        <p className="font-heading font-semibold text-foreground">Skor: {t.score}</p>
                        <p className="text-xs text-muted-foreground font-body">
                          {new Date(t.completed_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <span className="text-sm font-heading font-semibold text-pub-amber">{t.determined_level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TEST */}
        {phase === "test" && q && (
          <motion.div key="test" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-heading text-pub-amber font-semibold uppercase">{q.domain_name}</span>
                <span className="text-xs text-muted-foreground font-body">Soal {currentQ + 1}/{questions.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-heading mb-4 inline-block">
                {q.difficulty}
              </span>
              <h2 className="text-xl font-bold font-heading text-foreground mb-6">{q.question_text}</h2>

              <div className="space-y-3">
                {q.options.map((opt: string, idx: number) => {
                  const selected = answers[q.id] === idx;
                  const answered = answers[q.id] !== undefined;
                  const ar = answerResults[q.id];
                  const isCorrect = ar ? idx === ar.correct_answer : false;

                  let borderClass = "border-border hover:border-pub-amber/40";
                  if (answered && ar) {
                    if (selected && isCorrect) borderClass = "border-pub-emerald bg-pub-emerald/5";
                    else if (selected && !isCorrect) borderClass = "border-destructive bg-destructive/5";
                    else if (isCorrect) borderClass = "border-pub-emerald/30 bg-pub-emerald/5";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => !answered && selectAnswer(q.id, idx)}
                      disabled={answered || checkingAnswer}
                      className={`w-full text-left px-5 py-4 rounded-xl border ${borderClass} transition-all flex items-center gap-3 group`}
                    >
                      <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-heading font-bold text-foreground shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="font-body text-sm text-foreground flex-1">{opt}</span>
                      {answered && ar && selected && isCorrect && <CheckCircle2 className="w-5 h-5 text-pub-emerald shrink-0" />}
                      {answered && ar && selected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                      {answered && ar && !selected && isCorrect && <CheckCircle2 className="w-5 h-5 text-pub-emerald/50 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && answerResults[q.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <p className="text-sm font-heading font-semibold text-foreground mb-1">Penjelasan:</p>
                  <p className="text-sm text-muted-foreground font-body">{answerResults[q.id].explanation}</p>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goPrev}
                disabled={currentQ === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground font-heading font-medium hover:bg-muted transition-colors disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <button
                onClick={goNext}
                disabled={answers[q.id] === undefined}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-amber text-accent-foreground font-heading font-semibold shadow-amber hover:brightness-110 transition-all disabled:opacity-30"
              >
                {currentQ < questions.length - 1 ? "Selanjutnya" : "Review Jawaban"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* REVIEW */}
        {phase === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-2xl font-bold font-heading text-foreground mb-6">Review Jawaban</h2>
            <div className="grid grid-cols-6 md:grid-cols-8 gap-2 mb-8">
              {questions.map((q, i) => {
                const answered = answers[q.id] !== undefined;
                const isCorrect = answerResults[q.id]?.is_correct ?? false;
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentQ(i); setPhase("test"); }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-heading font-bold transition-colors ${
                      !answered ? "bg-muted text-muted-foreground" :
                      isCorrect ? "bg-pub-emerald/20 text-pub-emerald" : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setCurrentQ(0); setPhase("test"); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground font-heading font-medium hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke Soal
              </button>
              <button
                onClick={submitTest}
                disabled={loading || Object.keys(answers).length < questions.length}
                className="inline-flex items-center gap-2 px-8 py-2.5 rounded-lg bg-gradient-amber text-accent-foreground font-heading font-semibold shadow-amber hover:brightness-110 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Selesai & Lihat Hasil <Trophy className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* RESULT */}
        {phase === "result" && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-3xl bg-pub-amber/10 flex items-center justify-center mx-auto mb-6"
              >
                <Trophy className="w-12 h-12 text-pub-amber" />
              </motion.div>

              <h1 className="text-3xl font-bold font-heading text-foreground mb-2">Assessment Selesai!</h1>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground font-heading text-lg font-bold mb-6">
                Skor: {result.score}
              </div>

              <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-auto shadow-card mb-8">
                <p className="text-sm text-muted-foreground font-body mb-2">Level Kompetensi Anda:</p>
                <div className="flex items-center justify-center gap-3">
                  {(() => {
                    const rc = levelConfig[result.level];
                    const Icon = rc.icon;
                    return (
                      <>
                        <Icon className={`w-10 h-10 ${rc.color}`} />
                        <span className="text-3xl font-bold font-heading text-foreground">{result.level}</span>
                      </>
                    );
                  })()}
                </div>
                <p className="text-sm text-muted-foreground font-body mt-4">
                  {result.correct} dari {result.total} soal benar
                </p>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPhase("intro")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-foreground font-heading font-medium hover:bg-muted transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Ulang Assessment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Assessment;
