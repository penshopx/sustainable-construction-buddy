import { useState, useEffect } from "react";
import { X, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const GUSTAFTA_URL = "https://dialog.aspekindo-pub.com";

interface FloatingChatbotProps {
  variant?: "landing" | "dashboard";
}

export default function FloatingChatbot({ variant = "dashboard" }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (variant === "landing" && !isOpen) {
      const t = setTimeout(() => setShowHint(true), 5000);
      return () => clearTimeout(t);
    }
  }, [variant, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowHint(false);
    setHasInteracted(true);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="chatbot-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Hint bubble */}
            {showHint && !hasInteracted && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute bottom-16 right-0 bg-card border border-border rounded-xl p-3 shadow-lg w-60 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-pub-amber/20 flex items-center justify-center shrink-0">
                    <span className="text-pub-amber font-extrabold text-xs">G</span>
                  </div>
                  <p className="text-foreground font-semibold text-xs">Gustafta AI Siap Membantu</p>
                </div>
                <p className="text-muted-foreground text-xs mt-1">
                  Tanya tentang PUB, SBU, regulasi, atau petakan potensi BUJK Anda!
                </p>
                <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-card border-b border-r border-border rotate-45" />
              </motion.div>
            )}

            <Button
              onClick={handleOpen}
              size="icon"
              className="w-14 h-14 rounded-full shadow-xl bg-gradient-to-br from-[hsl(220,70%,40%)] to-[hsl(225,65%,55%)] hover:brightness-110 transition-all border-2 border-[hsl(0,0%,100%)/20%]"
              title="Dialog dengan Gustafta AI"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            </Button>

            {!hasInteracted && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pub-amber opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-pub-amber" />
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gustafta iframe panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-4rem)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[hsl(0,0%,100%)/10%]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[hsl(220,70%,18%)] to-[hsl(225,65%,26%)] px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-pub-amber/20 flex items-center justify-center">
                <span className="text-pub-amber font-extrabold text-sm font-heading">G</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm font-heading leading-none">GUSTAFTA</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[hsl(0,0%,60%)] text-xs font-body">AI Dialog ASPEKINDO · Online</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={GUSTAFTA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[hsl(0,0%,60%)] hover:text-white hover:bg-[hsl(0,0%,100%)/10%] transition-colors"
                  title="Buka di tab baru"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-[hsl(0,0%,60%)] hover:text-white hover:bg-[hsl(0,0%,100%)/10%]"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 bg-white relative">
              <iframe
                src={GUSTAFTA_URL}
                className="w-full h-full border-0"
                title="Gustafta AI Dialog ASPEKINDO"
                allow="microphone; camera"
                loading="lazy"
              />
            </div>

            {/* Footer */}
            <div className="bg-[hsl(220,60%,12%)] px-4 py-2 flex items-center justify-between shrink-0">
              <p className="text-[hsl(0,0%,40%)] text-xs font-body">
                Powered by{" "}
                <a href="https://gustafta.my.id" target="_blank" rel="noopener noreferrer" className="text-pub-amber hover:underline">
                  Gustafta.my.id
                </a>
              </p>
              <a
                href={GUSTAFTA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(0,0%,40%)] text-xs hover:text-pub-amber transition-colors font-body flex items-center gap-1"
              >
                Buka penuh <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
