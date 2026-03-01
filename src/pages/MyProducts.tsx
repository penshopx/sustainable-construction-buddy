import { Package } from "lucide-react";

export default function MyProducts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pub-violet/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-pub-violet" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Produk Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola produk & jasa yang Anda tawarkan</p>
        </div>
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-heading font-semibold">Belum ada produk</p>
        <p className="text-sm">Tambahkan produk atau jasa Anda di sini.</p>
      </div>
    </div>
  );
}
