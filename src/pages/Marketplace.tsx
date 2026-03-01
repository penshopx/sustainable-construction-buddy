import { Store, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Marketplace() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pub-amber/10 flex items-center justify-center">
          <Store className="w-5 h-5 text-pub-amber" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Temukan produk & jasa konstruksi terpercaya</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari produk atau jasa..." className="pl-9" />
        </div>
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-heading font-semibold">Marketplace segera hadir</p>
        <p className="text-sm">Fitur marketplace sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
