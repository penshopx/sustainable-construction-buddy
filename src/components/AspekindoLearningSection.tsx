import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  HeartHandshake,
  MessagesSquare,
  UsersRound,
} from "lucide-react";

const ASPEKINDO_URL = "https://aspekindo.id";

const activities = [
  {
    icon: BookOpenCheck,
    type: "Sesi pembelajaran",
    title: "Pembekalan PUB",
    description: "Memahami langkah awal Pengembangan Usaha Berkelanjutan dan penerapannya di BUJK.",
    audience: "Anggota dan pengelola BUJK",
    status: "Program berkala",
  },
  {
    icon: HeartHandshake,
    type: "Klinik pendampingan",
    title: "Klinik Kesiapan BUJK",
    description: "Membahas kebutuhan usaha secara langsung bersama narasumber dan pendamping ASPEKINDO.",
    audience: "BUJK yang sedang berbenah",
    status: "Sesi terjadwal",
  },
  {
    icon: MessagesSquare,
    type: "Forum berbagi",
    title: "Praktik Baik Konstruksi",
    description: "Berbagi pengalaman, wawasan regulasi, dan cara kerja yang membantu usaha terus bertumbuh.",
    audience: "Komunitas konstruksi",
    status: "Segera diumumkan",
  },
];

export default function AspekindoLearningSection() {
  return (
    <section
      id="agenda-aspekindo"
      aria-labelledby="agenda-aspekindo-title"
      className="relative overflow-hidden bg-[hsl(220,20%,97%)] py-20"
    >
      <div className="pointer-events-none absolute -left-24 top-14 h-64 w-64 rounded-full bg-pub-sky/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-pub-amber/10 blur-3xl" />

      <div className="container relative mx-auto px-6">
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr,1.18fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-pub-emerald/25 bg-pub-emerald/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-pub-emerald">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Agenda pembelajaran ASPEKINDO
            </span>
            <h2
              id="agenda-aspekindo-title"
              className="max-w-xl text-3xl font-extrabold leading-tight font-heading text-foreground md:text-5xl"
            >
              Belajar bersama,{" "}
              <span className="text-pub-emerald">bertumbuh sebagai BUJK.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground font-body md:text-lg">
              Temukan sesi pembekalan, diskusi, dan kegiatan pengembangan usaha
              yang diselenggarakan langsung oleh ASPEKINDO untuk membantu anggota
              menyiapkan praktik usahanya.
            </p>

            <div className="mt-7 rounded-2xl border border-pub-emerald/20 bg-white p-5 shadow-card md:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-pub-emerald/10 p-2.5 text-pub-emerald">
                  <UsersRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold font-heading text-foreground">
                    Kanal belajar resmi ASPEKINDO
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground font-body">
                    Bagian ini adalah pusat informasi kegiatan ASPEKINDO. Detail
                    jadwal dan pendaftaran mengikuti pengumuman resmi kegiatan.
                  </p>
                </div>
              </div>
            </div>

            <a
              href={ASPEKINDO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-pub-emerald px-6 py-3.5 font-bold text-white shadow-card transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pub-emerald focus-visible:ring-offset-2"
            >
              Lihat info & pendaftaran
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="mt-3 text-xs text-muted-foreground font-body">
              Anda akan melanjutkan ke situs resmi ASPEKINDO di tab baru.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pub-sky">
                  Kegiatan yang dapat diikuti
                </p>
                <h3 className="mt-2 text-xl font-bold font-heading text-foreground md:text-2xl">
                  Ruang belajar dan bertukar pengalaman
                </h3>
              </div>
              <CalendarDays
                className="hidden h-8 w-8 shrink-0 text-pub-sky/70 sm:block"
                aria-hidden="true"
              />
            </div>

            <ol className="space-y-4" aria-label="Daftar kegiatan pembelajaran ASPEKINDO">
              {activities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <li key={activity.title} className="relative">
                    {index < activities.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[1.35rem] top-14 hidden h-[calc(100%+1rem)] w-px bg-border sm:block"
                      />
                    )}
                    <div className="relative flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover md:p-6">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pub-sky/10 text-pub-sky">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-pub-sky">
                            {activity.type}
                          </span>
                          <span className="rounded-full bg-pub-amber/15 px-2.5 py-1 text-[11px] font-semibold text-[hsl(32,80%,30%)]">
                            {activity.status}
                          </span>
                        </div>
                        <h4 className="mt-2 text-lg font-bold font-heading text-foreground">
                          {activity.title}
                        </h4>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground font-body">
                          {activity.description}
                        </p>
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-foreground/65 font-body">
                          <UsersRound className="h-3.5 w-3.5 text-pub-emerald" aria-hidden="true" />
                          {activity.audience}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground font-body">
              Informasi kegiatan bersumber dari ASPEKINDO. Detail jadwal,
              narasumber, dan pendaftaran dapat berubah mengikuti pengumuman
              resmi.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}