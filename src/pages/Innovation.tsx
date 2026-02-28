import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Timer, Database, Box, Cpu, Recycle, ShieldCheck, Lightbulb, ChevronRight, Send, ArrowLeft, CheckCircle2, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInnovationCategories, useInnovationProposals, useCreateProposal, useDeleteProposal, type InnovationCategory } from "@/hooks/useInnovations";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Leaf, Timer, Database, Box, Cpu, Recycle, ShieldCheck, Lightbulb,
};

const stageLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Tahap 1: Legal & Kapasitas", color: "bg-pub-sky/15 text-pub-sky" },
  2: { label: "Tahap 2: Efisiensi & Digitalisasi", color: "bg-pub-amber/15 text-pub-amber" },
  3: { label: "Tahap 3: Keberlanjutan & Green", color: "bg-pub-emerald/15 text-pub-emerald" },
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-pub-amber/15 text-pub-amber",
  reviewed: "bg-pub-sky/15 text-pub-sky",
  approved: "bg-pub-emerald/15 text-pub-emerald",
  rejected: "bg-destructive/15 text-destructive",
};

function CategoryDetail({ category, onBack }: { category: InnovationCategory; onBack: () => void }) {
  const Icon = iconMap[category.icon] || Lightbulb;
  const stage = stageLabels[category.stage];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <Button variant="ghost" onClick={onBack} className="mb-4 gap-2">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-accent/15 flex items-center justify-center">
          <Icon className="w-7 h-7 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-heading">{category.name}</h2>
          <Badge className={stage.color}>{stage.label}</Badge>
        </div>
      </div>

      <p className="text-muted-foreground mb-8 text-lg">{category.description}</p>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-pub-amber" /> Konsep & Ruang Inovasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {category.concepts.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-pub-amber shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-pub-sky" /> Program PUB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {category.programs.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-pub-emerald shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-pub-emerald" /> Manfaat & Dampak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {category.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-pub-violet shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function ProposalForm({ categories, onClose }: { categories: InnovationCategory[]; onClose: () => void }) {
  const createProposal = useCreateProposal();
  const [form, setForm] = useState({ category_id: "", title: "", description: "", scope: "", expected_impact: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id || !form.title) {
      toast.error("Judul dan kategori wajib diisi");
      return;
    }
    try {
      await createProposal.mutateAsync(form);
      toast.success("Proposal inovasi berhasil disimpan");
      onClose();
    } catch {
      toast.error("Gagal menyimpan proposal");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Kategori Inovasi</Label>
        <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
          <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Judul Proposal</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul inovasi Anda" maxLength={200} />
      </div>
      <div>
        <Label>Deskripsi</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Jelaskan inovasi yang diusulkan..." rows={3} maxLength={2000} />
      </div>
      <div>
        <Label>Lingkup Penerapan</Label>
        <Input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="Nasional / Daerah / Perusahaan" maxLength={200} />
      </div>
      <div>
        <Label>Dampak yang Diharapkan</Label>
        <Textarea value={form.expected_impact} onChange={(e) => setForm({ ...form, expected_impact: e.target.value })} placeholder="Dampak positif yang diharapkan..." rows={2} maxLength={1000} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={createProposal.isPending} className="gap-2">
          <Send className="w-4 h-4" /> {createProposal.isPending ? "Menyimpan..." : "Kirim Proposal"}
        </Button>
      </div>
    </form>
  );
}

export default function Innovation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories = [], isLoading } = useInnovationCategories();
  const { data: proposals = [] } = useInnovationProposals();
  const deleteProposal = useDeleteProposal();
  const [selectedCategory, setSelectedCategory] = useState<InnovationCategory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const roadmapStages = [
    { stage: 1, title: "Penguatan Legal & Kapasitas", items: ["SBU", "SKK", "K3", "Manajemen Proyek"] },
    { stage: 2, title: "Efisiensi & Digitalisasi", items: ["Lean", "ERP", "BIM"] },
    { stage: 3, title: "Keberlanjutan & Green", items: ["Green Construction", "Circular Economy", "ESG"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-pub-navy via-pub-navy to-pub-navy-light py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-primary-foreground/70 hover:text-primary-foreground gap-1">
              <ArrowLeft className="w-4 h-4" /> Beranda
            </Button>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-extrabold font-heading text-primary-foreground mb-4">
            Inovasi PUB <span className="text-gradient-hero">Konstruksi</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-primary-foreground/70 text-lg max-w-2xl mb-6">
            Modernisasi & Keberlanjutan — dari Green Construction hingga ESG-Based Governance untuk transformasi industri konstruksi Indonesia.
          </motion.p>

          {/* Roadmap mini */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-4 mt-8">
            {roadmapStages.map((s) => (
              <div key={s.stage} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10">
                <div className="w-8 h-8 rounded-full bg-pub-amber/20 flex items-center justify-center text-pub-amber font-bold text-sm">{s.stage}</div>
                <div>
                  <p className="text-primary-foreground text-sm font-semibold">{s.title}</p>
                  <p className="text-primary-foreground/50 text-xs">{s.items.join(" · ")}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto max-w-6xl px-6 py-12">
        <Tabs defaultValue="katalog">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <TabsList>
              <TabsTrigger value="katalog">Katalog Inovasi</TabsTrigger>
              {user && <TabsTrigger value="proposals">Proposal Saya</TabsTrigger>}
            </TabsList>
            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Send className="w-4 h-4" /> Ajukan Proposal</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Ajukan Proposal Inovasi</DialogTitle>
                  </DialogHeader>
                  <ProposalForm categories={categories} onClose={() => setDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <TabsContent value="katalog">
            {selectedCategory ? (
              <CategoryDetail category={selectedCategory} onBack={() => setSelectedCategory(null)} />
            ) : isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse h-48" />
                ))}
              </div>
            ) : (
              <div className="space-y-12">
                {[1, 2, 3].map((stageNum) => {
                  const stageCats = categories.filter((c) => c.stage === stageNum);
                  if (stageCats.length === 0) return null;
                  const stage = stageLabels[stageNum];
                  return (
                    <motion.section key={stageNum} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-pub-amber/20 flex items-center justify-center text-pub-amber font-bold text-sm">{stageNum}</div>
                        <div>
                          <h3 className="text-lg font-bold font-heading">{stage.label}</h3>
                          <p className="text-xs text-muted-foreground">{stageCats.length} kategori inovasi</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stageCats.map((cat, i) => {
                          const Icon = iconMap[cat.icon] || Lightbulb;
                          return (
                            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                              <Card
                                className="cursor-pointer hover:shadow-card-hover transition-all duration-200 group h-full"
                                onClick={() => setSelectedCategory(cat)}
                              >
                                <CardHeader>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
                                      <Icon className="w-5 h-5 text-accent" />
                                    </div>
                                    <Badge variant="outline" className={stage.color + " text-xs"}>
                                      Tahap {cat.stage}
                                    </Badge>
                                  </div>
                                  <CardTitle className="text-base">{cat.name}</CardTitle>
                                  <CardDescription className="line-clamp-2">{cat.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                                    <span>{cat.concepts.length} konsep</span>
                                    <span>·</span>
                                    <span>{cat.programs.length} program</span>
                                    <ChevronRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.section>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="proposals">
            {!user ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Silakan login untuk melihat proposal Anda.</p>
                <Button className="mt-4" onClick={() => navigate("/auth")}>Login</Button>
              </Card>
            ) : proposals.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Belum ada proposal inovasi.</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Send className="w-4 h-4" /> Ajukan Proposal Pertama
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {proposals.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="flex items-start justify-between gap-4 pt-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{p.title}</h3>
                          <Badge className={statusColors[p.status] || ""}>{p.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                        {p.innovation_categories && (
                          <p className="text-xs text-muted-foreground mt-1">Kategori: {p.innovation_categories.name}</p>
                        )}
                        {p.admin_notes && (
                          <p className="text-xs mt-2 p-2 rounded bg-muted">Catatan admin: {p.admin_notes}</p>
                        )}
                      </div>
                      {p.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            deleteProposal.mutate(p.id, {
                              onSuccess: () => toast.success("Proposal dihapus"),
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
