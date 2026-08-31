import { motion } from "framer-motion";
import { ArrowRight, FileCheck2, Gauge, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const tools = [
  {
    href: "/simulator-sbu",
    icon: ShieldCheck,
    eyebrow: "Siap Sertifikasi",
    title: "Simulator Kesiapan SBU",
    description: "Petakan kesiapan legalitas, SKK, pengalaman, peralatan, keuangan, dan bukti kepatuhan BUJK.",
    className: "border-pub-sky/25 bg-pub-sky/[0.06] hover:border-pub-sky/50",
    iconClassName: "bg-pub-sky/15 text-pub-sky",
  },
  {
    href: "/simulator-lkut",
    icon: FileCheck2,
    eyebrow: "Persiapan LKUT",
    title: "Simulator Kesiapan LKUT",
    description: "Periksa apakah data proyek, keuangan, kepatuhan, dan kegiatan PUB siap direkap sebelum batas pelaporan.",
    className: "border-pub-amber/25 bg-pub-amber/[0.06] hover:border-pub-amber/50",
    iconClassName: "bg-pub-amber/15 text-pub-amber",
  },
];

export default function ReadinessToolsSection() {
  return (
    <section id="simulator-kesiapan" className="relative overflow-hidden bg-background py-20">
      <div className="pointer-events-none absolute -left-28 top-12 h-64 w-64 rounded-full bg-pub-sky/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-pub-amber/10 blur-3xl" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-10 max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-pub-emerald/25 bg-pub-emerald/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-pub-emerald">
            <Gauge className="h-3.5 w-3.5" />
            Uji kesiapan BUJK
          </span>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight font-heading text-foreground md:text-5xl">
            Ketahui prioritas Anda sebelum mulai mengurus
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground font-body md:text-lg">
            Dua simulator singkat untuk membantu anggota memetakan dokumen dan bukti yang perlu disiapkan melalui ekosistem PUB ASPEKINDO.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={tool.href}
                  className={`group block h-full rounded-2xl border p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover ${tool.className}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tool.iconClassName}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{tool.eyebrow}</p>
                      <h3 className="mt-1 text-xl font-bold font-heading text-foreground">{tool.title}</h3>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-pub-navy transition-colors group-hover:text-pub-sky dark:text-white dark:group-hover:text-pub-amber">
                    Mulai asesmen <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}