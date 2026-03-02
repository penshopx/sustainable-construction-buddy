import type { Certificate } from "@/components/certificates/CertificateHistoryTable";

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export async function downloadCertificateAsPng(cert: Certificate) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const W = 1200, H = 850;
  canvas.width = W;
  canvas.height = H;

  const colors: Record<string, string> = {
    Pemula: "#10B981", Muda: "#3B82F6", Madya: "#8B5CF6", Utama: "#F59E0B",
  };
  const color = colors[cert.level] || "#3B82F6";

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Borders
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.strokeStyle = color + "40";
  ctx.lineWidth = 2;
  ctx.strokeRect(35, 35, W - 70, H - 70);

  // Company logo (top-left)
  if (cert.company_logo_url) {
    try {
      const logo = await loadImage(cert.company_logo_url);
      const maxH = 60, maxW = 120;
      const ratio = Math.min(maxW / logo.width, maxH / logo.height);
      const lw = logo.width * ratio, lh = logo.height * ratio;
      ctx.drawImage(logo, 60, 55, lw, lh);
    } catch { /* skip */ }
  }

  // Header
  ctx.fillStyle = "#1F2937";
  ctx.font = "bold 16px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PUB ASPEKINDO — Konstruksi", W / 2, 90);

  // Title
  ctx.fillStyle = color;
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillText("SERTIFIKAT PERSONIL MANAJERIAL BUJK", W / 2, 160);

  // Level
  ctx.fillStyle = "#6B7280";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(`Level: ${cert.level}`, W / 2, 200);

  // Awarded to
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Diberikan kepada:", W / 2, 270);

  // Name
  ctx.fillStyle = "#111827";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText(cert.full_name || "—", W / 2, 330);

  // Company & position
  if (cert.position || cert.company) {
    ctx.fillStyle = "#6B7280";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText([cert.position, cert.company].filter(Boolean).join(" — "), W / 2, 370);
  }

  // Description
  ctx.fillStyle = "#4B5563";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Telah menyelesaikan seluruh modul pembelajaran", W / 2, 430);
  ctx.fillText(`Personil Manajerial BUJK pada level ${cert.level}`, W / 2, 455);

  // Decorative line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 490);
  ctx.lineTo(850, 490);
  ctx.stroke();

  // Certificate number
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText(`No. ${cert.certificate_number}`, W / 2, 530);

  // Date
  ctx.fillText(
    `Diterbitkan pada ${new Date(cert.issued_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    W / 2, 555
  );

  // Signature (bottom-right)
  if (cert.signature_url) {
    try {
      const sig = await loadImage(cert.signature_url);
      const maxH = 70, maxW = 150;
      const ratio = Math.min(maxW / sig.width, maxH / sig.height);
      const sw = sig.width * ratio, sh = sig.height * ratio;
      ctx.drawImage(sig, W - 60 - sw, H - 120 - sh, sw, sh);
      ctx.fillStyle = "#6B7280";
      ctx.font = "12px Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("Tanda Tangan", W - 60, H - 105);
      ctx.textAlign = "center";
    } catch { /* skip */ }
  }

  // Footer
  ctx.fillStyle = "#D1D5DB";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText("Personil Manajerial BUJK — Konstruksi Indonesia", W / 2, H - 50);

  // Download
  const link = document.createElement("a");
  link.download = `Sertifikat-${cert.level}-${cert.certificate_number}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
