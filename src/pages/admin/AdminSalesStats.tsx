import { BarChart3 } from "lucide-react";

export default function AdminSalesStats() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Statistik Penjualan</h1>
          <p className="text-sm text-muted-foreground">Analisis penjualan marketplace</p>
        </div>
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-heading font-semibold">Fitur statistik penjualan segera hadir</p>
      </div>
    </div>
  );
}
