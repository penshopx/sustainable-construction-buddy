import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Building2, Briefcase, Save, Loader2, Star, Award, Crown, Gem, ShieldCheck, type LucideIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleConflictAlert } from "@/components/RoleConflictAlert";
import { getConflictingPositions, getShortPosition, QUALIFICATION_OPTIONS, type BUJKQualification } from "@/lib/roleConstraints";

const JABATAN_OPTIONS = [
  "Penanggung Jawab Badan Usaha (PJBU) / Direktur",
  "Penanggung Jawab Teknik (PJT)",
  "Penanggung Jawab Subklasifikasi (PJSKBU)",
  "Manajer Keuangan",
  "Manajer Logistik & Rantai Pasok",
  "Manajer Pengadaan / Tender",
  "Manajer Administrasi",
  "Petugas K3",
] as const;

const levelConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  Pemula: { icon: Star, color: "text-pub-sky", bg: "bg-pub-sky/10" },
  Muda: { icon: Award, color: "text-pub-emerald", bg: "bg-pub-emerald/10" },
  Madya: { icon: Crown, color: "text-pub-amber", bg: "bg-pub-amber/10" },
  Utama: { icon: Gem, color: "text-pub-violet", bg: "bg-pub-violet/10" },
};

const Profile = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [company, setCompany] = useState(profile?.company || "");
  const [position, setPosition] = useState(profile?.position || "");
  const [bujkQualification, setBujkQualification] = useState<BUJKQualification>(
    QUALIFICATION_OPTIONS.some((option) => option.value === profile?.bujk_qualification)
      ? profile?.bujk_qualification as BUJKQualification
      : "menengah"
  );
  const [saving, setSaving] = useState(false);

  // Get conflicting positions for current selection
  const positionConflicts = position ? getConflictingPositions(position, bujkQualification) : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, company, position, bujk_qualification: bujkQualification })
      .eq("user_id", user!.id);

    if (error) {
      toast.error("Gagal menyimpan profil.");
    } else {
      await refreshProfile();
      toast.success("Profil berhasil disimpan!");
    }
    setSaving(false);
  };

  const level = profile?.current_level || "Pemula";
  const lc = levelConfig[level];
  const LevelIcon = lc.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-heading text-foreground flex items-center gap-3 mb-6">
          <User className="w-7 h-7 text-pub-amber" />
          Profil Saya
        </h1>

        {/* Level badge */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${lc.bg} flex items-center justify-center`}>
              <LevelIcon className={`w-8 h-8 ${lc.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">Level Kompetensi</p>
              <p className="text-2xl font-bold font-heading text-foreground">{level}</p>
              <p className="text-sm text-muted-foreground font-body">Skor: {profile?.total_score || 0}</p>
            </div>
          </div>
        </div>

        {/* Role conflict detection */}
        <div className="mb-6">
          <RoleConflictAlert qualification={bujkQualification} />
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 shadow-card space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground font-heading mb-1.5 flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" /> Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground font-heading mb-1.5 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" /> Perusahaan
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="cth: PT Karya Konstruksi Nusantara"
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground font-heading mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Kualifikasi BUJK
            </label>
            <Select value={bujkQualification} onValueChange={(v) => setBujkQualification(v as BUJKQualification)}>
              <SelectTrigger className="w-full h-11 font-body text-sm">
                <SelectValue placeholder="Pilih kualifikasi..." />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATION_OPTIONS.map((q) => (
                  <SelectItem key={q.value} value={q.value} className="font-body text-sm">
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground font-heading mb-1.5 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-muted-foreground" /> Jabatan Personil Manajerial
            </label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="w-full h-11 font-body text-sm">
                <SelectValue placeholder="Pilih jabatan Anda..." />
              </SelectTrigger>
              <SelectContent>
                {JABATAN_OPTIONS.map((jabatan) => (
                  <SelectItem key={jabatan} value={jabatan} className="font-body text-sm">
                    {jabatan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {positionConflicts.length > 0 && (
              <div className="mt-2 space-y-1">
                {positionConflicts.map((c, i) => (
                  <p key={i} className={`text-xs font-body ${c.severity === "error" ? "text-destructive" : "text-pub-amber"}`}>
                    ⚠ Tidak boleh dirangkap dengan {getShortPosition(c.position)}: {c.rule}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground font-body mb-4">Email: {user?.email}</p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-amber text-accent-foreground font-heading font-semibold shadow-amber hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Profil
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
