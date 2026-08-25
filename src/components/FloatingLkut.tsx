import { useState } from "react";
import { ArrowRight, BookOpen, ChevronDown, ExternalLink, FileCheck2, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const FAQS = [
  {
    question: "Apa dasar rujukan LKUT?",
    answer: "Rujukan utama LKUT adalah Permen PUPR Nomor 7 Tahun 2024 tentang Pengembangan Usaha Berkelanjutan. Lampirannya memuat format Laporan Kegiatan Usaha Tahunan, termasuk data kepatuhan dan kinerja BUJK.",
  },
  {
    question: "Apa peran Program PUB ASPEKINDO?",
    answer: "Program PUB ASPEKINDO membantu anggota BUJK menyiapkan data, dokumen pendukung, dan pembinaan untuk memenuhi kewajiban serta meningkatkan kemampuan profesional dan usaha secara berkelanjutan.",
  },
  {
    question: "Di mana informasi LSBU?",
    answer: "Informasi mengenai Lembaga Sertifikasi Badan Usaha (LSBU) dapat diakses melalui situs LSBU Konstruksi pada bagian Rujukan chatbot.",
  },
];

const REFERENCES = [
  {
    title: "Permen PUPR No. 7 Tahun 2024",
    detail: "Pengembangan Usaha Berkelanjutan",
  },
  {
    title: "Program PUB ASPEKINDO",
    detail: "Pembinaan dan pendampingan anggota BUJK",
  },
  {
    title: "LSBU Konstruksi",
    detail: "lsbukonstruksi.co.id",
    href: "https://lsbukonstruksi.co.id",
  },
];

export default function FloatingLkut() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const openLkut = () => {
    setIsOpen(false);
    navigate("/lkut");
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="lkut-btn"
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
                className="absolute bottom-16 right-0 w-60 rounded-xl border border-pub-amber/25 bg-[hsl(220,60%,14%)] p-3 shadow-xl pointer-events-none"
              >
                <div className="mb-1 flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-pub-amber" />
                  <p className="text-xs font-bold font-heading text-white">LKUT-PUB-LSBU</p>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs font-body leading-relaxed text-[hsl(0,0%,65%)]">
                  Produk asli ASPEKINDO untuk kesiapan data dan dokumen LKUT BUJK.
                </p>
                <div className="absolute bottom-[-6px] right-6 h-3 w-3 rotate-45 border-b border-r border-pub-amber/25 bg-[hsl(220,60%,14%)]" />
              </motion.div>
            )}

            <button
              onClick={() => {
                setIsOpen(true);
                setHasInteracted(true);
              }}
              title="LKUT-PUB-LSBU"
              className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-pub-amber/30 bg-gradient-to-br from-pub-amber to-orange-500 text-[hsl(220,60%,14%)] shadow-xl transition-all hover:brightness-110"
            >
              <FileCheck2 className="h-6 w-6" />
              {!hasInteracted && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pub-amber opacity-75" />
                  <span className="relative inline-flex h-4 w-4 rounded-full bg-pub-amber" />
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="lkut-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-pub-amber/25 bg-card shadow-2xl"
          >
            <div className="flex items-center gap-3 bg-gradient-to-r from-[hsl(220,60%,14%)] to-[hsl(225,55%,22%)] px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pub-amber/20">
                <FileCheck2 className="h-4 w-4 text-pub-amber" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold font-heading leading-none text-white">LKUT-PUB-LSBU</p>
                <p className="mt-0.5 text-xs font-body text-[hsl(0,0%,60%)]">Produk asli ASPEKINDO</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm font-semibold font-heading text-foreground">
                Kelola kesiapan LKUT BUJK Anda.
              </p>
              <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">
                Siapkan laporan, dokumen pendukung, dan pemantauan kelengkapan LKUT dalam ekosistem PUB ASPEKINDO.
              </p>

              <div className="mt-4 rounded-xl border border-pub-amber/25 bg-pub-amber/10 p-3">
                <p className="text-xs font-semibold font-heading text-pub-amber">Untuk anggota ASPEKINDO</p>
                <p className="mt-1 text-xs font-body leading-relaxed text-muted-foreground">
                  Terhubung dengan kebutuhan pembinaan BUJK dan ekosistem LSBU.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <p className="px-1 text-xs font-semibold font-heading text-muted-foreground">Pertanyaan cepat</p>
                {FAQS.map((faq, index) => (
                  <div key={faq.question} className="overflow-hidden rounded-xl border border-border">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="flex w-full items-center gap-2 p-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 text-pub-amber transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                      <span className="flex-1 text-xs font-semibold font-heading text-foreground">{faq.question}</span>
                    </button>
                    {openFaq === index && (
                      <p className="border-t border-border px-3 pb-3 pt-2 text-xs font-body leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <BookOpen className="h-3.5 w-3.5 text-pub-amber" />
                  <p className="text-xs font-semibold font-heading text-muted-foreground">Rujukan chatbot</p>
                </div>
                {REFERENCES.map((reference) => {
                  const content = (
                    <>
                      <span className="flex-1">
                        <span className="block text-xs font-semibold font-heading text-foreground">{reference.title}</span>
                        <span className="mt-0.5 block text-[11px] font-body text-muted-foreground">{reference.detail}</span>
                      </span>
                      {reference.href && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-pub-sky" />}
                    </>
                  );

                  return reference.href ? (
                    <a
                      key={reference.title}
                      href={reference.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      {content}
                    </a>
                  ) : (
                    <div key={reference.title} className="flex items-center gap-2 rounded-xl border border-border p-3">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 border-t border-border p-3">
              <button
                onClick={openLkut}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-amber px-4 py-2.5 text-sm font-bold font-heading text-accent-foreground shadow-amber transition-all hover:brightness-110"
              >
                Buka LKUT-PUB-LSBU <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  document.getElementById("floating-helpdesk-btn")?.click();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold font-heading text-foreground transition-colors hover:bg-muted"
              >
                <MessageCircle className="h-3.5 w-3.5 text-pub-sky" /> Tanya Helpdesk Aplikasi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}