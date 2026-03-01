import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  GraduationCap, Clock, CheckCircle2, PlayCircle, Lock,
  Star, Award, Crown, Gem, BookOpen, ArrowRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const levelIcons: Record<string, any> = { Pemula: Star, Muda: Award, Madya: Crown, Utama: Gem };
const levelColors: Record<string, string> = {
  Pemula: "text-pub-sky",
  Muda: "text-pub-emerald",
  Madya: "text-pub-amber",
  Utama: "text-pub-violet",
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
}

interface Domain {
  id: string;
  name: string;
}

const Courses = () => {
  const { user, profile } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<Module | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: domainsData }, { data: modulesData }, { data: progressData }] = await Promise.all([
        supabase.from("competency_domains").select("*").order("sort_order"),
        supabase.from("e_course_modules").select("*, competency_domains!inner(name)").order("sort_order"),
        supabase.from("module_progress").select("*").eq("user_id", user.id),
      ]);

      setDomains(domainsData || []);

      const enriched: Module[] = (modulesData || []).map((m: any) => {
        const prog = (progressData || []).find((p: any) => p.module_id === m.id);
        return {
          ...m,
          domain_name: m.competency_domains?.name || "",
          progress: prog
            ? { status: prog.status, progress_percent: prog.progress_percent, id: prog.id }
            : undefined,
        };
      });

      setModules(enriched);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = selectedDomain === "all"
    ? modules
    : modules.filter((m) => m.domain_id === selectedDomain);

  const startModule = async (mod: Module) => {
    if (mod.progress?.status === "in_progress" || mod.progress?.status === "completed") {
      setActiveModule(mod);
      return;
    }

    // Create progress record
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
    toast.success(`Memulai: ${mod.title}`);
  };

  const completeModule = async (mod: Module) => {
    if (!mod.progress?.id) return;

    await supabase
      .from("module_progress")
      .update({
        status: "completed",
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", mod.progress.id);

    const updated = modules.map((m) =>
      m.id === mod.id
        ? { ...m, progress: { ...m.progress!, status: "completed", progress_percent: 100 } }
        : m
    );
    setModules(updated);
    setActiveModule(null);
    toast.success(`Modul "${mod.title}" selesai! 🎉`);
  };

  if (activeModule) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setActiveModule(null)}
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
            <span className="text-xs font-heading text-pub-amber-light uppercase tracking-wider">
              {activeModule.domain_name}
            </span>
            <h1 className="text-2xl font-bold font-heading text-primary-foreground mt-2">
              {activeModule.title}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-primary-foreground/60 text-sm font-body">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {activeModule.duration_minutes} menit
              </span>
              <span className="flex items-center gap-1">
                {(() => {
                  const Icon = levelIcons[activeModule.level];
                  return <Icon className="w-4 h-4" />;
                })()}
                {activeModule.level}
              </span>
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
                  Materi untuk modul ini sedang dalam proses penyusunan oleh tim ahli. Anda tetap dapat menandai modul sebagai selesai untuk melacak progress Anda.
                </p>
              </div>
            )}

            {activeModule.progress?.status !== "completed" && (
              <button
                onClick={() => completeModule(activeModule)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-amber text-accent-foreground font-heading font-semibold shadow-amber hover:brightness-110 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Tandai Selesai
              </button>
            )}

            {activeModule.progress?.status === "completed" && (
              <div className="flex items-center gap-2 text-pub-emerald font-heading font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Modul telah diselesaikan
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-pub-amber" />
          E-Course
        </h1>
        <p className="text-muted-foreground font-body mt-1">
          Modul pembelajaran terstruktur per level kompetensi dan domain keahlian.
        </p>
      </div>

      {/* Domain filter */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      {/* Module grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((mod, i) => {
          const Icon = levelIcons[mod.level] || Star;
          const color = levelColors[mod.level] || "text-muted-foreground";
          const isCompleted = mod.progress?.status === "completed";
          const isInProgress = mod.progress?.status === "in_progress";

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all group cursor-pointer"
              onClick={() => startModule(mod)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-heading font-semibold ${color} uppercase`}>{mod.level}</span>
                {isCompleted && <CheckCircle2 className="w-5 h-5 text-pub-emerald" />}
                {isInProgress && <PlayCircle className="w-5 h-5 text-pub-amber" />}
              </div>

              <h3 className="font-heading font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                {mod.title}
              </h3>
              <p className="text-xs text-muted-foreground font-body mb-3 line-clamp-2">{mod.description}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {mod.duration_minutes} menit
                </span>
                <span>{mod.domain_name}</span>
              </div>

              {isInProgress && (
                <Progress value={mod.progress?.progress_percent || 0} className="h-1.5 mt-3" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Courses;
