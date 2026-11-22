import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, Brain, ExternalLink, Store } from "lucide-react";

const expertiseAreas = [
  {
    icon: BookOpen,
    title: "Regulasi & kebijakan",
    description: "Rujukan regulasi dan kebijakan konstruksi yang tersedia.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Profesi & kompetensi",
    description: "Skema sertifikasi dan materi kompetensi profesi.",
  },
  {
    icon: Building2,
    title: "Usaha jasa konstruksi",
    description: "Pengetahuan pengembangan dan praktik usaha BUJK.",
  },
];

export default function PakarCerdasSection() {
  return (
    <section
      aria-labelledby="pakar-cerdas-home-title"
      data-testid="home-pakar-cerdas"
      className="relative overflow-hidden bg-[hsl(220,58%,10%)] py-12 text-white md:py-20"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-pub-sky/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-0 h-72 w-72 rounded-full bg-pub-amber/10 blur-3xl" />
      <div className="container relative mx-auto px-5 md:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr,1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-pub-sky/35 bg-pub-sky/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
              <Brain className="h-4 w-4" aria-hidden="true" />
              Pakar Cerdas · Pengetahuan Konstruksi
            </span>
            <h2
              id="pakar-cerdas-home-title"
              className="max-w-2xl text-3xl font-extrabold leading-tight font-heading md:text-5xl"
            >
              Rujukan cerdas untuk{" "}
              <span className="text-pub-sky">profesi dan usaha</span> jasa konstruksi.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
              Tanyakan regulasi konstruksi, kompetensi profesi, dan pengembangan BUJK.
              Pakar Cerdas menelusuri referensi yang tersedia dan menampilkan rujukan agar
              Anda dapat memeriksanya kembali.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/helpdesk"
                data-testid="link-home-pakar-cerdas"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pub-amber px-6 py-3 font-bold text-pub-navy shadow-lg transition hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Tanya Pakar Cerdas
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="https://gustafta.my.id/store"
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                data-testid="link-home-gustafta-store"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Store className="h-4 w-4" aria-hidden="true" />
                Produk AI Gustafta
                <ExternalLink className="h-3.5 w-3.5 opacity-75" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              Masuk dengan akun PUB untuk bertanya. Jawaban AI adalah bantuan informasi,
              bukan keputusan hukum, sertifikasi, atau penetapan resmi.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Toko Gustafta adalah situs eksternal; tautan ini tidak meneruskan percakapan atau data PUB.
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {expertiseAreas.map(({ icon: Icon, title, description }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm md:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pub-sky/15 text-pub-sky">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-white">{title}</h3>
                    <p className="mt-1 hidden text-sm leading-relaxed text-white/70 md:block">{description}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
