import { ShoppingBag } from "lucide-react";

export default function MyOrders() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pub-amber/10 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-pub-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Pesanan Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola pesanan marketplace Anda</p>
        </div>
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-heading font-semibold">Belum ada pesanan</p>
        <p className="text-sm">Pesanan Anda akan muncul di sini.</p>
      </div>
    </div>
  );
}
