import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Calendar, MapPin, Plus, Trash2, Clock, Newspaper, Image as ImageIcon,
  CheckCircle2, PlayCircle, CalendarClock, FolderOpen, ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import {
  usePrograms, useProgramUpdates, useProgramGallery,
  useCreateProgram, useUpdateProgram, useDeleteProgram,
  useCreateProgramUpdate, useDeleteProgramUpdate,
  useCreateGalleryItem, useDeleteGalleryItem,
  type PubProgram,
} from "@/hooks/usePrograms";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  upcoming: { label: "Akan Datang", color: "bg-pub-amber/15 text-pub-amber", icon: CalendarClock },
  ongoing: { label: "Sedang Berjalan", color: "bg-pub-emerald/15 text-pub-emerald", icon: PlayCircle },
  completed: { label: "Selesai", color: "bg-muted text-muted-foreground", icon: CheckCircle2 },
};

function ProgramForm({ onClose }: { onClose: () => void }) {
  const create = useCreateProgram();
  const [form, setForm] = useState({ title: "", description: "", category: "program", status: "upcoming", location: "", start_date: "", end_date: "" });

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Judul wajib diisi");
    try {
      await create.mutateAsync({
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        progress_percent: 0,
        image_url: "",
      } as any);
      toast.success("Program berhasil ditambahkan");
      onClose();
    } catch { toast.error("Gagal menambahkan program"); }
  };

  return (
    <div className="space-y-4">
      <Input placeholder="Judul Program" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Textarea placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="program">Program</SelectItem>
            <SelectItem value="kegiatan">Kegiatan</SelectItem>
            <SelectItem value="pelatihan">Pelatihan</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Akan Datang</SelectItem>
            <SelectItem value="ongoing">Sedang Berjalan</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input placeholder="Lokasi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tanggal Mulai</label>
          <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tanggal Selesai</label>
          <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
      </div>
      <Button onClick={handleSubmit} disabled={create.isPending} className="w-full">
        {create.isPending ? "Menyimpan..." : "Tambah Program"}
      </Button>
    </div>
  );
}

function ProgramCard({ program, isAdmin }: { program: PubProgram; isAdmin: boolean }) {
  const update = useUpdateProgram();
  const del = useDeleteProgram();
  const config = statusConfig[program.status] || statusConfig.upcoming;
  const Icon = config.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">{program.title}</h3>
              <Badge variant="outline" className="text-[10px] mt-1 capitalize">{program.category}</Badge>
            </div>
          </div>
          <Badge className={`${config.color} text-xs shrink-0`}>{config.label}</Badge>
        </div>
        {program.description && <p className="text-xs text-muted-foreground line-clamp-2">{program.description}</p>}
        {program.status === "ongoing" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{program.progress_percent}%</span>
            </div>
            <Progress value={program.progress_percent} className="h-2" />
          </div>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {program.start_date && (
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(program.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
          )}
          {program.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {program.location}</span>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2 pt-2 border-t">
            {program.status === "ongoing" && (
              <Input
                type="number"
                min={0}
                max={100}
                className="w-20 h-8 text-xs"
                placeholder="%"
                defaultValue={program.progress_percent}
                onBlur={(e) => {
                  const val = Math.min(100, Math.max(0, Number(e.target.value)));
                  if (val !== program.progress_percent) {
                    update.mutate({ id: program.id, progress_percent: val });
                  }
                }}
              />
            )}
            <Select
              defaultValue={program.status}
              onValueChange={(v) => update.mutate({ id: program.id, status: v })}
            >
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Akan Datang</SelectItem>
                <SelectItem value="ongoing">Sedang Berjalan</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
              if (confirm("Hapus program ini?")) del.mutate(program.id);
            }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UpdateForm({ programs, onClose }: { programs: PubProgram[]; onClose: () => void }) {
  const create = useCreateProgramUpdate();
  const [form, setForm] = useState({ program_id: "", title: "", content: "" });

  return (
    <div className="space-y-4">
      <Select value={form.program_id} onValueChange={(v) => setForm({ ...form, program_id: v })}>
        <SelectTrigger><SelectValue placeholder="Pilih Program" /></SelectTrigger>
        <SelectContent>
          {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input placeholder="Judul Update" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Textarea placeholder="Isi update..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} />
      <Button className="w-full" disabled={!form.program_id || !form.title.trim() || create.isPending} onClick={async () => {
        try {
          await create.mutateAsync(form);
          toast.success("Update berhasil ditambahkan");
          onClose();
        } catch { toast.error("Gagal menambahkan update"); }
      }}>
        {create.isPending ? "Menyimpan..." : "Posting Update"}
      </Button>
    </div>
  );
}

function GalleryUploadForm({ programs, onClose }: { programs: PubProgram[]; onClose: () => void }) {
  const create = useCreateGalleryItem();
  const [form, setForm] = useState({ program_id: "", caption: "" });
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file || !form.program_id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${form.program_id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("program-images").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("program-images").getPublicUrl(path);
      await create.mutateAsync({ program_id: form.program_id, image_url: publicUrl, caption: form.caption });
      toast.success("Foto berhasil diupload");
      onClose();
    } catch { toast.error("Gagal upload foto"); }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <Select value={form.program_id} onValueChange={(v) => setForm({ ...form, program_id: v })}>
        <SelectTrigger><SelectValue placeholder="Pilih Program" /></SelectTrigger>
        <SelectContent>
          {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <Input placeholder="Caption (opsional)" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
      <Button className="w-full" disabled={!file || !form.program_id || uploading} onClick={handleUpload}>
        {uploading ? "Mengupload..." : "Upload Foto"}
      </Button>
    </div>
  );
}

export default function Programs() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { data: programs = [], isLoading: loadingPrograms } = usePrograms();
  const { data: updates = [], isLoading: loadingUpdates } = useProgramUpdates();
  const { data: gallery = [], isLoading: loadingGallery } = useProgramGallery();
  const delUpdate = useDeleteProgramUpdate();
  const delGallery = useDeleteGalleryItem();
  const [addProgramOpen, setAddProgramOpen] = useState(false);
  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [addGalleryOpen, setAddGalleryOpen] = useState(false);

  const ongoing = programs.filter((p) => p.status === "ongoing");
  const upcoming = programs.filter((p) => p.status === "upcoming");
  const completed = programs.filter((p) => p.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-heading">Program & Kegiatan PUB</h1>
            <p className="text-sm text-muted-foreground">Daftar program, jadwal, update berita, dan dokumentasi kegiatan</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-pub-amber">{programs.length}</p><p className="text-xs text-muted-foreground">Total Program</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-pub-emerald">{ongoing.length}</p><p className="text-xs text-muted-foreground">Sedang Berjalan</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-pub-sky">{upcoming.length}</p><p className="text-xs text-muted-foreground">Akan Datang</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{completed.length}</p><p className="text-xs text-muted-foreground">Selesai</p></CardContent></Card>
      </div>

      <Tabs defaultValue="programs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="programs" className="gap-1.5 text-xs"><FolderOpen className="w-3.5 h-3.5" /> Program</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5 text-xs"><Clock className="w-3.5 h-3.5" /> Timeline</TabsTrigger>
          <TabsTrigger value="updates" className="gap-1.5 text-xs"><Newspaper className="w-3.5 h-3.5" /> Update</TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1.5 text-xs"><ImageIcon className="w-3.5 h-3.5" /> Galeri</TabsTrigger>
        </TabsList>

        {/* Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          {isAdmin && (
            <Dialog open={addProgramOpen} onOpenChange={setAddProgramOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Tambah Program</Button>
              </DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Tambah Program Baru</DialogTitle></DialogHeader>
                <ProgramForm onClose={() => setAddProgramOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
          {loadingPrograms ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-48" />)}</div>
          ) : programs.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Belum ada program.</p></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((p) => <ProgramCard key={p.id} program={p} isAdmin={isAdmin} />)}
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          {loadingPrograms ? (
            <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : programs.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Belum ada jadwal.</p></Card>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />
              <div className="space-y-6">
                {programs
                  .filter((p) => p.start_date)
                  .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
                  .map((p) => {
                    const config = statusConfig[p.status] || statusConfig.upcoming;
                    const Icon = config.icon;
                    return (
                      <div key={p.id} className="relative flex gap-4 items-start">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{p.title}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(p.start_date!).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              {p.end_date && ` — ${new Date(p.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                            </span>
                            {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</span>}
                          </div>
                          {p.status === "ongoing" && <Progress value={p.progress_percent} className="h-1.5 mt-2 max-w-xs" />}
                        </div>
                        <Badge className={`${config.color} text-[10px] shrink-0`}>{config.label}</Badge>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          {isAdmin && (
            <Dialog open={addUpdateOpen} onOpenChange={setAddUpdateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Posting Update</Button>
              </DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Posting Update Baru</DialogTitle></DialogHeader>
                <UpdateForm programs={programs} onClose={() => setAddUpdateOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
          {loadingUpdates ? (
            <div className="space-y-4">{[1,2].map((i) => <Skeleton key={i} className="h-32" />)}</div>
          ) : updates.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Belum ada update.</p></Card>
          ) : (
            <div className="space-y-4">
              {updates.map((u) => (
                <Card key={u.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{u.title}</CardTitle>
                        {u.pub_programs && <p className="text-xs text-muted-foreground mt-0.5">Program: {u.pub_programs.title}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        {isAdmin && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                            onClick={() => { if (confirm("Hapus update?")) delUpdate.mutate(u.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{u.content}</p></CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          {isAdmin && (
            <Dialog open={addGalleryOpen} onOpenChange={setAddGalleryOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Upload Foto</Button>
              </DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>Upload Foto Kegiatan</DialogTitle></DialogHeader>
                <GalleryUploadForm programs={programs} onClose={() => setAddGalleryOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
          {loadingGallery ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="aspect-square" />)}</div>
          ) : gallery.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">Belum ada foto.</p></Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {gallery.map((g) => (
                <Card key={g.id} className="overflow-hidden group relative">
                  <img src={g.image_url} alt={g.caption} className="w-full aspect-square object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-xs">{g.caption || "Tanpa caption"}</p>
                    {g.pub_programs && <p className="text-white/70 text-[10px]">{g.pub_programs.title}</p>}
                    {isAdmin && (
                      <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-white hover:text-destructive"
                        onClick={() => { if (confirm("Hapus foto?")) delGallery.mutate(g.id); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
