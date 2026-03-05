import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: string;
  title: string;
  description: string;
  domain_id: string;
  level: string;
  duration_minutes: number;
  sort_order: number;
  content: string;
}

interface Domain { id: string; name: string; }

export default function AdminModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const { toast } = useToast();

  const emptyForm = { title: "", description: "", domain_id: "", level: "Pemula", duration_minutes: 30, sort_order: 0, content: "" };
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    const [mRes, dRes] = await Promise.all([
      supabase.from("e_course_modules").select("*").order("sort_order"),
      supabase.from("competency_domains").select("id, name").order("sort_order"),
    ]);
    if (mRes.data) setModules(mRes.data);
    if (dRes.data) setDomains(dRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Module) => {
    setEditing(m);
    setForm({ title: m.title, description: m.description, domain_id: m.domain_id, level: m.level, duration_minutes: m.duration_minutes, sort_order: m.sort_order, content: m.content });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.domain_id) { toast({ title: "Lengkapi data", variant: "destructive" }); return; }
    const payload = { ...form };

    if (editing) {
      const { error } = await supabase.from("e_course_modules").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Gagal update", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("e_course_modules").insert(payload);
      if (error) { toast({ title: "Gagal tambah", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: editing ? "Modul diupdate" : "Modul ditambahkan" });
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("e_course_modules").delete().eq("id", id);
    if (error) { toast({ title: "Gagal hapus", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Modul dihapus" });
    fetchData();
  };

  const domainName = (id: string) => domains.find(d => d.id === id)?.name || "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-accent" /> Kelola Modul E-Course Personel Manajerial BUJK
          </h2>
          <p className="text-sm text-muted-foreground">{modules.length} modul tersedia</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Tambah Modul</Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : modules.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada modul</TableCell></TableRow>
            ) : (
              modules.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell><Badge variant="secondary">{domainName(m.domain_id)}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{m.level}</Badge></TableCell>
                  <TableCell>{m.duration_minutes} menit</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Modul" : "Tambah Modul Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Judul</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Domain</Label>
                <Select value={form.domain_id} onValueChange={v => setForm({ ...form, domain_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih domain" /></SelectTrigger>
                  <SelectContent>{domains.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Pemula", "Muda", "Madya", "Utama"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Durasi (menit)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Urutan</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Konten (Markdown)</Label>
              <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
