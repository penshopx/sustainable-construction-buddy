import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  logoUrl: string;
  signatureUrl: string;
}

const levelColor: Record<string, string> = {
  Pemula: "#10B981",
  Muda: "#3B82F6",
  Madya: "#8B5CF6",
  Utama: "#F59E0B",
};

export default function CertificatePreview({ logoUrl, signatureUrl }: Props) {
  const { profile } = useAuth();
  const level = profile?.current_level || "Pemula";
  const color = levelColor[level] || "#3B82F6";

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Eye className="w-5 h-5 text-accent" />
          Preview Sertifikat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full aspect-[1200/850] rounded-lg overflow-hidden shadow-lg"
          style={{ border: `3px solid ${color}` }}
        >
          {/* Inner border */}
          <div className="absolute inset-2 border rounded-md" style={{ borderColor: `${color}40` }} />

          <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-6 text-center">
            {/* Logo top-left */}
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="absolute top-4 left-4 h-8 md:h-10 object-contain"
              />
            )}

            {/* Header */}
            <p className="text-[10px] md:text-xs font-bold text-gray-700 tracking-wide mb-1">
              PUB ASPEKINDO — Konstruksi
            </p>

            {/* Title */}
            <h2
              className="text-lg md:text-2xl font-bold mb-0.5"
              style={{ color }}
            >
              SERTIFIKAT PERSONIL MANAJERIAL BUJK
            </h2>
            <p className="text-[10px] md:text-sm text-gray-500 mb-3">
              Level: {level}
            </p>

            {/* Awarded to */}
            <p className="text-[9px] md:text-xs text-gray-400 mb-1">Diberikan kepada:</p>
            <h3 className="text-base md:text-xl font-bold text-gray-900 mb-0.5">
              {profile?.full_name || "Nama Anda"}
            </h3>
            {(profile?.position || profile?.company) && (
              <p className="text-[10px] md:text-sm text-gray-500 mb-2">
                {[profile?.position, profile?.company].filter(Boolean).join(" — ")}
              </p>
            )}

            <p className="text-[9px] md:text-xs text-gray-500 max-w-[80%]">
              Telah menyelesaikan seluruh modul pembelajaran Personil Manajerial BUJK pada level {level}
            </p>

            {/* Decorative line */}
            <div className="w-1/3 h-px my-2" style={{ backgroundColor: color }} />

            <p className="text-[8px] md:text-[10px] text-gray-400">No. PUB-XXXXX-XXXXX</p>

            {/* Signature bottom-right */}
            {signatureUrl && (
              <div className="absolute bottom-4 right-4 flex flex-col items-end">
                <img src={signatureUrl} alt="Signature" className="h-6 md:h-10 object-contain" />
                <span className="text-[8px] text-gray-400">Tanda Tangan</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Preview berdasarkan profil Anda saat ini. Hasil download dalam resolusi tinggi (1200×850 px).
        </p>
      </CardContent>
    </Card>
  );
}
