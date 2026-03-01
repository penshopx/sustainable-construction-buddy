import { Store, Shield } from "lucide-react";

export default function AdminMarketplace() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <Store className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Kelola Marketplace</h1>
          <p className="text-sm text-muted-foreground">Moderasi produk & jasa di marketplace</p>
        </div>
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-heading font-semibold">Fitur kelola marketplace segera hadir</p>
      </div>
    </div>
  );
}
