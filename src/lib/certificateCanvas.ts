import type { Certificate } from "@/components/certificates/CertificateHistoryTable";
import logoPub from "@/assets/logo-pub-new.png";
import logoAspekindo from "@/assets/logo-aspekindo.png";

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

  // Institutional logos (centered at top)
  const logoMaxH = 70, logoMaxW = 140;
  const logoY = 50;
  try {
    const pubLogo = await loadImage(logoPub);
    const ratio1 = Math.min(logoMaxW / pubLogo.width, logoMaxH / pubLogo.height);
    const lw1 = pubLogo.width * ratio1, lh1 = pubLogo.height * ratio1;
    ctx.drawImage(pubLogo, W / 2 - lw1 - 20, logoY, lw1, lh1);
  } catch { /* skip */ }

  try {
    const aspLogo = await loadImage(logoAspekindo);
    const ratio2 = Math.min(logoMaxW / aspLogo.width, logoMaxH / aspLogo.height);
    const lw2 = aspLogo.width * ratio2, lh2 = aspLogo.height * ratio2;
    ctx.drawImage(aspLogo, W / 2 + 20, logoY, lw2, lh2);
  } catch { /* skip */ }

  // Header
  ctx.fillStyle = "#1F2937";
  ctx.font = "bold 16px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PUB ASPEKINDO — KONSTRUKSI", W / 2, 150);

  // Title
  ctx.fillStyle = color;
  ctx.font = "bold 42px Arial, sans-serif";
  ctx.fillText("SERTIFIKAT PERSONIL MANAJERIAL BUJK", W / 2, 210);

  // Level
  ctx.fillStyle = "#6B7280";
  ctx.font = "20px Arial, sans-serif";
  ctx.fillText(`Level: ${cert.level}`, W / 2, 250);

  // Awarded to
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Diberikan kepada:", W / 2, 320);

  // Name
  ctx.fillStyle = "#111827";
  ctx.font = "bold 38px Arial, sans-serif";
  ctx.fillText(cert.full_name || "—", W / 2, 380);

  // Company & position
  if (cert.position || cert.company) {
    ctx.fillStyle = "#6B7280";
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText([cert.position, cert.company].filter(Boolean).join(" — "), W / 2, 420);
  }

  // Description
  ctx.fillStyle = "#4B5563";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("Telah menyelesaikan seluruh modul pembelajaran", W / 2, 480);
  ctx.fillText(`Personil Manajerial BUJK pada level ${cert.level}`, W / 2, 505);

  // Decorative line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 540);
  ctx.lineTo(850, 540);
  ctx.stroke();

  // Certificate number
  ctx.fillStyle = "#9CA3AF";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText(`No. ${cert.certificate_number}`, W / 2, 580);

  // Date
  ctx.fillText(
    `Diterbitkan pada ${new Date(cert.issued_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    W / 2, 605
  );

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
