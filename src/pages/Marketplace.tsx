import { useState } from "react";
import { Store, Search, Plus, MapPin, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMarketplaceProducts, useMarketplaceOrders } from "@/hooks/useMarketplace";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "all", label: "Semua Kategori" },
  { value: "jasa", label: "Jasa Konstruksi" },
  { value: "material", label: "Material" },
  { value: "alat", label: "Alat Berat" },
  { value: "konsultasi", label: "Konsultasi" },
  { value: "pelatihan", label: "Pelatihan" },
];

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function Marketplace() {
  const { user, profile } = useAuth();
  const { products, isLoading } = useMarketplaceProducts();
  const { createOrder } = useMarketplaceOrders("buyer");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [orderDialog, setOrderDialog] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({ quantity: 1, buyer_name: "", buyer_phone: "", buyer_address: "", notes: "" });

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || p.category === category;
    return matchSearch && matchCat;
  });

  const handleOrder = (product: typeof products[0]) => {
    createOrder.mutate(
      {
        product_id: product.id,
        seller_id: product.user_id,
        quantity: orderForm.quantity,
        total_price: product.price * orderForm.quantity,
        buyer_name: orderForm.buyer_name || profile?.full_name || "",
        buyer_phone: orderForm.buyer_phone,
        buyer_address: orderForm.buyer_address,
        notes: orderForm.notes,
      },
      {
        onSuccess: () => {
          setOrderDialog(null);
          setOrderForm({ quantity: 1, buyer_name: "", buyer_phone: "", buyer_address: "", notes: "" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Marketplace</h1>
            <p className="text-sm text-muted-foreground">Temukan produk & jasa konstruksi terpercaya</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari produk atau jasa..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-heading font-semibold">Belum ada produk</p>
          <p className="text-sm">Jadilah yang pertama menawarkan produk/jasa Anda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="text-xs">{CATEGORIES.find((c) => c.value === product.category)?.label || product.category}</Badge>
                  {product.stock > 0 && <Badge variant="outline" className="text-xs">Stok: {product.stock}</Badge>}
                </div>
                <CardTitle className="text-base font-heading mt-2 line-clamp-2">{product.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                {product.location && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {product.location}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-lg font-bold text-primary">{formatRupiah(product.price)}</p>
                  <p className="text-xs text-muted-foreground">per {product.unit}</p>
                </div>
                {product.user_id !== user?.id && (
                  <Dialog open={orderDialog === product.id} onOpenChange={(open) => setOrderDialog(open ? product.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <ShoppingCart className="w-3.5 h-3.5" /> Pesan
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Pesan: {product.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Jumlah</Label>
                            <Input type="number" min={1} value={orderForm.quantity} onChange={(e) => setOrderForm((f) => ({ ...f, quantity: Number(e.target.value) || 1 }))} />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <p className="text-lg font-bold text-primary mt-1">{formatRupiah(product.price * orderForm.quantity)}</p>
                          </div>
                        </div>
                        <div>
                          <Label>Nama Pemesan</Label>
                          <Input value={orderForm.buyer_name || profile?.full_name || ""} onChange={(e) => setOrderForm((f) => ({ ...f, buyer_name: e.target.value }))} />
                        </div>
                        <div>
                          <Label>No. Telepon</Label>
                          <Input value={orderForm.buyer_phone} onChange={(e) => setOrderForm((f) => ({ ...f, buyer_phone: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Alamat Pengiriman</Label>
                          <Textarea value={orderForm.buyer_address} onChange={(e) => setOrderForm((f) => ({ ...f, buyer_address: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Catatan (opsional)</Label>
                          <Textarea value={orderForm.notes} onChange={(e) => setOrderForm((f) => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <Button className="w-full" onClick={() => handleOrder(product)} disabled={createOrder.isPending}>
                          {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Konfirmasi Pesanan
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
