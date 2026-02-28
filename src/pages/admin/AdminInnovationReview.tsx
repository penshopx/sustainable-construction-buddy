import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, Send } from "lucide-react";
import { useAdminInnovationProposals, useUpdateProposalStatus } from "@/hooks/useInnovations";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-pub-amber/15 text-pub-amber",
  reviewed: "bg-pub-sky/15 text-pub-sky",
  approved: "bg-pub-emerald/15 text-pub-emerald",
  rejected: "bg-destructive/15 text-destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Diajukan",
  reviewed: "Direview",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export default function AdminInnovationReview() {
  const { data: proposals = [], isLoading } = useAdminInnovationProposals();
  const updateStatus = useUpdateProposalStatus();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approved" | "rejected" | "reviewed" | null>(null);

  const selected = proposals.find((p) => p.id === selectedId);

  const openReview = (id: string, currentAction: "approved" | "rejected" | "reviewed") => {
    const p = proposals.find((x) => x.id === id);
    setSelectedId(id);
    setAction(currentAction);
    setNotes(p?.admin_notes || "");
  };

  const handleSubmit = async () => {
    if (!selectedId || !action) return;
    try {
      await updateStatus.mutateAsync({ id: selectedId, status: action, admin_notes: notes });
      toast.success(`Proposal ${statusLabels[action].toLowerCase()}`);
      setSelectedId(null);
      setAction(null);
      setNotes("");
    } catch {
      toast.error("Gagal mengubah status proposal");
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="animate-pulse h-24" />)}</div>;
  }

  if (proposals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Belum ada proposal inovasi yang diajukan.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {proposals.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  <Badge className={statusColors[p.status] || ""}>{statusLabels[p.status] || p.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                {p.innovation_categories && (
                  <p className="text-xs text-muted-foreground mt-1">Kategori: {p.innovation_categories.name}</p>
                )}
                {p.scope && <p className="text-xs text-muted-foreground">Lingkup: {p.scope}</p>}
                {p.expected_impact && <p className="text-xs text-muted-foreground">Dampak: {p.expected_impact}</p>}
                {p.admin_notes && (
                  <p className="text-xs mt-2 p-2 rounded bg-muted">Catatan: {p.admin_notes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openReview(p.id, "reviewed")}>
                  <Eye className="w-3.5 h-3.5" /> Review
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-pub-emerald hover:text-pub-emerald" onClick={() => openReview(p.id, "approved")}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => openReview(p.id, "rejected")}>
                  <XCircle className="w-3.5 h-3.5" /> Tolak
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setAction(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {action === "approved" ? "Setujui Proposal" : action === "rejected" ? "Tolak Proposal" : "Review Proposal"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{selected.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                {selected.scope && <p className="text-sm text-muted-foreground mt-1">Lingkup: {selected.scope}</p>}
                {selected.expected_impact && <p className="text-sm text-muted-foreground mt-1">Dampak: {selected.expected_impact}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Catatan Admin</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk user..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedId(null)}>Batal</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateStatus.isPending}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {updateStatus.isPending ? "Menyimpan..." : action === "approved" ? "Setujui" : action === "rejected" ? "Tolak" : "Simpan Review"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
