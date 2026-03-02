import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Award, Upload, Loader2, Image, PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  level: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function GenerateCertDialog({ open, level, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File, type: "logo" | "signature") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (type === "logo") { setLogoPreview(url); setLogoFile(file); }
      else { setSignaturePreview(url); setSignatureFile(file); }
    };
    reader.readAsDataURL(file);
  };

  const uploadToStorage = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from("program-images")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("program-images").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      let companyLogoUrl = "";
      let signatureUrl = "";

      if (logoFile) {
        companyLogoUrl = await uploadToStorage(logoFile, `cert-logos/${Date.now()}-${logoFile.name}`);
      }
      if (signatureFile) {
        signatureUrl = await uploadToStorage(signatureFile, `cert-signatures/${Date.now()}-${signatureFile.name}`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("generate-certificate", {
        body: { level, company_logo_url: companyLogoUrl, signature_url: signatureUrl },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error) throw res.error;
      if (res.data?.error) {
        toast({ title: "Gagal", description: res.data.error, variant: "destructive" });
      } else {
        toast({ title: "Berhasil!", description: `Sertifikat level ${level} berhasil diterbitkan.` });
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Terbitkan Sertifikat — Level {level}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Image className="w-4 h-4" /> Logo Perusahaan (opsional)
            </Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => logoRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-16 object-contain" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Klik untuk upload logo</span>
                </>
              )}
            </div>
            <Input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "logo")} />
          </div>

          {/* Signature Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <PenTool className="w-4 h-4" /> Tanda Tangan Digital (opsional)
            </Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-accent/50 transition-colors"
              onClick={() => sigRef.current?.click()}
            >
              {signaturePreview ? (
                <img src={signaturePreview} alt="Signature" className="h-16 object-contain" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Klik untuk upload tanda tangan</span>
                </>
              )}
            </div>
            <Input ref={sigRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "signature")} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>Batal</Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membuat...</> : <><Award className="w-4 h-4 mr-2" /> Terbitkan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
