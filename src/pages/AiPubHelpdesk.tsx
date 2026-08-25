import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, ExternalLink, AlertCircle, Maximize2, FileText } from "lucide-react";

const DOKUMEN_PROYEK_URL = "https://dokumenproyek.com";

export default function AiPubHelpdesk() {
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const openFullscreen = () => {
    window.open(DOKUMEN_PROYEK_URL, "dokumenproyek-helpdesk", "width=500,height=750,resizable=yes,scrollbars=yes");
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Header strip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3 bg-gradient-to-r from-[hsl(220,60%,14%)] to-[hsl(225,55%,22%)] border border-[hsl(0,0%,100%)/10%]"
      >
        <div className="w-9 h-9 rounded-xl bg-pub-amber/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-pub-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-sm font-heading">Helpdesk Aplikasi</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-body">Online</span>
            </div>
          </div>
          <p className="text-[hsl(0,0%,55%)] text-xs font-body truncate">
             Program PUB · implementasi bersama DokumenProyek · panduan aplikasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pub-amber/15 border border-pub-amber/25 text-pub-amber text-xs font-semibold font-heading">
            <Bot className="w-3 h-3" />
            DokumenProyek
          </div>
          <button
            onClick={openFullscreen}
            title="Buka di jendela terpisah"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[hsl(0,0%,100%)/15%] text-[hsl(0,0%,55%)] text-xs hover:bg-[hsl(0,0%,100%)/8%] hover:text-white transition-all font-body"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jendela terpisah</span>
          </button>
          <a
            href={DOKUMEN_PROYEK_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka di tab baru"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[hsl(0,0%,100%)/15%] text-[hsl(0,0%,55%)] text-xs hover:bg-[hsl(0,0%,100%)/8%] hover:text-white transition-all font-body"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab baru</span>
          </a>
        </div>
      </motion.div>

      {/* Dialog iframe container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 rounded-xl overflow-hidden border border-border shadow-card relative"
        style={{ minHeight: "600px" }}
      >
        {/* Loading state */}
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pub-amber/15 flex items-center justify-center">
              <FileText className="w-6 h-6 text-pub-amber" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pub-amber animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-pub-amber animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-pub-amber animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-muted-foreground text-sm font-body">Memuat Helpdesk Aplikasi...</p>
          </div>
        )}

        {/* Error / blocked by X-Frame-Options fallback */}
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card z-10 gap-5 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-pub-amber/15 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-pub-amber" />
            </div>
            <div>
              <p className="text-foreground font-bold font-heading mb-1">Dialog tidak dapat dimuat di sini</p>
              <p className="text-muted-foreground text-sm font-body max-w-sm">
                DokumenProyek memiliki kebijakan keamanan yang mencegah layanan dimuat di dalam frame.
                Gunakan tombol di bawah untuk membukanya langsung.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={openFullscreen}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading shadow-amber hover:brightness-110 transition-all"
              >
                <Maximize2 className="w-4 h-4" />
                Buka DokumenProyek
              </button>
              <a
                href={DOKUMEN_PROYEK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold font-heading hover:bg-muted transition-all text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Buka DokumenProyek.com
              </a>
            </div>
            <p className="text-xs text-muted-foreground font-body">
              DokumenProyek.com · Mitra implementasi PUB · Engine AI{" "}
              <a href="https://gustafta.my.id" target="_blank" rel="noopener noreferrer" className="text-pub-amber hover:underline">
                Gustafta
              </a>
            </p>
          </div>
        )}

        <iframe
          src={DOKUMEN_PROYEK_URL}
          title="DokumenProyek — Helpdesk Aplikasi PUB"
          className="w-full h-full border-0"
          style={{ minHeight: "600px" }}
          allow="microphone; camera"
          onLoad={() => setIframeLoaded(true)}
          onError={() => setIframeError(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </motion.div>
    </div>
  );
}
