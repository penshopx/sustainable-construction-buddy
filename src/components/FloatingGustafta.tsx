import { useState } from "react";
import { X, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const GUSTAFTA_URL = "https://dialog.aspekindo-pub.com";

export default function FloatingGustafta() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
  };

  const openPopup = () => {
    window.open(GUSTAFTA_URL, "gustafta-dialog", "width=460,height=720,resizable=yes,scrollbars=yes");
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

      {/* Dialog panel dengan iframe */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="gustafta-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-[hsl(0,0%,100%)/10%] flex flex-col"
            style={{ height: "560px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[hsl(220,70%,16%)] to-[hsl(225,65%,24%)] px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-pub-amber/20 flex items-center justify-center shrink-0">
                <span className="text-pub-amber font-extrabold text-sm font-heading">G</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm font-heading leading-none">Gustafta Socratic Dialog</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[hsl(0,0%,55%)] text-xs font-body">AI PUB HelpDesk · Online</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={openPopup}
                  title="Buka di jendela terpisah"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[hsl(0,0%,55%)] hover:text-white hover:bg-[hsl(0,0%,100%)/10%] transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <a
                  href={GUSTAFTA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka di tab baru"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[hsl(0,0%,55%)] hover:text-white hover:bg-[hsl(0,0%,100%)/10%] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-[hsl(0,0%,55%)] hover:text-white hover:bg-[hsl(0,0%,100%)/10%]"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Iframe embed */}
            <div className="flex-1 relative bg-white">
              <iframe
                src={GUSTAFTA_URL}
                title="Gustafta Socratic Dialog"
                className="w-full h-full border-0 absolute inset-0"
                allow="microphone; camera"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
