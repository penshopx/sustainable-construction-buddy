import { useState } from "react";
import { Package, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketplaceProducts, type ProductInsert } from "@/hooks/useMarketplace";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const CATEGORIES = [
  { value: "software", label: "Software" },
  { value: "chatbot_ai", label: "Chatbot AI" },
  { value: "template", label: "Template" },
  { value: "sop", label: "SOP" },
  { value: "ebook", label: "E-Book" },
  { value: "toolkit", label: "Toolkit" },
  { value: "material", label: "Material" },
  { value: "jasa_perusahaan", label: "Jasa Perusahaan" },
  { value: "jasa_perorangan", label: "Jasa Perorangan" },
];

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const emptyForm: ProductInsert = { title: "", description: "", category: "software", price: 0, unit: "unit", image_url: "", location: "", status: "active", stock: 0 };

export default function MyProducts() {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useMarketplaceProducts(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInsert>(emptyForm);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: typeof products[0]) => { setEditId(p.id); setForm({ title: p.title, description: p.description, category: p.category, price: p.price, unit: p.unit, image_url: p.image_url, location: p.location, status: p.status, stock: p.stock }); setDialogOpen(true); };

  const handleSubmit = () => {
    if (editId) {
      updateProduct.mutate({ id: editId, ...form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createProduct.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Produk Saya</h1>
            <p className="text-sm text-muted-foreground">Kelola produk & jasa yang Anda tawarkan</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-1"><Plus className="w-4 h-4" /> Tambah Produk</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-heading font-semibold">Belum ada produk</p>
          <p className="text-sm">Tambahkan produk atau jasa Anda untuk mulai berjualan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="text-xs">{CATEGORIES.find((c) => c.value === p.category)?.label || p.category}</Badge>
                  <Badge variant={p.status === "active" ? "default" : "outline"}>{p.status === "active" ? "Aktif" : "Nonaktif"}</Badge>
                </div>
                <CardTitle className="text-base font-heading mt-2">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <p className="text-lg font-bold text-primary mt-2">{formatRupiah(p.price)} <span className="text-xs font-normal text-muted-foreground">/ {p.unit}</span></p>
                <p className="text-xs text-muted-foreground">Stok: {p.stock}</p>
              </CardContent>
              <CardFooter className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)} className="gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-1"><Trash2 className="w-3.5 h-3.5" /> Hapus</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
                      <AlertDialogDescription>Produk "{p.title}" akan dihapus permanen.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteProduct.mutate(p.id)}>Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label>Nama Produk/Jasa *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Harga (Rp)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Satuan</Label>
                <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              </div>
              <div>
                <Label>Stok</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label>URL Gambar</Label>
              <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Lokasi</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!form.title || isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editId ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
