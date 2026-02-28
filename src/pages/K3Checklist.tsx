import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useK3Checklists, useK3ChecklistDetail } from "@/hooks/useK3Checklists";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { HardHat, Plus, Trash2, ArrowLeft, CheckCircle2, AlertTriangle, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

type View = { type: "list" } | { type: "create" } | { type: "detail"; id: string };

const K3Checklist = () => {
  const [searchParams] = useSearchParams();
  const projectParam = searchParams.get("project") || undefined;
  const [selectedProject, setSelectedProject] = useState<string | undefined>(projectParam);
  const [view, setView] = useState<View>({ type: "list" });

  const { projects } = useProjects();
  const { checklists, isLoading, createChecklist, deleteChecklist } = useK3Checklists(selectedProject);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">K3 Checklist</h1>
            <p className="text-sm text-muted-foreground font-body">Inspeksi keselamatan kerja proyek</p>
          </div>
        </div>
        {view.type === "list" && (
          <Button onClick={() => setView({ type: "create" })} className="bg-gradient-amber text-accent-foreground font-heading shadow-amber hover:brightness-110">
            <Plus className="w-4 h-4 mr-1" /> Buat Inspeksi
          </Button>
        )}
        {view.type !== "list" && (
          <Button variant="outline" onClick={() => setView({ type: "list" })}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
          </Button>
        )}
      </div>

      {view.type === "list" && (
        <>
          {/* Project filter */}
          <div className="max-w-xs">
            <Select value={selectedProject || "all"} onValueChange={(v) => setSelectedProject(v === "all" ? undefined : v)}>
              <SelectTrigger><SelectValue placeholder="Filter proyek" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Proyek</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : checklists.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground font-body">Belum ada inspeksi K3. Buat inspeksi baru untuk memulai.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {checklists.map((c: any) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="cursor-pointer hover:shadow-card-hover transition-shadow" onClick={() => setView({ type: "detail", id: c.id })}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-heading font-semibold text-foreground">{c.inspector_name || "Inspeksi"}</p>
                            <Badge variant={c.status === "completed" ? "default" : "secondary"} className="capitalize">{c.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-body">{c.location} · {new Date(c.inspection_date).toLocaleDateString("id-ID")}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold font-heading text-foreground">{c.score_percent || 0}%</p>
                            <p className="text-xs text-muted-foreground">{c.completed_items}/{c.total_items}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteChecklist.mutate(c.id); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={c.score_percent || 0} className="h-1.5 mt-3" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {view.type === "create" && (
        <CreateForm
          projectId={selectedProject}
          projects={projects}
          onSubmit={(data) => createChecklist.mutate(data, { onSuccess: () => setView({ type: "list" }) })}
          isSubmitting={createChecklist.isPending}
        />
      )}

      {view.type === "detail" && (
        <ChecklistDetail checklistId={view.id} />
      )}
    </div>
  );
};

function CreateForm({ projectId, projects, onSubmit, isSubmitting }: any) {
  const [form, setForm] = useState({ project_id: projectId || "", inspector_name: "", location: "" });

  return (
    <Card>
      <CardHeader><CardTitle className="font-heading">Buat Inspeksi K3 Baru</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="font-heading">Proyek</Label>
            <Select value={form.project_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Tanpa Proyek —</SelectItem>
                {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-heading">Nama Inspektor</Label>
            <Input value={form.inspector_name} onChange={(e) => setForm((f) => ({ ...f, inspector_name: e.target.value }))} placeholder="Nama penanggung jawab" />
          </div>
          <div className="space-y-2">
            <Label className="font-heading">Lokasi</Label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Lokasi inspeksi" />
          </div>
        </div>
        <Button
          onClick={() => onSubmit({ project_id: form.project_id || undefined, inspector_name: form.inspector_name, location: form.location })}
          disabled={isSubmitting || !form.inspector_name}
          className="bg-gradient-amber text-accent-foreground font-heading shadow-amber"
        >
          {isSubmitting ? "Membuat..." : "Buat Checklist (14 Item)"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ChecklistDetail({ checklistId }: { checklistId: string }) {
  const { items, isLoading, toggleItem, updateItemFinding } = useK3ChecklistDetail(checklistId);

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>;

  const grouped = items.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const total = items.length;
  const completed = items.filter((i: any) => i.is_compliant).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Score summary */}
      <Card className="border-pub-amber/30">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {percent >= 80 ? (
                <CheckCircle2 className="w-10 h-10 text-pub-emerald" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-pub-amber" />
              )}
              <div>
                <p className="text-3xl font-extrabold font-heading text-foreground">{percent}%</p>
                <p className="text-sm text-muted-foreground font-body">Kepatuhan K3 ({completed}/{total} item)</p>
              </div>
            </div>
            <Badge variant={percent >= 80 ? "default" : percent >= 50 ? "secondary" : "destructive"}>
              {percent >= 80 ? "Baik" : percent >= 50 ? "Perlu Perbaikan" : "Kritis"}
            </Badge>
          </div>
          <Progress value={percent} className="h-2 mt-3" />
        </CardContent>
      </Card>

      {/* Items by category */}
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(categoryItems as any[]).map((item: any) => (
              <div key={item.id} className={`p-3 rounded-lg border ${item.is_compliant ? "border-pub-emerald/30 bg-pub-emerald/5" : "border-border"} transition-colors`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.is_compliant}
                    onCheckedChange={(checked) => toggleItem.mutate({ itemId: item.id, is_compliant: !!checked })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-body ${item.is_compliant ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.item_text}
                    </p>
                    {!item.is_compliant && (
                      <div className="grid md:grid-cols-2 gap-2 mt-2">
                        <Textarea
                          placeholder="Temuan..."
                          value={item.finding}
                          onChange={(e) => updateItemFinding.mutate({ itemId: item.id, finding: e.target.value, corrective_action: item.corrective_action })}
                          className="text-xs h-16"
                        />
                        <Textarea
                          placeholder="Tindakan korektif..."
                          value={item.corrective_action}
                          onChange={(e) => updateItemFinding.mutate({ itemId: item.id, finding: item.finding, corrective_action: e.target.value })}
                          className="text-xs h-16"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default K3Checklist;
