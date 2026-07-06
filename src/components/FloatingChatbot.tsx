import { useState } from "react";
import { X, MessageCircle, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const HELPDESK_URL = "https://aspekindo-pub.com";

interface FloatingChatbotProps {
  variant?: "landing" | "dashboard";
}

export default function FloatingChatbot({ variant = "dashboard" }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setHasInteracted(true);
  };

  const openPopup = () => {
    window.open(HELPDESK_URL, "pub-helpdesk", "width=460,height=720,resizable=yes,scrollbars=yes");
  };

  return (
    <>
      {/* Floating button — LEFT side */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="helpdesk-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 left-6 z-50"
          >
            {!hasInteracted && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3 }}
                className="absolute bottom-16 left-0 bg-card border border-border rounded-xl px-3 py-2 shadow-card text-xs font-body text-foreground whitespace-nowrap pointer-events-none"
              >
                💬 PUB HelpDesk Layanan
              </motion.div>
            )}
            <button
              onClick={handleOpen}
              title="PUB HelpDesk Layanan"
              id="floating-helpdesk-btn"
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-pub-sky to-pub-navy hover:brightness-110 transition-all border-2 border-[hsl(0,0%,100%)/20%] relative"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {!hasInteracted && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pub-sky opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-pub-sky" />
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
            key="helpdesk-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col"
            style={{ height: "560px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pub-sky to-pub-navy px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm font-heading leading-none">PUB HelpDesk Layanan</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/60 text-xs font-body">ASPEKINDO · Online</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={openPopup}
                  title="Buka di jendela terpisah"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <a
                  href={HELPDESK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka di tab baru"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Iframe embed */}
            <div className="flex-1 relative bg-white">
              <iframe
                src={HELPDESK_URL}
                title="PUB HelpDesk Layanan ASPEKINDO"
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
