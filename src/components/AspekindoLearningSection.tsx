import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  BookOpenCheck,
  Clock3,
  Download,
  ExternalLink,
  HeartHandshake,
  Loader2,
  MapPin,
  MessagesSquare,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

const ASPEKINDO_URL = "https://aspekindo.id";

type Agenda = Database["public"]["Tables"]["aspekindo_learning_agendas"]["Row"];

const CATEGORY_ICONS = {
  "Sesi pembelajaran": BookOpenCheck,
  "Klinik pendampingan": HeartHandshake,
  "Forum berbagi": MessagesSquare,
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateRange(agenda: Agenda) {
  if (!agenda.end_date || agenda.end_date === agenda.start_date) return formatDate(agenda.start_date);
  return `${formatDate(agenda.start_date)} – ${formatDate(agenda.end_date)}`;
}

type CalendarTime = {
  minutes: number;
  timezone: string;
  offsetMinutes: number;
};

const TIMEZONE_OFFSETS: Record<string, Omit<CalendarTime, "minutes">> = {
  WIB: { timezone: "Asia/Jakarta", offsetMinutes: 7 * 60 },
  WITA: { timezone: "Asia/Makassar", offsetMinutes: 8 * 60 },
  WIT: { timezone: "Asia/Jayapura", offsetMinutes: 9 * 60 },
};

function parseCalendarTimes(schedule: string): { start: CalendarTime; end: CalendarTime } | null {
  if (!schedule.trim()) return null;

  const timezoneKey = schedule.match(/\b(WIB|WITA|WIT)\b/i)?.[1]?.toUpperCase() ?? "WIB";
  const timezone = TIMEZONE_OFFSETS[timezoneKey];
  const matches = [...schedule.matchAll(/\b(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)?\b/gi)]
    .filter((match) => match[2] || match[3] || !/\b(jam|hari)\b/i.test(schedule));

  if (matches.length === 0) return null;

  const toMinutes = (match: RegExpMatchArray) => {
    let hours = Number(match[1]);
    const minutes = Number(match[2] ?? 0);
    const meridiem = match[3]?.toLowerCase();
    if (minutes > 59 || hours > 23 || (meridiem && hours > 12) || (meridiem && hours === 0)) return null;
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const startMinutes = toMinutes(matches[0]);
  if (startMinutes === null) return null;
  const endMinutes = matches[1] ? toMinutes(matches[1]) : startMinutes + 60;
  if (endMinutes === null) return null;

  return {
    start: { minutes: startMinutes, ...timezone },
    end: { minutes: endMinutes, ...timezone },
  };
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateParts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function formatBasicDate(value: string) {
  return value.replace(/-/g, "");
}

function formatUtcDateTime(dateValue: string, minutes: number, offsetMinutes: number) {
  const { year, month, day } = dateParts(dateValue);
  const utcValue = new Date(Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60) - offsetMinutes * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${utcValue.getUTCFullYear()}${pad(utcValue.getUTCMonth() + 1)}${pad(utcValue.getUTCDate())}T${pad(utcValue.getUTCHours())}${pad(utcValue.getUTCMinutes())}00Z`;
}

function getCalendarDates(agenda: Agenda) {
  const endDate = agenda.end_date ?? agenda.start_date;
  const times = parseCalendarTimes(agenda.schedule);

  if (!times) {
    return {
      google: `${formatBasicDate(agenda.start_date)}/${formatBasicDate(addDays(endDate, 1))}`,
      icsStart: `DTSTART;VALUE=DATE:${formatBasicDate(agenda.start_date)}`,
      icsEnd: `DTEND;VALUE=DATE:${formatBasicDate(addDays(endDate, 1))}`,
    };
  }

  const endMinutes = times.end.minutes;
  let effectiveEndDate = endDate;
  if (effectiveEndDate === agenda.start_date && endMinutes <= times.start.minutes) {
    effectiveEndDate = addDays(effectiveEndDate, 1);
  }

  return {
    google: `${formatUtcDateTime(agenda.start_date, times.start.minutes, times.start.offsetMinutes)}/${formatUtcDateTime(effectiveEndDate, endMinutes, times.end.offsetMinutes)}`,
    icsStart: `DTSTART:${formatUtcDateTime(agenda.start_date, times.start.minutes, times.start.offsetMinutes)}`,
    icsEnd: `DTEND:${formatUtcDateTime(effectiveEndDate, endMinutes, times.end.offsetMinutes)}`,
  };
}

function registrationDetails(agenda: Agenda) {
  return [
    agenda.description,
    agenda.schedule && `Jadwal: ${agenda.schedule}`,
    agenda.registration_details && `Detail pendaftaran: ${agenda.registration_details}`,
    agenda.registration_url && `Daftar kegiatan: ${agenda.registration_url}`,
  ].filter(Boolean).join("\n\n");
}

function getGoogleCalendarUrl(agenda: Agenda) {
  const dates = getCalendarDates(agenda);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: agenda.title,
    dates: dates.google,
    details: registrationDetails(agenda),
    location: agenda.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "agenda-aspekindo";
}

function downloadCalendarFile(agenda: Agenda) {
  const dates = getCalendarDates(agenda);
  const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace(/\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PUB ASPEKINDO//Agenda Pembelajaran//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-TIMEZONE:Asia/Jakarta",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(agenda.id)}@aspekindo.id`,
    `DTSTAMP:${timestamp}`,
    dates.icsStart,
    dates.icsEnd,
    `SUMMARY:${escapeIcsText(agenda.title)}`,
    `DESCRIPTION:${escapeIcsText(registrationDetails(agenda))}`,
    agenda.location && `LOCATION:${escapeIcsText(agenda.location)}`,
    agenda.registration_url && `URL:${agenda.registration_url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([`${lines.join("\r\n")}\r\n`], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(agenda.title)}.ics`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function AspekindoLearningSection() {
  const [activities, setActivities] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPublishedAgendas = async () => {
      const { data } = await supabase
        .from("aspekindo_learning_agendas")
        .select("*")
        .eq("status", "published")
        .order("start_date", { ascending: true })
        .limit(6);
      if (mounted) {
        setActivities(data ?? []);
        setLoading(false);
      }
    };
    void fetchPublishedAgendas();
    return () => { mounted = false; };
  }, []);

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

            {loading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat agenda terbaru...
              </div>
            ) : activities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-pub-sky/25 bg-card p-8 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-pub-sky/60" aria-hidden="true" />
                <p className="mt-3 font-semibold text-foreground">Agenda berikutnya sedang disiapkan.</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Pantau pengumuman resmi ASPEKINDO untuk informasi kegiatan terbaru.
                </p>
              </div>
            ) : (
              <ol className="space-y-4" aria-label="Daftar kegiatan pembelajaran ASPEKINDO">
                {activities.map((activity, index) => {
                  const Icon = CATEGORY_ICONS[activity.category as keyof typeof CATEGORY_ICONS] ?? CalendarDays;
                  return (
                    <li key={activity.id} className="relative">
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
                            {activity.category}
                          </span>
                        </div>
                        <h4 className="mt-2 text-lg font-bold font-heading text-foreground">
                          {activity.title}
                        </h4>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground font-body">
                          {activity.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-foreground/65 font-body">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-pub-emerald" aria-hidden="true" />
                            {formatDateRange(activity)}
                          </span>
                          {activity.schedule && (
                            <span className="flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5 text-pub-emerald" aria-hidden="true" />
                              {activity.schedule}
                            </span>
                          )}
                          {activity.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-pub-emerald" aria-hidden="true" />
                              {activity.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <UsersRound className="h-3.5 w-3.5 text-pub-emerald" aria-hidden="true" />
                            {activity.audience}
                          </span>
                        </div>
                        {activity.registration_details && (
                          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                            {activity.registration_details}
                          </p>
                        )}
                        {activity.registration_url && (
                          <a
                            href={activity.registration_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-pub-sky hover:underline"
                          >
                            Daftar kegiatan <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </a>
                        )}
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4" data-testid={`agenda-calendar-actions-${activity.id}`}>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 gap-1.5 border-pub-sky/30 text-pub-sky hover:bg-pub-sky/10 hover:text-pub-sky"
                          >
                            <a
                              href={getGoogleCalendarUrl(activity)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Simpan ${activity.title} ke Google Calendar`}
                            >
                              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                              Google Calendar
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => downloadCalendarFile(activity)}
                            aria-label={`Unduh file kalender ${activity.title}`}
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            Unduh .ics
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ol>
            )}

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