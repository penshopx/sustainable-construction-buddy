import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CompanyDirectory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pub-sky/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-pub-sky" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Direktori Perusahaan</h1>
          <p className="text-sm text-muted-foreground">Cari dan temukan BUJK terdaftar</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Cari perusahaan..." className="pl-9" />
      </div>

      <div className="text-center py-16 text-muted-foreground">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-heading font-semibold">Direktori segera hadir</p>
        <p className="text-sm">Fitur direktori perusahaan sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
