import { useState } from "react";
import { X, ArrowRight, Map, ExternalLink, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const GUSTAFTA_URL = "https://dialog.aspekindo-pub.com";

const FEATURES = [
  "Petakan problem BUJK secara mendalam & personal",
  "Dapatkan Blue Print Potensi Diri BUJK Anda",
  "Konsultasi regulasi, SBU, LKUT, PANCEK kapan saja",
  "Rekomendasi program & langkah nyata ke depan",
];

export default function FloatingGustafta() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const openDialog = () => {
    window.open(GUSTAFTA_URL, "gustafta-dialog", "width=460,height=720,resizable=yes,scrollbars=yes");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
  };

  return (
    <>
      {/* Floating button — RIGHT side */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="gustafta-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Hint tooltip */}
            {!hasInteracted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 5 }}
                className="absolute bottom-16 right-0 bg-[hsl(220,60%,14%)] border border-[hsl(0,0%,100%)/12%] rounded-xl p-3 shadow-xl w-56 pointer-events-none"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-pub-amber font-extrabold text-sm font-heading">G</span>
                  <p className="text-white font-bold text-xs font-heading">Gustafta Dialog</p>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
                </div>
                <p className="text-[hsl(0,0%,65%)] text-xs font-body leading-relaxed">
                  Buat Blue Print Potensi BUJK Anda melalui Socratic Dialog AI!
                </p>
                <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-[hsl(220,60%,14%)] border-b border-r border-[hsl(0,0%,100%)/12%] rotate-45" />
              </motion.div>
            )}

            <button
              onClick={handleOpen}
              title="Gustafta Socratic Dialog"
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-[hsl(220,70%,40%)] to-[hsl(225,60%,55%)] hover:brightness-110 transition-all border-2 border-[hsl(0,0%,100%)/15%] relative"
            >
              <span className="text-white font-extrabold text-xl font-heading">G</span>
              {!hasInteracted && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pub-amber opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-pub-amber" />
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="gustafta-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-[hsl(0,0%,100%)/10%]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[hsl(220,70%,16%)] to-[hsl(225,65%,24%)] px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pub-amber/20 flex items-center justify-center shrink-0">
                <span className="text-pub-amber font-extrabold text-base font-heading">G</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm font-heading leading-none">Gustafta Socratic Dialog</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[hsl(0,0%,55%)] text-xs font-body">AI PUB HelpDesk · Online</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-[hsl(0,0%,55%)] hover:text-white hover:bg-[hsl(0,0%,100%)/10%]"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="bg-gradient-to-b from-[hsl(220,55%,12%)] to-[hsl(220,50%,16%)] p-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pub-amber/15 border border-pub-amber/25 text-pub-amber text-xs font-semibold font-heading mb-4">
                Hasilkan Blue Print Potensi BUJK Anda
              </div>

              <h3 className="text-white font-bold font-heading text-sm leading-snug mb-2">
                Dialog Socratic AI yang memetakan problem dan{" "}
                <span className="text-pub-amber">menghasilkan Blue Print</span>{" "}
                pengembangan BUJK personal
              </h3>

              <div className="space-y-2 mb-5">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-xs text-[hsl(0,0%,65%)] font-body">
                    <Map className="w-3.5 h-3.5 text-pub-amber shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Primary CTA — open popup */}
              <button
                onClick={openDialog}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-amber text-accent-foreground font-bold font-heading text-sm shadow-amber hover:brightness-110 transition-all mb-2"
              >
                Mulai Gustafta Socratic Dialog <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                <a
                  href="/ai-helpdesk"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[hsl(0,0%,100%)/12%] text-[hsl(0,0%,60%)] text-xs font-body hover:bg-[hsl(0,0%,100%)/5%] hover:text-white transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Layar penuh
                </a>
                <a
                  href={GUSTAFTA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[hsl(0,0%,100%)/12%] text-[hsl(0,0%,60%)] text-xs font-body hover:bg-[hsl(0,0%,100%)/5%] hover:text-white transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Tab baru
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[hsl(220,60%,10%)] px-4 py-2 flex items-center justify-between">
              <p className="text-[hsl(0,0%,35%)] text-xs font-body">
                Powered by{" "}
                <a href="https://gustafta.my.id" target="_blank" rel="noopener noreferrer" className="text-pub-amber hover:underline">
                  gustafta.my.id
                </a>
              </p>
              <div className="flex items-center gap-1 text-[hsl(0,0%,35%)] text-xs font-body">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Siap melayani
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
