import { useState, useMemo } from "react";
import { Building2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBujkDirectory } from "@/hooks/useBujkDirectory";
import BujkCard from "@/components/directory/BujkCard";
import RegisterBujkDialog from "@/components/directory/RegisterBujkDialog";
import { Loader2 } from "lucide-react";

export default function CompanyDirectory() {
  const { directoryQuery } = useBujkDirectory();
  const [search, setSearch] = useState("");
  const [qualFilter, setQualFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");

  const entries = directoryQuery.data || [];

  const provinces = useMemo(() => {
    const set = new Set(entries.map(e => e.province).filter(Boolean));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        e.company_name.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.sub_classification.toLowerCase().includes(q) ||
        e.sbu_number.toLowerCase().includes(q);
      const matchQual = qualFilter === "all" || e.qualification === qualFilter;
      const matchProv = provinceFilter === "all" || e.province === provinceFilter;
      return matchSearch && matchQual && matchProv;
    });
  }, [entries, search, qualFilter, provinceFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Direktori Perusahaan</h1>
            <p className="text-sm text-muted-foreground">Cari dan temukan BUJK terdaftar</p>
          </div>
        </div>
        <RegisterBujkDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari perusahaan, kota, sub klasifikasi..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={qualFilter} onValueChange={setQualFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue placeholder="Kualifikasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kualifikasi</SelectItem>
            <SelectItem value="kecil">Kecil</SelectItem>
            <SelectItem value="menengah">Menengah</SelectItem>
            <SelectItem value="besar">Besar</SelectItem>
          </SelectContent>
        </Select>
        {provinces.length > 0 && (
          <Select value={provinceFilter} onValueChange={setProvinceFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Provinsi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Provinsi</SelectItem>
              {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {directoryQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-heading font-semibold">
            {entries.length === 0 ? "Belum ada perusahaan terdaftar" : "Tidak ada hasil yang cocok"}
          </p>
          <p className="text-sm mb-6">
            {entries.length === 0
              ? "Jadilah yang pertama mendaftarkan perusahaan Anda."
              : "Coba ubah kata kunci atau filter pencarian."}
          </p>
          {entries.length === 0 && (
            <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
              {[
                { name: "PT Graha Konstruksi Mandiri", qual: "Menengah", city: "Jakarta Selatan", sbu: "BG004" },
                { name: "CV Bangun Jaya Teknik", qual: "Kecil", city: "Surabaya", sbu: "SB021" },
              ].map((ex, i) => (
                <div key={i} className="p-3 rounded-lg border border-dashed border-border bg-muted/30">
                  <p className="text-xs font-heading font-semibold text-foreground">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Kualifikasi {ex.qual} · {ex.city}</p>
                  <p className="text-[10px] text-muted-foreground">SBU: {ex.sbu}</p>
                </div>
              ))}
              <p className="text-xs text-muted-foreground col-span-full text-center mt-2">
                👆 Contoh tampilan profil perusahaan yang terdaftar
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(entry => <BujkCard key={entry.id} entry={entry} />)}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Menampilkan {filtered.length} dari {entries.length} perusahaan
        </p>
      )}
    </div>
  );
}
