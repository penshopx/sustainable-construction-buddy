import type { Certificate } from "@/components/certificates/CertificateHistoryTable";
import logoPub from "@/assets/logo-pub-new.png";
import logoAspekindo from "@/assets/logo-aspekindo.png";
import logoLsbuki from "@/assets/logo-lsbuki.png";
import logoLpjk from "@/assets/logo-lpjk.png";

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const drawLogo = async (
  ctx: CanvasRenderingContext2D,
  src: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number
): Promise<number> => {
  try {
    const img = await loadImage(src);
    const ratio = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * ratio, h = img.height * ratio;
    ctx.drawImage(img, x, y, w, h);
    return w;
  } catch {
    return 0;
  }
};

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

  // Logo dimensions
  const logoMaxH = 60, logoMaxW = 100;
  const logoY = 50;
  const gap = 12;

  // Left logos: PUB, ASPEKINDO, LSBUKI
  let leftX = 60;
  const w1 = await drawLogo(ctx, logoPub, leftX, logoY, logoMaxW, logoMaxH);
  leftX += w1 + gap;
  const w2 = await drawLogo(ctx, logoAspekindo, leftX, logoY, logoMaxW, logoMaxH);
  leftX += w2 + gap;
  await drawLogo(ctx, logoLsbuki, leftX, logoY, logoMaxW, logoMaxH);

  // Right logo: LPJK-PU
  const rightX = W - 60 - logoMaxW;
  await drawLogo(ctx, logoLpjk, rightX, logoY, logoMaxW, logoMaxH);

  // Header
  ctx.fillStyle = "#1F2937";
  ctx.font = "bold 16px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PUB ASPEKINDO — KONSTRUKSI", W / 2, 145);

  // Title
  ctx.fillStyle = color;
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillText("SERTIFIKAT PERSONIL MANAJERIAL BUJK", W / 2, 200);

  // Level
  ctx.fillStyle = "#6B7280";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(`Level: ${cert.level}`, W / 2, 240);

  // Awarded to
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Diberikan kepada:", W / 2, 300);

  // Name
  ctx.fillStyle = "#111827";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText(cert.full_name || "—", W / 2, 360);

  // Company & position
  if (cert.position || cert.company) {
    ctx.fillStyle = "#6B7280";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText([cert.position, cert.company].filter(Boolean).join(" — "), W / 2, 400);
  }

  // Description
  ctx.fillStyle = "#4B5563";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Telah menyelesaikan seluruh modul pembelajaran", W / 2, 455);
  ctx.fillText(`Personil Manajerial BUJK pada level ${cert.level}`, W / 2, 480);

  // Decorative line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 510);
  ctx.lineTo(850, 510);
  ctx.stroke();

  // Certificate number
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText(`No. ${cert.certificate_number}`, W / 2, 545);

  // Date
  ctx.fillText(
    `Diterbitkan pada ${new Date(cert.issued_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    W / 2, 570
  );

  // Signatures
  const sigY = H - 140;
  const sigLineW = 180;

  // Left signature - Ketua PUB ASPEKINDO
  ctx.strokeStyle = "#D1D5DB";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, sigY + 50);
  ctx.lineTo(150 + sigLineW, sigY + 50);
  ctx.stroke();
  ctx.fillStyle = "#6B7280";
  ctx.font = "bold 12px Arial, sans-serif";
  ctx.fillText("Ketua PUB ASPEKINDO", 150 + sigLineW / 2, sigY + 70);

  // Right signature - Ketua Umum DPN ASPEKINDO
  ctx.beginPath();
  ctx.moveTo(W - 150 - sigLineW, sigY + 50);
  ctx.lineTo(W - 150, sigY + 50);
  ctx.stroke();
  ctx.fillText("Ketua Umum DPN ASPEKINDO", W - 150 - sigLineW / 2, sigY + 70);

  // Footer
  ctx.fillStyle = "#D1D5DB";
  ctx.font = "12px Arial, sans-serif";
  ctx.fillText("Personil Manajerial BUJK — Konstruksi Indonesia", W / 2, H - 45);

  // Download
  const link = document.createElement("a");
  link.download = `Sertifikat-${cert.level}-${cert.certificate_number}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
