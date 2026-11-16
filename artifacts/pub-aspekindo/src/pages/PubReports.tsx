import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zipSync } from "fflate";
import {
  getAssignPubReportMembershipMutationOptions,
  getCreatePubReportUnitMutationOptions,
  getDeactivatePubReportMembershipMutationOptions,
  getListPubReportMembershipsQueryKey,
  getAddPubReportAttachmentMutationOptions,
  getAddPubReportParticipantMutationOptions,
  getCreatePubReportMutationOptions,
  getGetPubReportQueryKey,
  getGetPubReportAccessQueryKey,
  getGetVaultWorkspaceQueryKey,
  getListPubReportUnitsQueryKey,
  getListPubReportsQueryKey,
  getMarkPubReportUploadedMutationOptions,
  getRemovePubReportAttachmentMutationOptions,
  getRemovePubReportParticipantMutationOptions,
  getReviewPubReportMutationOptions,
  getSubmitPubReportMutationOptions,
  getUpdatePubReportMutationOptions,
  getUpdatePubReportParticipantMutationOptions,
  downloadPubReportAttachment,
  useGetPubReport,
  useGetPubReportAccess,
  useGetVaultWorkspace,
  useListPubReportMemberships,
  useListPubReports,
  useListPubReportUnits,
} from "@workspace/api-client-react";
import { estimatePubReportDeadline } from "@/lib/pubReportDeadline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import type {
  PubReport,
  PubReportAttachmentCategory,
  PubReportInput,
  PubReportParticipant,
  PubReportParticipantInput,
  PubReportPerson,
  PubReportAgendaItem,
} from "@workspace/api-client-react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileArchive,
  FileSpreadsheet,
  FileText,
  History,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

type FormState = PubReportInput;
type Section = "overview" | "people" | "participants" | "evidence" | "history";
type SourceActivity = Pick<Tables<"aspekindo_pub_activities">,
  "id" | "title" | "activity_type" | "delivery_mode" | "start_at" | "end_at" | "location" | "description">;

const panel = "rounded-xl border border-slate-700/80 bg-[#101a28]";
const field = "mt-1 w-full rounded-lg border border-slate-600 bg-[#0b1420] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20";
const label = "text-xs font-semibold uppercase tracking-[0.09em] text-slate-400";
const primaryButton = "inline-flex items-center justify-center gap-2 rounded-lg bg-sky-300 px-4 py-2.5 text-sm font-bold text-[#07111d] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-45";
const subtleButton = "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-40";

const emptyForm = (unitId: string): FormState => ({
  unitId,
  sourceActivityId: null,
  title: "",
  activityType: "",
  classification: "general",
  eventForm: "",
  deliveryMode: "offline",
  level: "national",
  background: "",
  legalBasis: "",
  purpose: "",
  startsAt: "",
  endsAt: null,
  location: "",
  targetAudience: "",
  targetQualification: "",
  targetPerformanceGrade: null,
  responsibleName: "",
  recommendations: "",
  followUp: "",
  closing: "",
  committee: [],
  rundown: [],
});

function localDateTime(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function displayDate(value?: string | null) {
  if (!value) return "Belum ditetapkan";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusLabel(status: string) {
  return ({
    draft: "Draf",
    submitted: "Menunggu review",
    needs_revision: "Perlu revisi",
    ready_to_upload: "Siap diunggah",
    uploaded: "Tercatat diunggah",
  } as Record<string, string>)[status] ?? status;
}

function statusTone(status: string) {
  if (status === "ready_to_upload" || status === "uploaded") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "submitted") return "border-sky-300/30 bg-sky-300/10 text-sky-200";
  if (status === "needs_revision") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  return "border-slate-500/40 bg-slate-700/40 text-slate-300";
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function cleanName(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "laporan-pub";
}

function safeArchiveName(value: string) {
  const basename = value.replace(/\\/g, "/").split("/").pop() ?? "";
  return basename.replace(/[\u0000-\u001f\u007f]/g, "_").replace(/\.{2,}/g, "_").slice(0, 180) || "dokumen";
}

function mutationErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data: unknown }).data;
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") return data.error;
  }
  return "Perubahan belum tersimpan. Periksa sesi dan data laporan, lalu coba lagi.";
}

function makePdf(
  report: PubReport,
  participants: PubReportParticipant[],
  attachments: Array<{ fileName: string; category: string }>,
) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const people = report.committee.length
    ? report.committee.map((person, index) => `${index + 1}. ${person.name} — ${person.role}${person.affiliation ? ` · ${person.affiliation}` : ""}${person.topic ? ` · ${person.topic}` : ""}${person.hours == null ? "" : ` · ${person.hours} jam`}`)
    : ["Belum dicatat."];
  const rundown = report.rundown.length
    ? report.rundown.map((item, index) => `${index + 1}. ${item.startsAt}–${item.endsAt} — ${item.activity}${item.speaker ? ` · ${item.speaker}` : ""}${item.notes ? `\n   ${item.notes}` : ""}`)
    : ["Belum dicatat."];
  const roster = participants.length
    ? participants.map((person, index) => `${index + 1}. ${person.fullName} · ${person.companyName || "Perusahaan tidak dicantumkan"} · ${person.qualification || "Kualifikasi tidak dicantumkan"} · Kehadiran: ${person.attendanceStatus === "verified" ? "diverifikasi manual" : person.attendanceStatus === "needs_correction" ? "perlu koreksi" : "belum diverifikasi"}`)
    : ["Belum ada peserta."];
  const evidence = attachments.length
    ? attachments.map((attachment, index) => `${index + 1}. ${attachment.category}: ${attachment.fileName}`)
    : ["Belum ada dokumen tertaut."];
  const lines = pdf.splitTextToSize([
    `LAPORAN KEGIATAN PUB — ${report.title}`,
    `Unit pelapor: ${report.unitName}`,
    `Kegiatan sumber LMS: ${report.sourceActivityId || "tidak ditautkan"}`,
    `Jenis/bentuk: ${report.activityType} / ${report.eventForm}`,
    `Klasifikasi/metode/tingkat: ${report.classification} / ${report.deliveryMode} / ${report.level}`,
    `Waktu: ${displayDate(report.startsAt)}${report.endsAt ? ` — ${displayDate(report.endsAt)}` : ""}`,
    `Lokasi: ${report.location || "—"}`,
    `Penanggung jawab: ${report.responsibleName || "—"}`,
    "",
    "LATAR BELAKANG", report.background || "—", "",
    "DASAR HUKUM", report.legalBasis || "—", "",
    "TUJUAN", report.purpose || "—", "",
    "SASARAN", `${report.targetAudience || "—"} · ${report.targetQualification || "—"}${report.targetPerformanceGrade ? ` · Grade ${report.targetPerformanceGrade}` : ""}`, "",
    "PERSONEL", ...people, "",
    "RUNDOWN", ...rundown, "",
    "PESERTA DAN KEHADIRAN MANUAL", ...roster, "",
    "REKOMENDASI", report.recommendations || "—", "",
    "TINDAK LANJUT", report.followUp || "—", "",
    "PENUTUP", report.closing || "—", "",
    "DOKUMEN PENDUKUNG TERTAUT", ...evidence, "",
    `Status internal PUB: ${statusLabel(report.status)}. Status ini bukan bukti penerimaan atau persetujuan LPJK.`,
    "Paket ini perlu diperiksa terhadap format dan ketentuan pelaporan LPJK yang berlaku sebelum diunggah.",
  ].join("\n"), 176);
  let y = 18;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  lines.forEach((line: string) => {
    if (y > 278) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(line, 17, y);
    y += 5.2;
  });
  return pdf.output("blob");
}

function makeWorkbook(report: PubReport, participants: Array<Record<string, unknown>>) {
  const workbook = XLSX.utils.book_new();
  const infoRows = [
    ["Laporan kegiatan PUB", report.title],
    ["Unit", report.unitName],
    ["ID kegiatan sumber LMS", report.sourceActivityId || "—"],
    ["Status internal", statusLabel(report.status)],
    ["Jenis kegiatan", report.activityType],
    ["Klasifikasi", report.classification],
    ["Bentuk kegiatan", report.eventForm],
    ["Metode", report.deliveryMode],
    ["Tingkat", report.level],
    ["Mulai", displayDate(report.startsAt)],
    ["Selesai", displayDate(report.endsAt)],
    ["Lokasi", report.location],
    ["Penanggung jawab", report.responsibleName],
    ["Latar belakang", report.background],
    ["Dasar hukum", report.legalBasis],
    ["Tujuan", report.purpose],
    ["Sasaran", report.targetAudience],
    ["Kualifikasi sasaran", report.targetQualification],
    ["Rekomendasi", report.recommendations],
    ["Tindak lanjut", report.followUp],
    ["Penutup", report.closing],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(infoRows), "Laporan");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(report.committee.map((person) => ({
    Nama: person.name, Afiliasi: person.affiliation, Peran: person.role, Topik: person.topic, "Jam tugas": person.hours,
  }))), "Personel");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(report.rundown.map((item) => ({
    Mulai: item.startsAt, Selesai: item.endsAt, Kegiatan: item.activity, Pembicara: item.speaker, Catatan: item.notes,
  }))), "Rundown");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(participants), "Peserta");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

function Skeleton() {
  return <div className="space-y-4" aria-label="Memuat laporan" data-testid="loading-pub-reports">
    <div className="h-28 animate-pulse rounded-xl bg-slate-800/80" />
    <div className="h-16 animate-pulse rounded-xl bg-slate-800/60" />
    <div className="h-64 animate-pulse rounded-xl bg-slate-800/50" />
  </div>;
}

export default function PubReports() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const accessQuery = useGetPubReportAccess();
  const listQuery = useListPubReports();
  const unitsQuery = useListPubReportUnits();
  const reports = listQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const access = accessQuery.data;
  const availableUnits = units.filter((unit) => unit.active && unit.unitType === "branch" &&
    (access?.role === "platform_admin" || access?.units.some((membership) =>
      membership.unitId === unit.id && membership.role === "branch_operator")));
  const [selectedId, setSelectedId] = useState("");
  const [queryText, setQueryText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [participantForm, setParticipantForm] = useState<PubReportParticipantInput>({
    fullName: "", companyName: "", qualification: "", performanceGrade: null, participantRole: "bujk",
  });
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [reviewNote, setReviewNote] = useState("");
  const [uploadReference, setUploadReference] = useState("");
  const [showVault, setShowVault] = useState(false);
  const [attachmentCategory, setAttachmentCategory] = useState<PubReportAttachmentCategory>("documentation");
  const [vaultSearch, setVaultSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [sourceActivities, setSourceActivities] = useState<SourceActivity[]>([]);
  const [sourceActivitiesLoading, setSourceActivitiesLoading] = useState(false);
  const [sourceActivitiesError, setSourceActivitiesError] = useState(false);
  const showMutationError = (error: unknown) => toast.error(mutationErrorMessage(error));
  const userId = user?.id;

  useEffect(() => {
    setSourceActivities([]);
    setSourceActivitiesError(false);
    if (!userId) {
      setSourceActivitiesLoading(false);
      return;
    }
    let active = true;
    setSourceActivitiesLoading(true);
    void supabase.from("aspekindo_pub_activities")
      .select("id,title,activity_type,delivery_mode,start_at,end_at,location,description")
      .order("start_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setSourceActivitiesError(true);
          setSourceActivitiesLoading(false);
          return;
        }
        setSourceActivities((data ?? []) as SourceActivity[]);
        setSourceActivitiesError(false);
        setSourceActivitiesLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  const selectSourceActivity = (activityId: string) => {
    const source = sourceActivities.find((activity) => activity.id === activityId);
    if (!source) {
      setForm({ ...form, sourceActivityId: null });
      return;
    }
    const rawMode = source.delivery_mode.toLowerCase();
    const deliveryMode: FormState["deliveryMode"] = rawMode.includes("hybrid") ? "hybrid"
      : rawMode.includes("offline") || rawMode.includes("tatap") ? "offline" : "online";
    setForm({
      ...form,
      sourceActivityId: source.id,
      title: source.title || form.title,
      activityType: source.activity_type || form.activityType,
      eventForm: source.activity_type || form.eventForm,
      deliveryMode,
      startsAt: localDateTime(source.start_at),
      endsAt: localDateTime(source.end_at),
      location: source.location || form.location,
      background: source.description || form.background,
    });
  };

  const reportQuery = useGetPubReport(selectedId, {
    query: { enabled: Boolean(selectedId), queryKey: getGetPubReportQueryKey(selectedId) },
  });
  const detail = reportQuery.data;
  const report = detail?.report;
  const vaultQuery = useGetVaultWorkspace({
    query: { enabled: showVault, queryKey: getGetVaultWorkspaceQueryKey() },
  });
  const createMutation = useMutation(getCreatePubReportMutationOptions({ mutation: { onError: showMutationError } }));
  const updateMutation = useMutation(getUpdatePubReportMutationOptions({ mutation: { onError: showMutationError } }));
  const submitMutation = useMutation(getSubmitPubReportMutationOptions({ mutation: { onError: showMutationError } }));
  const reviewMutation = useMutation(getReviewPubReportMutationOptions({ mutation: { onError: showMutationError } }));
  const uploadMutation = useMutation(getMarkPubReportUploadedMutationOptions({ mutation: { onError: showMutationError } }));
  const addParticipantMutation = useMutation(getAddPubReportParticipantMutationOptions({ mutation: { onError: showMutationError } }));
  const updateParticipantMutation = useMutation(getUpdatePubReportParticipantMutationOptions({ mutation: { onError: showMutationError } }));
  const removeParticipantMutation = useMutation(getRemovePubReportParticipantMutationOptions({ mutation: { onError: showMutationError } }));
  const addAttachmentMutation = useMutation(getAddPubReportAttachmentMutationOptions({ mutation: { onError: showMutationError } }));
  const removeAttachmentMutation = useMutation(getRemovePubReportAttachmentMutationOptions({ mutation: { onError: showMutationError } }));
  const busy = createMutation.isPending || updateMutation.isPending || submitMutation.isPending ||
    reviewMutation.isPending || uploadMutation.isPending || addParticipantMutation.isPending ||
    updateParticipantMutation.isPending || removeParticipantMutation.isPending ||
    addAttachmentMutation.isPending || removeAttachmentMutation.isPending;

  const filteredReports = useMemo(() => reports.filter((item) => {
    const matchesText = `${item.title} ${item.unitName} ${item.activityType}`.toLowerCase().includes(queryText.toLowerCase());
    return matchesText && (statusFilter === "all" || item.status === statusFilter);
  }), [reports, queryText, statusFilter]);
  const vaultDocuments = (vaultQuery.data?.documents ?? []).filter((doc) =>
    doc.name.toLowerCase().includes(vaultSearch.toLowerCase()));

  const invalidateReports = async (id?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListPubReportsQueryKey() }),
      ...(id ? [queryClient.invalidateQueries({ queryKey: getGetPubReportQueryKey(id) })] : []),
    ]);
  };
  const openNew = () => {
    const unitId = availableUnits[0]?.id ?? "";
    setForm(emptyForm(unitId));
    setSelectedId("");
    setEditing(true);
    setActiveSection("overview");
  };
  const openEdit = () => {
    if (!report) return;
    setForm({
      unitId: report.unitId, sourceActivityId: report.sourceActivityId,
      title: report.title, activityType: report.activityType, classification: report.classification,
      eventForm: report.eventForm, deliveryMode: report.deliveryMode, level: report.level,
      background: report.background, legalBasis: report.legalBasis, purpose: report.purpose,
      startsAt: localDateTime(report.startsAt), endsAt: localDateTime(report.endsAt),
      location: report.location, targetAudience: report.targetAudience,
      targetQualification: report.targetQualification, targetPerformanceGrade: report.targetPerformanceGrade,
      responsibleName: report.responsibleName, recommendations: report.recommendations,
      followUp: report.followUp, closing: report.closing,
      committee: report.committee.map((person) => ({ ...person })),
      rundown: report.rundown.map((item) => ({ ...item })),
    });
    setEditing(true);
  };

  const saveReport = () => {
    if (!form.unitId || !form.title.trim() || !form.activityType.trim() || !form.eventForm.trim() || !form.startsAt) return;
    const payload: PubReportInput = {
      ...form,
      title: form.title.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      sourceActivityId: form.sourceActivityId?.trim() || null,
      targetPerformanceGrade: form.targetPerformanceGrade?.trim() || null,
    };
    if (report) {
      updateMutation.mutate({ id: report.id, data: { ...payload, expectedRevision: report.revision } }, {
        onSuccess: async () => { setEditing(false); await invalidateReports(report.id); },
      });
    } else {
      createMutation.mutate({ data: payload }, {
        onSuccess: async (created) => { setEditing(false); setSelectedId(created.id); await invalidateReports(created.id); },
      });
    }
  };

  const canEdit = Boolean(access && (access.role === "platform_admin" ||
    access.units.some((membership) => membership.role === "branch_operator"))) &&
    (!report || report.status === "draft" || report.status === "needs_revision");
  const canReview = access?.canReviewAll && report?.status === "submitted";
  const errors = [accessQuery.error, listQuery.error, unitsQuery.error, reportQuery.error].filter(Boolean);

  if (accessQuery.isLoading) return <main className="min-h-[70vh] bg-[#080f18] p-4 text-slate-100 md:p-8"><Skeleton /></main>;
  if (accessQuery.isError || !access) return <main className="min-h-[70vh] bg-[#080f18] p-6 text-slate-100">
    <div className={`${panel} mx-auto max-w-3xl p-8`} role="alert" data-testid="error-pub-report-access">
      <AlertCircle className="mb-3 h-6 w-6 text-amber-300" /><h1 className="text-xl font-bold">Akses laporan tidak dapat diperiksa</h1>
      <p className="mt-2 text-sm text-slate-400">Periksa koneksi dan sesi Anda, lalu coba lagi.</p>
      <button className={`${secondaryButton} mt-5`} onClick={() => void accessQuery.refetch()} data-testid="button-retry-access">Coba lagi</button>
    </div>
  </main>;
  if (access.role === "no_access") return <main className="min-h-[70vh] bg-[#080f18] p-6 text-slate-100">
    <div className={`${panel} mx-auto max-w-3xl p-8`} role="status" data-testid="state-pub-report-access-denied">
      <ShieldCheck className="mb-3 h-6 w-6 text-sky-300" /><h1 className="text-xl font-bold">Akses belum tersedia</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Akun ini belum memiliki peran pada ruang kerja laporan PUB. Hubungi pengelola pusat untuk pengaturan akses.</p>
    </div>
  </main>;

  return <main className="min-h-[70vh] bg-[#080f18] px-4 py-5 text-slate-100 md:px-8 md:py-8" data-testid="page-pub-reports">
    <div className="mx-auto max-w-[1440px]">
      <header className="mb-6 flex flex-col justify-between gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300"><span className="h-px w-7 bg-sky-300" /> Ruang kerja PUB</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50 md:text-[2.45rem]">Laporan kegiatan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Susun laporan berbasis bukti, catat kehadiran secara manual, dan kelola pemeriksaan internal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-300" data-testid="text-user-role">
            {access.role === "platform_admin" ? "Admin platform" : access.role === "central_reviewer" ? "Reviewer pusat" : "Operator cabang"}
            {access.units.length > 0 && <span className="ml-2 border-l border-slate-700 pl-2 text-slate-400">{access.units.length} unit</span>}
          </div>
          {access.role !== "central_reviewer" && <button className={primaryButton} onClick={openNew} disabled={!availableUnits.length} data-testid="button-create-report"><Plus className="h-4 w-4" /> Buat laporan</button>}
        </div>
      </header>

      {errors.length > 0 && <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-amber-400/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100" role="alert" data-testid="error-report-data">
        <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" /> Sebagian data belum dapat dimuat. Data yang tersedia tetap dapat digunakan.</span>
        <button className="underline underline-offset-2" onClick={() => { void listQuery.refetch(); void unitsQuery.refetch(); }} data-testid="button-retry-report-data">Muat ulang</button>
      </div>}

      {editing ? <section className={`${panel} overflow-hidden`} aria-label="Editor laporan" data-testid="form-report-editor">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3"><button className={subtleButton} onClick={() => setEditing(false)} data-testid="button-close-editor"><ArrowLeft className="h-4 w-4" /> Kembali</button>
            <div><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{report ? "Ubah laporan" : "Laporan baru"}</p><h2 className="mt-0.5 text-lg font-semibold">{form.title || "Laporan tanpa judul"}</h2></div>
          </div>
          <button className={primaryButton} onClick={saveReport} disabled={busy || !form.unitId || !form.title.trim() || !form.activityType.trim() || !form.eventForm.trim() || !form.startsAt} data-testid="button-save-report"><Save className="h-4 w-4" /> {busy ? "Menyimpan…" : "Simpan draf"}</button>
        </div>
        <div className="grid lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-700 p-3 lg:flex-col lg:border-b-0 lg:border-r" aria-label="Bagian laporan">
            {(["overview", "people"] as Section[]).map((key) => <button key={key} onClick={() => setActiveSection(key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${activeSection === key ? "bg-sky-300/10 font-semibold text-sky-200" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`} data-testid={`tab-editor-${key}`}>{key === "overview" ? "Rincian kegiatan" : "Personel & rundown"}</button>)}
          </nav>
          <div className="p-4 md:p-6">
            {activeSection === "overview" ? <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Unit pelapor" required><select className={field} value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} data-testid="select-report-unit"><option value="">Pilih unit</option>{availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
                <Field label="Judul kegiatan" required><input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={240} data-testid="input-report-title" /></Field>
                <Field label="Jenis kegiatan" required><input className={field} value={form.activityType} onChange={(e) => setForm({ ...form, activityType: e.target.value })} maxLength={80} placeholder="Seminar, lokakarya…" data-testid="input-report-type" /></Field>
                <Field label="Klasifikasi"><select className={field} value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value as FormState["classification"] })} data-testid="select-report-classification"><option value="general">Umum</option><option value="special">Khusus</option></select></Field>
                <Field label="Bentuk kegiatan" required><input className={field} value={form.eventForm} onChange={(e) => setForm({ ...form, eventForm: e.target.value })} maxLength={120} placeholder="Seminar nasional…" data-testid="input-report-form" /></Field>
                <Field label="Metode pelaksanaan"><select className={field} value={form.deliveryMode} onChange={(e) => setForm({ ...form, deliveryMode: e.target.value as FormState["deliveryMode"] })} data-testid="select-report-mode"><option value="offline">Luring</option><option value="online">Daring</option><option value="hybrid">Hibrida</option></select></Field>
                <Field label="Tingkat"><select className={field} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as FormState["level"] })} data-testid="select-report-level"><option value="national">Nasional</option><option value="international">Internasional</option></select></Field>
                <Field label="Waktu mulai" required><input type="datetime-local" className={field} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} data-testid="input-report-start" /></Field>
                <Field label="Waktu selesai"><input type="datetime-local" className={field} value={form.endsAt ?? ""} onChange={(e) => setForm({ ...form, endsAt: e.target.value || null })} data-testid="input-report-end" /></Field>
                <Field label="Lokasi"><input className={field} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={500} data-testid="input-report-location" /></Field>
                <Field label="Penanggung jawab"><input className={field} value={form.responsibleName} onChange={(e) => setForm({ ...form, responsibleName: e.target.value })} maxLength={180} data-testid="input-report-responsible" /></Field>
                <Field label="Hubungkan kegiatan LMS PUB (opsional)">
                  <select className={field} value={form.sourceActivityId ?? ""} onChange={(e) => selectSourceActivity(e.target.value)} data-testid="select-report-source-activity">
                    <option value="">Tidak ditautkan</option>
                    {sourceActivitiesLoading && <option disabled value="__loading">Memuat kegiatan LMS…</option>}
                    {form.sourceActivityId && !sourceActivities.some((activity) => activity.id === form.sourceActivityId) && <option value={form.sourceActivityId}>Referensi tersimpan ({form.sourceActivityId.slice(0, 8)}…)</option>}
                    {sourceActivities.map((activity) => <option key={activity.id} value={activity.id}>{activity.title} · {displayDate(activity.start_at)}</option>)}
                  </select>
                  <span className="mt-1 block text-[11px] text-slate-500">Memilih kegiatan mengisi judul, jenis, waktu, lokasi, dan latar belakang sebagai titik awal; periksa kembali sebelum simpan.</span>
                  {sourceActivitiesError && <span className="mt-1 block text-[11px] text-amber-200">Daftar kegiatan LMS belum tersedia. Tautan tetap opsional; coba muat ulang halaman.</span>}
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Latar belakang"><textarea className={`${field} min-h-28 resize-y`} value={form.background} onChange={(e) => setForm({ ...form, background: e.target.value })} maxLength={6000} data-testid="textarea-report-background" /></Field>
                <Field label="Dasar hukum"><textarea className={`${field} min-h-28 resize-y`} value={form.legalBasis} onChange={(e) => setForm({ ...form, legalBasis: e.target.value })} maxLength={3000} data-testid="textarea-report-legal-basis" /></Field>
                <Field label="Tujuan"><textarea className={`${field} min-h-24 resize-y`} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} maxLength={3000} data-testid="textarea-report-purpose" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Sasaran peserta"><textarea className={`${field} min-h-24 resize-y`} value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} maxLength={1000} data-testid="textarea-report-audience" /></Field>
                  <Field label="Kualifikasi / grade"><textarea className={`${field} min-h-24 resize-y`} value={form.targetQualification} onChange={(e) => setForm({ ...form, targetQualification: e.target.value })} maxLength={500} data-testid="textarea-report-qualification" /></Field>
                </div>
                <Field label="Rekomendasi"><textarea className={`${field} min-h-24 resize-y`} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} maxLength={6000} data-testid="textarea-report-recommendations" /></Field>
                <Field label="Tindak lanjut"><textarea className={`${field} min-h-24 resize-y`} value={form.followUp} onChange={(e) => setForm({ ...form, followUp: e.target.value })} maxLength={6000} data-testid="textarea-report-follow-up" /></Field>
                <Field label="Penutup"><textarea className={`${field} min-h-20 resize-y`} value={form.closing} onChange={(e) => setForm({ ...form, closing: e.target.value })} maxLength={3000} data-testid="textarea-report-closing" /></Field>
                <Field label="Grade kinerja sasaran"><input className={field} value={form.targetPerformanceGrade ?? ""} onChange={(e) => setForm({ ...form, targetPerformanceGrade: e.target.value || null })} maxLength={40} data-testid="input-report-target-grade" /></Field>
              </div>
            </div> : <div className="space-y-8">
              <section>
                <div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold">Personel kegiatan</h3><p className="mt-1 text-xs text-slate-500">Panitia, pembicara, dan penanggung jawab.</p></div><button className={secondaryButton} onClick={() => setForm({ ...form, committee: [...form.committee, { name: "", affiliation: "", role: "committee", topic: "", hours: null }] })} data-testid="button-add-committee"><Plus className="h-4 w-4" /> Tambah personel</button></div>
                {form.committee.length === 0 && <EmptyInline text="Belum ada personel yang dicatat." />}
                <div className="space-y-3">{form.committee.map((person, index) => <div className="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_100px_40px]" key={index}>
                  <input aria-label="Nama personel" className={field} placeholder="Nama" value={person.name} onChange={(e) => updatePerson(setForm, form, index, "name", e.target.value)} data-testid={`input-committee-name-${index}`} />
                  <input aria-label="Afiliasi" className={field} placeholder="Afiliasi" value={person.affiliation} onChange={(e) => updatePerson(setForm, form, index, "affiliation", e.target.value)} data-testid={`input-committee-affiliation-${index}`} />
                  <select aria-label="Peran" className={field} value={person.role} onChange={(e) => updatePerson(setForm, form, index, "role", e.target.value as PubReportPerson["role"])} data-testid={`select-committee-role-${index}`}><option value="committee">Panitia</option><option value="speaker">Pembicara</option><option value="responsible">Penanggung jawab</option></select>
                  <input aria-label="Topik" className={field} placeholder="Topik" value={person.topic} onChange={(e) => updatePerson(setForm, form, index, "topic", e.target.value)} data-testid={`input-committee-topic-${index}`} />
                  <input aria-label="Jam tugas" type="number" min="0" max="100" className={field} placeholder="Jam" value={person.hours ?? ""} onChange={(e) => updatePerson(setForm, form, index, "hours", e.target.value === "" ? null : Number(e.target.value))} data-testid={`input-committee-hours-${index}`} />
                  <button className={subtleButton} aria-label="Hapus personel" onClick={() => setForm({ ...form, committee: form.committee.filter((_, i) => i !== index) })} data-testid={`button-remove-committee-${index}`}><Trash2 className="h-4 w-4" /></button>
                </div>)}</div>
              </section>
              <section>
                <div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold">Rundown kegiatan</h3><p className="mt-1 text-xs text-slate-500">Susunan waktu, sesi, dan pemateri.</p></div><button className={secondaryButton} onClick={() => setForm({ ...form, rundown: [...form.rundown, { startsAt: "", endsAt: "", activity: "", speaker: "", notes: "" }] })} data-testid="button-add-rundown"><Plus className="h-4 w-4" /> Tambah sesi</button></div>
                {form.rundown.length === 0 && <EmptyInline text="Belum ada sesi rundown." />}
                <div className="space-y-3">{form.rundown.map((item, index) => <div className="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 md:grid-cols-[120px_120px_1.2fr_1fr_1fr_40px]" key={index}>
                  <input aria-label="Mulai sesi" className={field} placeholder="Mulai" value={item.startsAt} onChange={(e) => updateRundown(setForm, form, index, "startsAt", e.target.value)} data-testid={`input-rundown-start-${index}`} />
                  <input aria-label="Selesai sesi" className={field} placeholder="Selesai" value={item.endsAt} onChange={(e) => updateRundown(setForm, form, index, "endsAt", e.target.value)} data-testid={`input-rundown-end-${index}`} />
                  <input aria-label="Nama kegiatan sesi" className={field} placeholder="Kegiatan" value={item.activity} onChange={(e) => updateRundown(setForm, form, index, "activity", e.target.value)} data-testid={`input-rundown-activity-${index}`} />
                  <input aria-label="Pembicara sesi" className={field} placeholder="Pembicara" value={item.speaker} onChange={(e) => updateRundown(setForm, form, index, "speaker", e.target.value)} data-testid={`input-rundown-speaker-${index}`} />
                  <input aria-label="Catatan sesi" className={field} placeholder="Catatan" value={item.notes} onChange={(e) => updateRundown(setForm, form, index, "notes", e.target.value)} data-testid={`input-rundown-notes-${index}`} />
                  <button className={subtleButton} aria-label="Hapus sesi" onClick={() => setForm({ ...form, rundown: form.rundown.filter((_, i) => i !== index) })} data-testid={`button-remove-rundown-${index}`}><Trash2 className="h-4 w-4" /></button>
                </div>)}</div>
              </section>
            </div>}
          </div>
        </div>
      </section> : <div className="grid gap-5 xl:grid-cols-[minmax(330px,0.8fr)_minmax(0,1.55fr)]">
        <section className={`${panel} min-h-[420px] overflow-hidden`}>
          <div className="border-b border-slate-700 p-4">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Daftar laporan</h2><p className="mt-1 text-xs text-slate-500">{filteredReports.length} laporan ditampilkan</p></div><span className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300" data-testid="text-report-count">{reports.length} total</span></div>
            <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
              <input className={field + " mt-0"} placeholder="Cari judul, unit, jenis…" value={queryText} onChange={(e) => setQueryText(e.target.value)} aria-label="Cari laporan" data-testid="input-search-reports" />
              <select className={field + " mt-0"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter status" data-testid="select-filter-status">
                <option value="all">Semua status</option><option value="draft">Draf</option><option value="submitted">Menunggu review</option><option value="needs_revision">Perlu revisi</option><option value="ready_to_upload">Siap diunggah</option><option value="uploaded">Tercatat diunggah</option>
              </select>
            </div>
          </div>
          {listQuery.isLoading ? <div className="space-y-2 p-4"><div className="h-20 animate-pulse rounded-lg bg-slate-800" /><div className="h-20 animate-pulse rounded-lg bg-slate-800/70" /></div> :
            filteredReports.length === 0 ? <div className="px-6 py-14 text-center" data-testid="empty-pub-reports"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border border-slate-700 bg-slate-900 text-slate-400"><FileText className="h-5 w-5" /></div><h3 className="font-semibold">{reports.length ? "Tidak ada hasil yang cocok" : "Belum ada laporan"}</h3><p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">{reports.length ? "Ubah pencarian atau filter status." : "Laporan yang dibuat unit Anda akan muncul di sini."}</p></div> :
              <div className="max-h-[660px] space-y-1 overflow-auto p-2">{filteredReports.map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setEditing(false); setActiveSection("overview"); }} className={`w-full rounded-lg border p-3 text-left transition ${selectedId === item.id ? "border-sky-300/40 bg-sky-300/[0.08]" : "border-transparent hover:border-slate-700 hover:bg-slate-900"}`} data-testid={`row-report-${item.id}`}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{item.title}</p><p className="mt-1 truncate text-xs text-slate-400">{item.unitName} · {item.activityType}</p></div><ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${selectedId === item.id ? "text-sky-300" : "text-slate-600"}`} /></div>
                <div className="mt-3 flex items-center justify-between gap-3"><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.status)}`}>{statusLabel(item.status)}</span><span className="text-[11px] text-slate-500">{displayDate(item.updatedAt)}</span></div>
              </button>)}</div>}
        </section>
        <section className={`${panel} min-h-[420px] overflow-hidden`}>
          {!selectedId ? <div className="grid min-h-[420px] place-items-center p-8 text-center" data-testid="empty-report-selection">
            <div className="max-w-sm"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-sky-300"><FileText className="h-5 w-5" /></div><h2 className="text-lg font-semibold">Pilih laporan untuk ditinjau</h2><p className="mt-2 text-sm leading-6 text-slate-400">Rincian kegiatan, verifikasi peserta, dokumen, dan jejak perubahan akan tampil di panel ini.</p></div>
          </div> : reportQuery.isLoading ? <div className="p-5"><Skeleton /></div> : reportQuery.isError || !detail ? <div className="p-8 text-center" role="alert" data-testid="error-report-detail"><AlertCircle className="mx-auto mb-3 h-6 w-6 text-amber-300" /><h2 className="font-semibold">Rincian laporan gagal dimuat</h2><button className={`${secondaryButton} mt-4`} onClick={() => void reportQuery.refetch()} data-testid="button-retry-report-detail">Coba lagi</button></div> :
            <ReportDetail
              report={detail.report}
              participants={detail.participants}
              attachments={detail.attachments}
              history={detail.history}
              sections={activeSection}
              setSection={setActiveSection}
              canEdit={canEdit}
              canReview={Boolean(canReview)}
              isCentralReviewer={Boolean(access.canReviewAll)}
              busy={busy}
              onEdit={openEdit}
              onSubmit={() => submitMutation.mutate({ id: detail.report.id, data: { expectedRevision: detail.report.revision } }, { onSuccess: () => void invalidateReports(detail.report.id) })}
              reviewNote={reviewNote}
              setReviewNote={setReviewNote}
              onReview={(action) => reviewMutation.mutate({ id: detail.report.id, data: { action, note: reviewNote.trim(), expectedRevision: detail.report.revision } }, { onSuccess: () => { setReviewNote(""); void invalidateReports(detail.report.id); } })}
              uploadReference={uploadReference}
              setUploadReference={setUploadReference}
              onUpload={() => uploadMutation.mutate({ id: detail.report.id, data: { reference: uploadReference.trim(), expectedRevision: detail.report.revision } }, { onSuccess: () => { setUploadReference(""); void invalidateReports(detail.report.id); } })}
              participantForm={participantForm}
              setParticipantForm={setParticipantForm}
              onAddParticipant={() => addParticipantMutation.mutate({ id: detail.report.id, data: participantForm }, { onSuccess: () => { setParticipantForm({ fullName: "", companyName: "", qualification: "", performanceGrade: null, participantRole: "bujk" }); void invalidateReports(detail.report.id); } })}
              onAttendance={(participant, attendanceStatus) => updateParticipantMutation.mutate({ id: detail.report.id, participantId: participant.id, data: { attendanceStatus, attendanceNote: attendanceNotes[participant.id] ?? participant.attendanceNote, expectedRevision: participant.revision } }, { onSuccess: () => void invalidateReports(detail.report.id) })}
              attendanceNotes={attendanceNotes}
              setAttendanceNotes={setAttendanceNotes}
              onRemoveParticipant={(participantId) => { if (window.confirm("Hapus peserta ini dari laporan?")) removeParticipantMutation.mutate({ id: detail.report.id, participantId }, { onSuccess: () => void invalidateReports(detail.report.id) }); }}
              onAddAttachment={() => setShowVault(true)}
              onRemoveAttachment={(attachmentId) => { if (window.confirm("Lepaskan dokumen ini dari laporan? Dokumen asli tetap berada di Ruang Simpan.")) removeAttachmentMutation.mutate({ id: detail.report.id, attachmentId }, { onSuccess: () => void invalidateReports(detail.report.id) }); }}
              onDownloadAttachment={(attachmentId) => void downloadPubReportAttachment(detail.report.id, attachmentId).then((blob) => {
                const file = detail.attachments.find((item) => item.id === attachmentId);
                if (file) downloadBlob(blob, file.fileName);
              }).catch(() => window.alert("Dokumen tidak dapat diunduh. Periksa sesi Ruang Simpan dan coba lagi."))}
              onExport={async (kind) => {
                setExporting(true);
                try {
                  if (kind === "pdf") downloadBlob(makePdf(detail.report, detail.participants, detail.attachments), `${cleanName(detail.report.title)}.pdf`);
                  if (kind === "xlsx") downloadBlob(new Blob([makeWorkbook(detail.report, detail.participants.map((person) => ({
                    Nama: person.fullName, Perusahaan: person.companyName, Kualifikasi: person.qualification,
                    Grade: person.performanceGrade ?? "", Peran: person.participantRole,
                    Kehadiran: person.attendanceStatus, Catatan: person.attendanceNote,
                  })))], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${cleanName(detail.report.title)}.xlsx`);
                  if (kind === "zip") {
                    const files: Record<string, Uint8Array> = Object.create(null) as Record<string, Uint8Array>;
                    files["laporan.pdf"] = new Uint8Array(await makePdf(detail.report, detail.participants, detail.attachments).arrayBuffer());
                    files["rekap.xlsx"] = new Uint8Array(makeWorkbook(detail.report, detail.participants.map((person) => ({
                      Nama: person.fullName, Perusahaan: person.companyName, Kualifikasi: person.qualification,
                      Grade: person.performanceGrade ?? "", Peran: person.participantRole, Kehadiran: person.attendanceStatus,
                      Catatan: person.attendanceNote,
                    }))));
                    files["laporan.json"] = new TextEncoder().encode(JSON.stringify(detail, null, 2));
                    for (const attachment of detail.attachments) {
                      const blob = await downloadPubReportAttachment(detail.report.id, attachment.id);
                      files[`dokumen/${cleanName(attachment.category)}-${safeArchiveName(attachment.fileName)}-${attachment.id.slice(0, 8)}`] = new Uint8Array(await blob.arrayBuffer());
                    }
                    const archive = zipSync(files, { level: 0 });
                    downloadBlob(new Blob([new Uint8Array(archive).buffer as ArrayBuffer], { type: "application/zip" }), `${cleanName(detail.report.title)}-paket.zip`);
                  }
                } catch {
                  window.alert("Paket belum dapat dibuat. Pastikan sesi aktif dan coba lagi.");
                } finally { setExporting(false); }
              }}
              exporting={exporting}
            />}
        </section>
      </div>}

      {access.canManageUnits && <UnitSetup units={units} onCreated={async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListPubReportUnitsQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetPubReportAccessQueryKey() }),
        ]);
      }} />}

      {showVault && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 md:p-6" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowVault(false); }}>
        <section className="max-h-[90dvh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-600 bg-[#101a28] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="vault-title" data-testid="dialog-vault-picker">
          <header className="flex items-center justify-between border-b border-slate-700 p-4"><div><h2 id="vault-title" className="font-semibold">Pilih dokumen Ruang Simpan</h2><p className="mt-1 text-xs text-slate-400">Dokumen asli tetap di Ruang Simpan; akses dibagikan hanya kepada reviewer berwenang.</p></div><button className={subtleButton} onClick={() => setShowVault(false)} aria-label="Tutup pemilih dokumen" data-testid="button-close-vault"><X className="h-5 w-5" /></button></header>
          <div className="grid gap-3 p-4 sm:grid-cols-[1fr_190px]"><input className={field + " mt-0"} placeholder="Cari dokumen…" value={vaultSearch} onChange={(e) => setVaultSearch(e.target.value)} aria-label="Cari dokumen" data-testid="input-search-vault" />
            <select className={field + " mt-0"} value={attachmentCategory} onChange={(e) => setAttachmentCategory(e.target.value as PubReportAttachmentCategory)} aria-label="Kategori lampiran" data-testid="select-attachment-category">{categoryOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
          <div className="max-h-[55dvh] overflow-auto px-4 pb-4">
            {vaultQuery.isLoading ? <div className="space-y-2"><div className="h-16 animate-pulse rounded bg-slate-800" /><div className="h-16 animate-pulse rounded bg-slate-800/70" /></div> :
              vaultQuery.isError ? <div className="rounded-lg border border-amber-400/30 bg-amber-300/10 p-4 text-sm text-amber-100" role="alert">Workspace Ruang Simpan tidak dapat diakses. Pastikan sesi Ruang Simpan yang sedang aktif, lalu coba lagi. <button className="ml-2 underline" onClick={() => void vaultQuery.refetch()} data-testid="button-retry-vault">Coba lagi</button></div> :
                vaultDocuments.length === 0 ? <EmptyInline text={vaultQuery.data?.documents.length ? "Tidak ada dokumen yang cocok dengan pencarian." : "Tidak ada dokumen yang tersedia di workspace ini."} /> :
                  <div className="space-y-2">{vaultDocuments.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3" data-testid={`row-vault-document-${document.id}`}>
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{document.name}</p><p className="mt-1 text-xs text-slate-500">{document.type || "Dokumen"} · {document.status}</p></div>
                    <button className={secondaryButton} disabled={busy || Boolean(detail?.attachments.some((attachment) => attachment.documentId === document.id)) || !selectedId} onClick={() => {
                      if (!selectedId) return;
                      addAttachmentMutation.mutate({ id: selectedId, data: { category: attachmentCategory, documentId: document.id } }, { onSuccess: async () => { await invalidateReports(selectedId); setShowVault(false); } });
                    }} data-testid={`button-attach-document-${document.id}`}>
                      {detail?.attachments.some((attachment) => attachment.documentId === document.id) ? <><Check className="h-4 w-4" /> Terlampir</> : "Lampirkan"}
                    </button>
                  </div>)}</div>}
          </div>
        </section>
      </div>}
    </div>
  </main>;
}

const categoryOptions: Array<[PubReportAttachmentCategory, string]> = [
  ["invitation", "Undangan"], ["kak", "KAK"], ["attendance_list", "Daftar hadir"],
  ["documentation", "Dokumentasi"], ["recording", "Rekaman"], ["materials", "Materi"],
  ["upload_proof", "Bukti unggah"], ["other", "Lainnya"],
];

function updatePerson<K extends keyof PubReportPerson>(
  setForm: (value: FormState) => void, form: FormState, index: number, key: K, value: PubReportPerson[K],
) {
  setForm({ ...form, committee: form.committee.map((person, i) => i === index ? { ...person, [key]: value } : person) });
}

function updateRundown<K extends keyof PubReportAgendaItem>(
  setForm: (value: FormState) => void, form: FormState, index: number, key: K, value: PubReportAgendaItem[K],
) {
  setForm({ ...form, rundown: form.rundown.map((item, i) => i === index ? { ...item, [key]: value } : item) });
}

function Field({ label: title, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block"><span className={label}>{title}{required && <span className="ml-1 text-sky-300">*</span>}</span>{children}</label>;
}

function EmptyInline({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-500" data-testid="empty-inline">{text}</div>;
}

function ReportDetail(props: {
  report: PubReport;
  participants: PubReportParticipant[];
  attachments: Array<{ id: string; category: PubReportAttachmentCategory; documentId: string; fileName: string; createdAt: string }>;
  history: Array<{ id: string; actorId: string; action: string; detail: Record<string, unknown>; createdAt: string }>;
  sections: Section;
  setSection: (section: Section) => void;
  canEdit: boolean;
  canReview: boolean;
  isCentralReviewer: boolean;
  busy: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  reviewNote: string;
  setReviewNote: (value: string) => void;
  onReview: (action: "approve" | "return") => void;
  uploadReference: string;
  setUploadReference: (value: string) => void;
  onUpload: () => void;
  participantForm: PubReportParticipantInput;
  setParticipantForm: (form: PubReportParticipantInput) => void;
  onAddParticipant: () => void;
  onAttendance: (participant: PubReportParticipant, status: "verified" | "needs_correction") => void;
  attendanceNotes: Record<string, string>;
  setAttendanceNotes: (value: Record<string, string>) => void;
  onRemoveParticipant: (id: string) => void;
  onAddAttachment: () => void;
  onRemoveAttachment: (id: string) => void;
  onDownloadAttachment: (id: string) => void;
  onExport: (kind: "pdf" | "xlsx" | "zip") => void;
  exporting: boolean;
}) {
  const { report, participants, attachments, history } = props;
  const estimatedDeadline = estimatePubReportDeadline(report.endsAt ?? report.startsAt);
  const tabs: Array<[Section, string]> = [["overview", "Ringkasan"], ["participants", `Peserta (${participants.length})`], ["evidence", `Bukti (${attachments.length})`], ["history", "Riwayat"]];
  return <div>
    <header className="border-b border-slate-700 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(report.status)}`} data-testid={`status-report-${report.id}`}>{statusLabel(report.status)}</span><span className="text-xs text-slate-500">Revisi {report.revision}</span></div>
          <h2 className="max-w-3xl text-xl font-bold leading-snug md:text-2xl" data-testid={`text-report-title-${report.id}`}>{report.title}</h2>
          <p className="mt-2 text-sm text-slate-400">{report.unitName} <span className="mx-1 text-slate-600">/</span> {report.activityType} <span className="mx-1 text-slate-600">/</span> Diperbarui {displayDate(report.updatedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {props.canEdit && <button className={secondaryButton} onClick={props.onEdit} data-testid="button-edit-report">Ubah laporan</button>}
          {props.canEdit && report.status !== "submitted" && <button className={primaryButton} disabled={props.busy || report.status === "uploaded"} onClick={props.onSubmit} data-testid="button-submit-report"><Send className="h-4 w-4" /> Kirim untuk review</button>}
        </div>
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto" aria-label="Rincian laporan">
        {tabs.map(([id, name]) => <button key={id} className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold ${props.sections === id ? "border-sky-300 text-sky-200" : "border-transparent text-slate-500 hover:text-slate-200"}`} onClick={() => props.setSection(id)} data-testid={`tab-report-${id}`}>{name}</button>)}
        {props.canEdit && <button className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-200" onClick={() => { props.setSection("overview"); props.onEdit(); }} data-testid="button-edit-personnel-tab">Personel & rundown</button>}
      </nav>
    </header>
    <div className="p-4 md:p-6">
      {props.sections === "overview" && <div className="space-y-5">
        {report.reviewNote && <div className="rounded-lg border border-amber-300/30 bg-amber-300/[0.08] p-4" data-testid="text-review-note"><p className="text-xs font-bold uppercase tracking-wider text-amber-200">Catatan review</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{report.reviewNote}</p></div>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<CalendarDays className="h-4 w-4" />} title="Waktu pelaksanaan" value={displayDate(report.startsAt)} />
          <Metric icon={<Clock3 className="h-4 w-4" />} title="Selesai" value={displayDate(report.endsAt)} />
          <Metric icon={<Users className="h-4 w-4" />} title="Peserta tercatat" value={`${participants.length} nama · kehadiran dicatat manual`} />
          <Metric icon={<FileText className="h-4 w-4" />} title="Dokumen terhubung" value={`${attachments.length} file dari Ruang Simpan`} />
          <Metric icon={<CalendarDays className="h-4 w-4" />} title="Estimasi batas lapor" value={estimatedDeadline ? displayDate(estimatedDeadline.toISOString()) : "Tidak tersedia"} />
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-xs leading-5 text-slate-400"><CircleHelp className="mr-1 inline h-3.5 w-3.5 text-sky-300" /> Estimasi memakai 14 hari kerja setelah kegiatan dan tidak menghitung hari libur nasional; cocokkan dengan pedoman resmi sebelum pengiriman. Status di sini adalah status internal PUB, bukan persetujuan LPJK.</div>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="Pelaksanaan" rows={[["Kegiatan sumber LMS", report.sourceActivityId || "Tidak ditautkan"], ["Bentuk", report.eventForm], ["Metode", report.deliveryMode], ["Tingkat", report.level], ["Klasifikasi", report.classification], ["Lokasi", report.location], ["Penanggung jawab", report.responsibleName]]} />
          <InfoBlock title="Sasaran" rows={[["Peserta", report.targetAudience], ["Kualifikasi", report.targetQualification], ["Grade kinerja", report.targetPerformanceGrade]]} />
          <InfoBlock title="Latar belakang" body={report.background} />
          <InfoBlock title="Dasar hukum" body={report.legalBasis} />
          <InfoBlock title="Tujuan" body={report.purpose} />
          <InfoBlock title="Rekomendasi & tindak lanjut" body={[report.recommendations, report.followUp].filter(Boolean).join("\n\n") || "—"} />
          <InfoBlock title="Penutup" body={report.closing} />
          <InfoBlock title="Rundown" body={report.rundown.length ? report.rundown.map((row) => `${row.startsAt}–${row.endsAt}  ${row.activity}${row.speaker ? ` · ${row.speaker}` : ""}${row.notes ? `\n${row.notes}` : ""}`).join("\n\n") : "Belum ada rundown."} />
          <InfoBlock title="Personel" body={report.committee.length ? report.committee.map((person) => `${person.name} · ${person.role}${person.affiliation ? ` · ${person.affiliation}` : ""}${person.topic ? ` · ${person.topic}` : ""}`).join("\n") : "Belum ada personel."} />
        </div>
        <section className="border-t border-slate-700 pt-5">
          <div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold">Ekspor laporan</h3><p className="mt-1 text-xs text-slate-500">Paket ZIP menyertakan PDF, XLSX, JSON, dan dokumen tertaut yang dapat diakses.</p></div></div>
          <div className="flex flex-wrap gap-2">
            <button className={secondaryButton} disabled={props.exporting} onClick={() => props.onExport("pdf")} data-testid="button-export-pdf"><FileText className="h-4 w-4" /> PDF</button>
            <button className={secondaryButton} disabled={props.exporting} onClick={() => props.onExport("xlsx")} data-testid="button-export-xlsx"><FileSpreadsheet className="h-4 w-4" /> XLSX</button>
            <button className={secondaryButton} disabled={props.exporting} onClick={() => props.onExport("zip")} data-testid="button-export-zip"><FileArchive className="h-4 w-4" /> {props.exporting ? "Menyusun paket…" : "Paket ZIP"}</button>
          </div>
        </section>
        {props.canReview && <section className="rounded-lg border border-sky-300/25 bg-sky-300/[0.05] p-4" data-testid="panel-central-review">
          <div className="mb-3"><h3 className="font-semibold">Pemeriksaan pusat</h3><p className="mt-1 text-xs leading-5 text-slate-400">Setujui untuk tahap unggah internal atau kembalikan dengan catatan yang dapat ditindaklanjuti.</p></div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Catatan review <span className="text-amber-300">wajib saat pengembalian</span><textarea className={`${field} min-h-24 resize-y`} value={props.reviewNote} onChange={(e) => props.setReviewNote(e.target.value)} maxLength={3000} data-testid="textarea-review-note" /></label>
          <div className="mt-3 flex flex-wrap gap-2"><button className={secondaryButton} disabled={props.busy || !props.reviewNote.trim()} onClick={() => props.onReview("return")} data-testid="button-return-report">Kembalikan untuk revisi</button><button className={primaryButton} disabled={props.busy} onClick={() => props.onReview("approve")} data-testid="button-approve-report"><Check className="h-4 w-4" /> Setujui internal</button></div>
        </section>}
        {report.status === "ready_to_upload" && props.isCentralReviewer && <section className="rounded-lg border border-emerald-300/25 bg-emerald-300/[0.05] p-4" data-testid="panel-manual-upload">
          <h3 className="font-semibold">Catat unggah manual</h3><p className="mt-1 text-xs leading-5 text-slate-400">Hanya log internal untuk unggah yang dilakukan di luar sistem. Ini bukan konfirmasi penerimaan atau persetujuan LPJK.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input className={field + " mt-0"} placeholder="Nomor referensi / catatan unggah" value={props.uploadReference} onChange={(e) => props.setUploadReference(e.target.value)} minLength={2} maxLength={500} data-testid="input-upload-reference" /><button className={primaryButton} disabled={props.busy || props.uploadReference.trim().length < 2} onClick={props.onUpload} data-testid="button-mark-uploaded"><Check className="h-4 w-4" /> Simpan log unggah</button></div>
        </section>}
      </div>}

      {props.sections === "participants" && <div className="space-y-5">
        <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
          <h3 className="font-semibold">Tambah peserta</h3><p className="mt-1 text-xs text-slate-500">Status kehadiran dimulai sebagai belum diverifikasi dan harus diperiksa manual.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <input className={field} placeholder="Nama lengkap *" value={props.participantForm.fullName} onChange={(e) => props.setParticipantForm({ ...props.participantForm, fullName: e.target.value })} data-testid="input-participant-name" />
            <input className={field} placeholder="Perusahaan" value={props.participantForm.companyName} onChange={(e) => props.setParticipantForm({ ...props.participantForm, companyName: e.target.value })} data-testid="input-participant-company" />
            <input className={field} placeholder="Kualifikasi" value={props.participantForm.qualification} onChange={(e) => props.setParticipantForm({ ...props.participantForm, qualification: e.target.value })} data-testid="input-participant-qualification" />
            <input className={field} placeholder="Grade kinerja" value={props.participantForm.performanceGrade ?? ""} onChange={(e) => props.setParticipantForm({ ...props.participantForm, performanceGrade: e.target.value || null })} data-testid="input-participant-grade" />
            <div className="flex gap-2"><select className={field + " mt-0 min-w-0"} value={props.participantForm.participantRole} onChange={(e) => props.setParticipantForm({ ...props.participantForm, participantRole: e.target.value as PubReportParticipantInput["participantRole"] })} data-testid="select-participant-role" disabled={!props.canEdit}><option value="bujk">BUJK</option><option value="association">Asosiasi</option><option value="speaker">Pembicara</option><option value="organizer">Penyelenggara</option><option value="other">Lainnya</option></select><button className={primaryButton} disabled={!props.canEdit || props.busy || props.participantForm.fullName.trim().length < 2} onClick={props.onAddParticipant} aria-label="Tambah peserta" data-testid="button-add-participant"><Plus className="h-4 w-4" /></button></div>
          </div>
        </section>
        {participants.length === 0 ? <EmptyInline text="Belum ada peserta. Tambahkan data peserta di atas." /> :
          <div className="overflow-x-auto rounded-lg border border-slate-700"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="p-3">Nama / perusahaan</th><th className="p-3">Kualifikasi</th><th className="p-3">Peran</th><th className="p-3">Kehadiran manual</th><th className="p-3">Catatan & aksi</th></tr></thead><tbody className="divide-y divide-slate-800">{participants.map((person) => <tr key={person.id} data-testid={`row-participant-${person.id}`}>
            <td className="p-3"><p className="font-medium">{person.fullName}</p><p className="mt-1 text-xs text-slate-500">{person.companyName || "Perusahaan tidak dicantumkan"}</p></td>
            <td className="p-3 text-slate-300">{person.qualification || "—"}{person.performanceGrade && <p className="mt-1 text-xs text-slate-500">Grade {person.performanceGrade}</p>}</td>
            <td className="p-3 capitalize text-slate-300">{person.participantRole}</td>
            <td className="p-3"><span className={`rounded-full border px-2 py-1 text-[11px] ${person.attendanceStatus === "verified" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : person.attendanceStatus === "needs_correction" ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : "border-slate-600 bg-slate-800 text-slate-300"}`}>{person.attendanceStatus === "verified" ? "Terverifikasi manual" : person.attendanceStatus === "needs_correction" ? "Perlu koreksi" : "Menunggu verifikasi"}</span></td>
            <td className="p-3"><div className="flex min-w-[250px] items-center gap-2"><input aria-label={`Catatan kehadiran ${person.fullName}`} className={field + " mt-0"} value={props.attendanceNotes[person.id] ?? person.attendanceNote} onChange={(e) => props.setAttendanceNotes({ ...props.attendanceNotes, [person.id]: e.target.value })} placeholder="Catatan pemeriksaan" data-testid={`input-attendance-note-${person.id}`} />
              <button className={subtleButton} title="Tandai terverifikasi" onClick={() => props.onAttendance(person, "verified")} disabled={!props.canEdit || props.busy} data-testid={`button-verify-attendance-${person.id}`}><Check className="h-4 w-4 text-emerald-300" /></button>
              <button className={subtleButton} title="Perlu koreksi" onClick={() => props.onAttendance(person, "needs_correction")} disabled={!props.canEdit || props.busy || !(props.attendanceNotes[person.id] ?? person.attendanceNote).trim()} data-testid={`button-correct-attendance-${person.id}`}>Koreksi</button>
              {props.canEdit && <button className={subtleButton} title="Hapus peserta" onClick={() => props.onRemoveParticipant(person.id)} disabled={props.busy} data-testid={`button-remove-participant-${person.id}`}><Trash2 className="h-4 w-4 text-slate-400" /></button>}</div></td>
          </tr>)}</tbody></table></div>}
      </div>}

      {props.sections === "evidence" && <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Dokumen pendukung</h3><p className="mt-1 text-xs text-slate-500">Lampirkan dokumen yang sudah tersimpan di Ruang Simpan.</p></div>{props.canEdit && <button className={secondaryButton} onClick={props.onAddAttachment} data-testid="button-open-vault-picker"><Plus className="h-4 w-4" /> Pilih dari Ruang Simpan</button>}</div>
        <div className="rounded-lg border border-sky-300/20 bg-sky-300/[0.04] p-3 text-xs leading-5 text-slate-400">File tidak diduplikasi atau diunggah ulang. Dokumen tetap berada di Ruang Simpan; backend membagikan akses hanya kepada reviewer laporan yang berwenang.</div>
        {attachments.length === 0 ? <EmptyInline text="Belum ada dokumen pendukung yang ditautkan." /> :
          <div className="divide-y divide-slate-800 rounded-lg border border-slate-700">{attachments.map((attachment) => <div key={attachment.id} className="flex flex-wrap items-center justify-between gap-3 p-3" data-testid={`row-attachment-${attachment.id}`}>
            <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-800 text-sky-300"><FileText className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-medium">{attachment.fileName}</p><p className="mt-1 text-xs text-slate-500">{categoryOptions.find(([key]) => key === attachment.category)?.[1] ?? attachment.category} · ditautkan {displayDate(attachment.createdAt)}</p></div></div>
            <div className="flex gap-1"><button className={secondaryButton} onClick={() => props.onDownloadAttachment(attachment.id)} data-testid={`button-download-attachment-${attachment.id}`}><ArrowDownToLine className="h-4 w-4" /> Unduh</button>{props.canEdit && <button className={subtleButton} onClick={() => props.onRemoveAttachment(attachment.id)} data-testid={`button-remove-attachment-${attachment.id}`}><X className="h-4 w-4" /><span className="sr-only">Lepaskan</span></button>}</div>
          </div>)}</div>}
      </div>}

      {props.sections === "history" && <div>
        <div className="mb-4 flex items-center gap-2"><History className="h-4 w-4 text-sky-300" /><div><h3 className="font-semibold">Riwayat perubahan</h3><p className="mt-1 text-xs text-slate-500">Catatan audit yang disediakan oleh layanan.</p></div></div>
        {history.length === 0 ? <EmptyInline text="Belum ada catatan riwayat." /> : <ol className="space-y-3">{history.map((event) => <li key={event.id} className="relative rounded-lg border border-slate-700 bg-slate-900/40 p-4" data-testid={`row-history-${event.id}`}><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-semibold capitalize text-slate-200">{event.action.replace(/[_-]/g, " ")}</p><time className="text-xs text-slate-500">{displayDate(event.createdAt)}</time></div><p className="mt-1 text-xs text-slate-500">Aktor {event.actorId}</p>{Object.keys(event.detail ?? {}).length > 0 && <pre className="mt-3 overflow-auto rounded bg-[#09111b] p-3 text-xs text-slate-400">{JSON.stringify(event.detail, null, 2)}</pre>}</li>)}</ol>}
      </div>}
    </div>
  </div>;
}

function Metric({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, "-")}`}><div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-[10px] font-bold uppercase tracking-wider">{title}</span></div><p className="mt-2 text-sm font-medium text-slate-200">{value}</p></div>;
}

function InfoBlock({ title, body, rows }: { title: string; body?: string; rows?: Array<[string, string | null | undefined]> }) {
  return <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-4" data-testid={`section-report-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}><h3 className="mb-3 text-xs font-bold uppercase tracking-[0.13em] text-slate-400">{title}</h3>{rows ? <dl className="space-y-2">{rows.map(([key, value]) => <div key={key} className="grid grid-cols-[110px_1fr] gap-3 text-sm"><dt className="text-slate-500">{key}</dt><dd className="break-words text-slate-200">{value || "—"}</dd></div>)}</dl> : <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{body || "—"}</p>}</section>;
}

function UnitSetup({ units, onCreated }: { units: Array<{ id: string; name: string; unitType: "central" | "branch"; parentUnitId: string | null; active: boolean }>; onCreated: () => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [unitType, setUnitType] = useState<"central" | "branch">("branch");
  const [parentUnitId, setParentUnitId] = useState("");
  const queryClient = useQueryClient();
  const showSetupError = (error: unknown) => toast.error(mutationErrorMessage(error));
  const createUnitMutation = useMutation(getCreatePubReportUnitMutationOptions({
    mutation: { onSuccess: async () => { setName(""); await onCreated(); }, onError: showSetupError },
  }));
  const assignMembershipMutation = useMutation(getAssignPubReportMembershipMutationOptions({
    mutation: { onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListPubReportUnitsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListPubReportMembershipsQueryKey({ unitId: membershipUnit }) }),
      ]);
    }, onError: showSetupError },
  }));
  const deactivateMembershipMutation = useMutation(getDeactivatePubReportMembershipMutationOptions({
    mutation: { onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListPubReportUnitsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListPubReportMembershipsQueryKey({ unitId: membershipUnit }) }),
      ]);
    }, onError: showSetupError },
  }));
  const [membershipUnit, setMembershipUnit] = useState("");
  const [membershipUser, setMembershipUser] = useState("");
  const [membershipRole, setMembershipRole] = useState<"branch_operator" | "central_reviewer">("branch_operator");
  const membershipQuery = useListPubReportMemberships({ unitId: membershipUnit }, {
    query: { enabled: expanded && Boolean(membershipUnit), queryKey: getListPubReportMembershipsQueryKey({ unitId: membershipUnit }) },
  });
  return <section className={`${panel} mt-5 overflow-hidden`} data-testid="panel-unit-setup">
    <button className="flex w-full items-center justify-between px-4 py-4 text-left" onClick={() => setExpanded(!expanded)} data-testid="button-toggle-unit-setup"><span><span className="block text-sm font-semibold">Administrasi unit & akses</span><span className="mt-1 block text-xs text-slate-500">Pengaturan hanya tersedia untuk admin platform.</span></span><ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-90" : ""}`} /></button>
    {expanded && <div className="border-t border-slate-700 p-4">
      <div className="grid gap-5 xl:grid-cols-2">
        <div><h3 className="mb-3 text-sm font-semibold">Buat unit pelaporan</h3><div className="grid gap-2 sm:grid-cols-2"><input className={field} placeholder="Nama unit" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-unit-name" /><select className={field} value={unitType} onChange={(e) => setUnitType(e.target.value as "central" | "branch")} data-testid="select-unit-type"><option value="branch">Cabang</option><option value="central">Pusat</option></select>
          {unitType === "branch" && <select className={field} value={parentUnitId} onChange={(e) => setParentUnitId(e.target.value)} data-testid="select-parent-unit"><option value="">Pilih unit pusat induk</option>{units.filter((unit) => unit.unitType === "central" && unit.active).map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>}
          <button className={primaryButton} disabled={!name.trim() || (unitType === "branch" && !parentUnitId) || createUnitMutation.isPending} onClick={() => createUnitMutation.mutate({ data: { name: name.trim(), unitType, parentUnitId: parentUnitId || null } })} data-testid="button-create-unit"><Plus className="h-4 w-4" /> Tambah unit</button></div></div>
        <div><h3 className="mb-3 text-sm font-semibold">Keanggotaan unit</h3><div className="grid gap-2 sm:grid-cols-2"><select className={field} value={membershipUnit} onChange={(e) => { const nextUnit = units.find((unit) => unit.id === e.target.value); setMembershipUnit(e.target.value); setMembershipRole(nextUnit?.unitType === "central" ? "central_reviewer" : "branch_operator"); }} data-testid="select-membership-unit"><option value="">Pilih unit</option>{units.filter((unit) => unit.active).map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
          <input className={field} placeholder="ID pengguna" value={membershipUser} onChange={(e) => setMembershipUser(e.target.value)} data-testid="input-membership-user" /><div className={`${field} flex items-center text-slate-400`} aria-label="Peran keanggotaan" data-testid="text-membership-role">{membershipRole === "central_reviewer" ? "Reviewer pusat" : "Operator cabang"}</div><button className={secondaryButton} disabled={!membershipUnit || !membershipUser.trim() || assignMembershipMutation.isPending} onClick={() => assignMembershipMutation.mutate({ data: { unitId: membershipUnit, userId: membershipUser.trim(), role: membershipRole } })} data-testid="button-assign-membership"><Plus className="h-4 w-4" /> Tetapkan akses</button></div>
          {membershipQuery.isError && <p className="mt-2 text-xs text-amber-200">Daftar keanggotaan tidak dapat dimuat.</p>}
          {membershipUnit && membershipQuery.data && <div className="mt-3 space-y-2">{membershipQuery.data.map((member) => <div key={member.id} className="flex items-center justify-between gap-2 rounded border border-slate-700 px-3 py-2 text-xs" data-testid={`row-membership-${member.id}`}><span className="text-slate-300">{member.userId} · {member.role}{!member.active && " · nonaktif"}</span>{member.active && <button className="text-amber-200 underline" onClick={() => deactivateMembershipMutation.mutate({ id: member.id })} data-testid={`button-deactivate-membership-${member.id}`}>Nonaktifkan</button>}</div>)}</div>}
        </div>
      </div>
    </div>}
  </section>;
}
