import { useState } from "react";
import { X, MessageCircle, ChevronRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  { q: "Apa itu PUB ASPEKINDO?", a: "PUB (Pengembangan Usaha Berkelanjutan) adalah program ekosistem kompetensi digital ASPEKINDO untuk Personil Manajerial BUJK — mencakup assessment, e-learning, sertifikasi, dan pendampingan." },
  { q: "Siapa yang bisa bergabung?", a: "Personil Manajerial BUJK (Badan Usaha Jasa Konstruksi) anggota ASPEKINDO — direktur, manajer, maupun staf profesional di bidang konstruksi." },
  { q: "Apa itu BUJK?", a: "BUJK (Badan Usaha Jasa Konstruksi) adalah perusahaan yang bergerak di bidang jasa konstruksi sesuai UU No. 2 Tahun 2017 tentang Jasa Konstruksi." },
  { q: "Bagaimana cara mendaftar?", a: "Klik 'Daftar Sekarang' di halaman utama, isi data BUJK dan personil, lalu ikuti proses verifikasi keanggotaan ASPEKINDO." },
  { q: "Apa itu LKUT & PANCEK?", a: "LKUT (Laporan Keuangan Usaha Tahunan) dan PANCEK (Penilaian Akhir Capaian Kompetensi) adalah instrumen pengukuran kinerja dan kompetensi BUJK wajib bagi anggota." },
];

interface FloatingChatbotProps {
  variant?: "landing" | "dashboard";
}

export default function FloatingChatbot({ variant = "dashboard" }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <button
              onClick={() => setIsOpen(true)}
              title="PUB HelpDesk Layanan"
              id="floating-helpdesk-btn"
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-gradient-to-br from-pub-sky to-pub-navy hover:brightness-110 transition-all border-2 border-[hsl(0,0%,100%)/20%]"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-16 left-0 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 }}
                className="bg-card border border-border rounded-xl px-3 py-2 shadow-card text-xs font-body text-foreground whitespace-nowrap"
              >
                💬 PUB HelpDesk Layanan
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="helpdesk-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-6 z-50 w-[320px] max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden border border-border bg-card"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pub-sky to-pub-navy px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm font-heading leading-none">PUB HelpDesk Layanan</p>
                <p className="text-white/60 text-xs font-body mt-0.5">Info layanan & pendaftaran ASPEKINDO</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
              <p className="text-xs text-muted-foreground font-body">Pertanyaan umum tentang layanan PUB ASPEKINDO:</p>

              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-pub-sky shrink-0 transition-transform ${openFaq === i ? "rotate-90" : ""}`}
                    />
                    <span className="text-xs font-semibold font-heading text-foreground">{faq.q}</span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-muted-foreground font-body px-3 pb-3 leading-relaxed border-t border-border pt-2">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Footer — kontak */}
            <div className="border-t border-border px-4 py-3 bg-muted/30 space-y-2">
              <p className="text-xs font-semibold font-heading text-foreground">Hubungi Kami</p>
              <div className="flex flex-col gap-1.5">
                <a href="https://aspekindo.id" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-pub-sky transition-colors font-body">
                  <Globe className="w-3.5 h-3.5" />
                  aspekindo.id
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
