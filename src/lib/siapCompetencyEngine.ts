export type SiapFocus = "legalitas" | "sertifikasi" | "tender" | "proyek";

export type SiapReadinessStatus =
  | "belum-ada-data"
  | "perlu-dilengkapi"
  | "berkembang"
  | "siap";

export interface SiapMemberSource {
  membership_status: string;
  membership_number: string;
  expires_at: string | null;
}

export interface SiapObligationSource {
  id: string;
  title: string;
  siap_focus: string;
  status: string;
  fulfilled_at: string | null;
}

export interface SiapActivitySource {
  id: string;
  title: string;
  siap_focus: string;
}

export interface SiapEnrollmentSource {
  activity_id: string;
  status: string;
  completed_at: string | null;
}

export interface SiapEvidenceSource {
  id: string;
  activity_id: string;
  title: string;
  issued_at: string;
}

export interface SiapModuleProgressSource {
  status: string;
  progress_percent: number;
  module_title: string;
  domain_name: string;
}

export interface SiapCertificateSource {
  id: string;
  module_name: string;
  level: string;
  issued_at: string;
}

export interface SiapPancekSource {
  company_name: string;
  nib: string;
  npwp: string;
  completion_percent: number;
  status: string;
  period_year: number;
}

export interface SiapLkutSource {
  report_year: number;
  status: string;
  submitted_at: string | null;
  kta_number: string;
  kta_expiry_date: string | null;
  sbu_number: string;
  sbu_expiry_date: string | null;
  experience_records_complete: boolean | null;
  experience_pending_list: string;
}

export interface SiapSmapSource {
  id: string;
  doc_type: string;
  status: string;
  verified_at: string | null;
}

export interface SiapProjectSource {
  id: string;
  status: string;
  contract_type: string;
  complexity_score: number;
}

export interface SiapNativeLmsCourseSource {
  id: string;
  title: string;
  siap_focus: string;
}

export interface SiapNativeLmsEnrollmentSource {
  course_id: string;
  status: string;
  completed_at: string | null;
  last_activity_at: string | null;
}

export interface SiapNativeLmsProgressSource {
  course_id: string;
  status: string;
  progress_percent: number;
  updated_at: string;
}

export interface SiapNativeLmsCompletionSource {
  course_id: string;
  status: string;
  issued_at: string;
}

export interface SiapCompetencySnapshot {
  member: SiapMemberSource | null;
  obligations: SiapObligationSource[];
  activities: SiapActivitySource[];
  enrollments: SiapEnrollmentSource[];
  evidence: SiapEvidenceSource[];
  modules: SiapModuleProgressSource[];
  certificates: SiapCertificateSource[];
  pancek: SiapPancekSource | null;
  lkut: SiapLkutSource | null;
  smapDocuments: SiapSmapSource[];
  projects: SiapProjectSource[];
  nativeLmsCourses: SiapNativeLmsCourseSource[];
  nativeLmsEnrollments: SiapNativeLmsEnrollmentSource[];
  nativeLmsProgress: SiapNativeLmsProgressSource[];
  nativeLmsCompletions: SiapNativeLmsCompletionSource[];
  operationalCounts: {
    risks: number;
    budgets: number;
    k3: number;
  };
}

export interface SiapIndicator {
  id: string;
  title: string;
  source: string;
  href: string;
  available: boolean;
  progress: number | null;
  detail: string;
  updatedAt?: string | null;
}

export interface SiapDimensionResult {
  focus: SiapFocus;
  label: string;
  description: string;
  score: number | null;
  coverage: number;
  status: SiapReadinessStatus;
  indicators: SiapIndicator[];
  recommendations: string[];
}

export interface SiapCompetencyMap {
  dimensions: SiapDimensionResult[];
  overallScore: number | null;
  overallCoverage: number;
  status: SiapReadinessStatus;
  generatedAt: string;
}

const FOCUS_META: Record<SiapFocus, { label: string; description: string }> = {
  legalitas: {
    label: "SIAP Legalitas",
    description: "Kesiapan administrasi anggota, identitas BUJK, KTA, SBU, dan pelaporan.",
  },
  sertifikasi: {
    label: "SIAP Sertifikasi",
    description: "Bukti pembelajaran, sertifikat, kegiatan PUB, dan dokumen kepatuhan.",
  },
  tender: {
    label: "SIAP Tender",
    description: "Kesiapan pengadaan dan kontrak berdasarkan pembelajaran serta rekam pengalaman.",
  },
  proyek: {
    label: "SIAP Proyek",
    description: "Kesiapan menjalankan proyek melalui data proyek dan perangkat operasional.",
  },
};

const COMPLETED_STATUSES = new Set(["completed", "fulfilled", "verified", "done", "passed"]);

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function isCompleted(status: string) {
  return COMPLETED_STATUSES.has(status.toLowerCase());
}

function validUntilScore(expiry: string | null) {
  if (!expiry) return 50;
  return new Date(expiry).getTime() >= Date.now() ? 100 : 0;
}

function indicator(
  id: string,
  title: string,
  source: string,
  href: string,
  available: boolean,
  progress: number | null,
  detail: string,
  updatedAt?: string | null,
): SiapIndicator {
  return {
    id,
    title,
    source,
    href,
    available,
    progress: available && progress !== null ? clamp(progress) : null,
    detail,
    updatedAt,
  };
}

function nativeIndicators(snapshot: SiapCompetencySnapshot, focus: SiapFocus): SiapIndicator[] {
  const activities = snapshot.activities.filter((item) => item.siap_focus === focus);
  const activityIds = new Set(activities.map((item) => item.id));
  const enrollments = snapshot.enrollments.filter((item) => activityIds.has(item.activity_id));
  const evidence = snapshot.evidence.filter((item) => activityIds.has(item.activity_id));
  const obligations = snapshot.obligations.filter((item) => item.siap_focus === focus);

  const completedEnrollments = enrollments.filter((item) => isCompleted(item.status)).length;
  const fulfilledObligations = obligations.filter((item) => isCompleted(item.status)).length;
  const activityAvailable = enrollments.length > 0 || evidence.length > 0;
  const activityProgress = activityAvailable
    ? Math.max(
        enrollments.length > 0 ? (completedEnrollments / enrollments.length) * 100 : 0,
        evidence.length > 0 ? 100 : 0,
      )
    : null;

  return [
    indicator(
      `${focus}-pub-activity`,
      "Kegiatan dan bukti PUB",
      "Kegiatan & Bukti PUB",
      "/aspekindo-lms",
      activityAvailable,
      activityProgress,
      activityAvailable
        ? `${completedEnrollments} kegiatan selesai dan ${evidence.length} bukti diterbitkan.`
        : "Belum ada pendaftaran atau bukti kegiatan pada fokus ini.",
      evidence[0]?.issued_at ?? null,
    ),
    indicator(
      `${focus}-obligation`,
      "Kewajiban anggota",
      "Administrasi ASPEKINDO",
      "/aspekindo-lms",
      obligations.length > 0,
      obligations.length > 0 ? (fulfilledObligations / obligations.length) * 100 : null,
      obligations.length > 0
        ? `${fulfilledObligations} dari ${obligations.length} kewajiban terpenuhi.`
        : "Belum ada kewajiban yang ditetapkan untuk fokus ini.",
      obligations.find((item) => item.fulfilled_at)?.fulfilled_at ?? null,
    ),
  ];
}

function nativeLmsIndicator(snapshot: SiapCompetencySnapshot, focus: SiapFocus): SiapIndicator {
  const courses = snapshot.nativeLmsCourses.filter((item) => item.siap_focus === focus);
  const courseIds = new Set(courses.map((item) => item.id));
  const enrollments = snapshot.nativeLmsEnrollments.filter((item) => courseIds.has(item.course_id));
  const progress = snapshot.nativeLmsProgress.filter((item) => courseIds.has(item.course_id));
  const completions = snapshot.nativeLmsCompletions.filter((item) => courseIds.has(item.course_id));
  const enrolledCourseIds = new Set(enrollments.map((item) => item.course_id));
  const courseScores = [...enrolledCourseIds].map((courseId) => {
    const enrollment = enrollments.find((item) => item.course_id === courseId);
    if (enrollment?.status === "completed" || completions.some((item) => item.course_id === courseId)) return 100;
    const lessonProgress = progress.filter((item) => item.course_id === courseId);
    if (lessonProgress.length > 0) {
      return lessonProgress.reduce((total, item) => total + item.progress_percent, 0) / lessonProgress.length;
    }
    return enrollment?.status === "in_progress" ? 10 : 0;
  });
  const available = enrollments.length > 0 || progress.length > 0 || completions.length > 0;
  const completedCourses = new Set([
    ...enrollments.filter((item) => item.status === "completed").map((item) => item.course_id),
    ...completions.map((item) => item.course_id),
  ]).size;
  const updatedDates = [
    ...enrollments.flatMap((item) => [item.completed_at, item.last_activity_at]),
    ...progress.map((item) => item.updated_at),
    ...completions.map((item) => item.issued_at),
  ].filter((value): value is string => Boolean(value)).sort().reverse();

  return indicator(
    `${focus}-native-lms`,
    "Pembelajaran LMS ASPEKINDO",
    "LMS anggota",
    "/aspekindo-lms",
    available,
    courseScores.length > 0
      ? courseScores.reduce((total, value) => total + value, 0) / courseScores.length
      : null,
    available
      ? `${completedCourses} dari ${enrolledCourseIds.size} kursus pada fokus ini selesai dan ${completions.length} bukti tercatat.`
      : "Belum ada enrollment atau bukti LMS ASPEKINDO pada fokus ini.",
    updatedDates[0] ?? null,
  );
}

function legalitasIndicators(snapshot: SiapCompetencySnapshot): SiapIndicator[] {
  const member = snapshot.member;
  const lkut = snapshot.lkut;
  const pancek = snapshot.pancek;
  const membershipProgress = member
    ? member.membership_status === "active" && validUntilScore(member.expires_at) > 0
      ? 100
      : member.membership_status === "pending"
        ? 50
        : 20
    : null;
  const lkutFields = lkut
    ? [
        hasText(lkut.kta_number) ? validUntilScore(lkut.kta_expiry_date) : 0,
        hasText(lkut.sbu_number) ? validUntilScore(lkut.sbu_expiry_date) : 0,
        lkut.status === "submitted" ? 100 : 50,
      ]
    : [];
  const pancekFields = pancek
    ? [pancek.company_name, pancek.nib, pancek.npwp].filter(hasText).length
    : 0;

  return [
    indicator(
      "legalitas-membership",
      "Keanggotaan ASPEKINDO",
      "Data anggota",
      "/profile",
      Boolean(member),
      membershipProgress,
      member
        ? `Status keanggotaan ${member.membership_status}; nomor ${member.membership_number || "belum tersedia"}.`
        : "Akun belum terhubung dengan data anggota ASPEKINDO.",
      member?.expires_at,
    ),
    indicator(
      "legalitas-lkut",
      "KTA, SBU, dan LKUT",
      "Data LKUT",
      "/lkut",
      Boolean(lkut),
      lkutFields.length > 0 ? lkutFields.reduce((total, value) => total + value, 0) / lkutFields.length : null,
      lkut
        ? `LKUT ${lkut.report_year} berstatus ${lkut.status}; KTA dan SBU dinilai dari kelengkapan serta masa berlaku.`
        : "Belum ada laporan LKUT sebagai dasar legalitas.",
      lkut?.submitted_at,
    ),
    indicator(
      "legalitas-pancek",
      "Identitas BUJK",
      "PANCEK",
      "/pancek",
      Boolean(pancek),
      pancek ? (pancekFields / 3) * 75 + (isCompleted(pancek.status) ? 25 : 0) : null,
      pancek
        ? `${pancekFields} dari 3 identitas utama terisi pada PANCEK ${pancek.period_year}.`
        : "Belum ada data identitas BUJK dari PANCEK.",
    ),
    nativeLmsIndicator(snapshot, "legalitas"),
    ...nativeIndicators(snapshot, "legalitas"),
  ];
}

function sertifikasiIndicators(snapshot: SiapCompetencySnapshot): SiapIndicator[] {
  const modules = snapshot.modules;
  const completedModules = modules.filter((item) => isCompleted(item.status)).length;
  const smapVerified = snapshot.smapDocuments.filter(
    (item) => item.verified_at || isCompleted(item.status),
  ).length;

  return [
    indicator(
      "sertifikasi-certificate",
      "Sertifikat kompetensi",
      "Sertifikat PUB",
      "/certificates",
      snapshot.certificates.length > 0,
      snapshot.certificates.length > 0 ? 100 : null,
      snapshot.certificates.length > 0
        ? `${snapshot.certificates.length} sertifikat tercatat.`
        : "Belum ada sertifikat yang diterbitkan.",
      snapshot.certificates[0]?.issued_at,
    ),
    indicator(
      "sertifikasi-learning",
      "Pembelajaran kompetensi",
      "E-Course",
      "/courses",
      modules.length > 0,
      modules.length > 0
        ? modules.reduce((total, item) => total + item.progress_percent, 0) / modules.length
        : null,
      modules.length > 0
        ? `${completedModules} dari ${modules.length} modul yang dimulai telah selesai.`
        : "Belum ada progres modul pembelajaran.",
    ),
    indicator(
      "sertifikasi-smap",
      "Dokumen SMAP",
      "SMAP",
      "/smap",
      snapshot.smapDocuments.length > 0,
      snapshot.smapDocuments.length > 0
        ? (smapVerified / snapshot.smapDocuments.length) * 100
        : null,
      snapshot.smapDocuments.length > 0
        ? `${smapVerified} dari ${snapshot.smapDocuments.length} dokumen terverifikasi atau selesai.`
        : "Belum ada dokumen SMAP sebagai bukti kepatuhan.",
    ),
    nativeLmsIndicator(snapshot, "sertifikasi"),
    ...nativeIndicators(snapshot, "sertifikasi"),
  ];
}

function tenderIndicators(snapshot: SiapCompetencySnapshot): SiapIndicator[] {
  const tenderModules = snapshot.modules.filter(
    (item) => item.domain_name.toLowerCase() === "pengadaan & kontrak",
  );
  const completedTenderModules = tenderModules.filter((item) => isCompleted(item.status)).length;
  const contractProjects = snapshot.projects.filter((item) => hasText(item.contract_type));
  const lkut = snapshot.lkut;

  return [
    indicator(
      "tender-learning",
      "Pembelajaran pengadaan & kontrak",
      "E-Course",
      "/courses",
      tenderModules.length > 0,
      tenderModules.length > 0
        ? tenderModules.reduce((total, item) => total + item.progress_percent, 0) / tenderModules.length
        : null,
      tenderModules.length > 0
        ? `${completedTenderModules} dari ${tenderModules.length} modul yang dimulai telah selesai.`
        : "Belum ada progres pada domain Pengadaan & Kontrak.",
    ),
    indicator(
      "tender-contract-record",
      "Rekam kontrak proyek",
      "Project Workspace",
      "/projects",
      contractProjects.length > 0,
      contractProjects.length > 0 ? 100 : null,
      contractProjects.length > 0
        ? `${contractProjects.length} proyek memiliki tipe kontrak.`
        : "Belum ada proyek dengan tipe kontrak yang tercatat.",
    ),
    indicator(
      "tender-lkut-experience",
      "Kelengkapan pengalaman",
      "Data LKUT",
      "/lkut",
      Boolean(lkut),
      lkut ? (lkut.experience_records_complete ? 100 : hasText(lkut.experience_pending_list) ? 40 : 0) : null,
      lkut
        ? lkut.experience_records_complete
          ? "Rekam pengalaman dinyatakan lengkap."
          : "Rekam pengalaman masih perlu dilengkapi."
        : "Belum ada LKUT untuk menilai rekam pengalaman.",
      lkut?.submitted_at,
    ),
    nativeLmsIndicator(snapshot, "tender"),
    ...nativeIndicators(snapshot, "tender"),
  ];
}

function proyekIndicators(snapshot: SiapCompetencySnapshot): SiapIndicator[] {
  const projects = snapshot.projects;
  const activeOrCompleted = projects.filter(
    (item) => item.status === "active" || item.status === "completed",
  ).length;
  const operationalGroups = [
    snapshot.operationalCounts.risks,
    snapshot.operationalCounts.budgets,
    snapshot.operationalCounts.k3,
  ];
  const usedOperationalGroups = operationalGroups.filter((count) => count > 0).length;

  return [
    indicator(
      "proyek-portfolio",
      "Portofolio proyek",
      "Project Workspace",
      "/projects",
      projects.length > 0,
      projects.length > 0
        ? Math.min(100, 50 + (activeOrCompleted / projects.length) * 30 + Math.min(projects.length, 4) * 5)
        : null,
      projects.length > 0
        ? `${activeOrCompleted} dari ${projects.length} proyek aktif atau selesai.`
        : "Belum ada proyek yang tercatat.",
    ),
    indicator(
      "proyek-operational-tools",
      "Perangkat kendali proyek",
      "Toolkit proyek",
      "/projects",
      usedOperationalGroups > 0,
      usedOperationalGroups > 0 ? (usedOperationalGroups / operationalGroups.length) * 100 : null,
      usedOperationalGroups > 0
        ? `${usedOperationalGroups} dari 3 kelompok alat dipakai: risiko, anggaran, dan K3.`
        : "Belum ada bukti penggunaan risk register, budget tracker, atau K3 checklist.",
    ),
    indicator(
      "proyek-complexity",
      "Pengalaman kompleksitas",
      "Project Workspace",
      "/projects",
      projects.length > 0,
      projects.length > 0
        ? projects.reduce((total, item) => total + item.complexity_score, 0) / projects.length
        : null,
      projects.length > 0
        ? `Rata-rata kompleksitas ${Math.round(projects.reduce((total, item) => total + item.complexity_score, 0) / projects.length)} dari 100.`
        : "Belum ada data kompleksitas proyek.",
    ),
    nativeLmsIndicator(snapshot, "proyek"),
    ...nativeIndicators(snapshot, "proyek"),
  ];
}

function buildDimension(
  focus: SiapFocus,
  indicators: SiapIndicator[],
): SiapDimensionResult {
  const available = indicators.filter(
    (item): item is SiapIndicator & { progress: number } =>
      item.available && item.progress !== null,
  );
  const coverage = clamp((available.length / indicators.length) * 100);
  const score =
    available.length > 0
      ? clamp(available.reduce((total, item) => total + item.progress, 0) / available.length)
      : null;

  let status: SiapReadinessStatus = "belum-ada-data";
  if (score !== null) {
    if (coverage < 60 || score < 50) status = "perlu-dilengkapi";
    else if (coverage >= 80 && score >= 75) status = "siap";
    else status = "berkembang";
  }

  const recommendations = indicators
    .filter((item) => !item.available || (item.progress ?? 0) < 75)
    .slice(0, 3)
    .map((item) =>
      item.available
        ? `Tingkatkan ${item.title.toLowerCase()} dari ${item.progress ?? 0}%.`
        : `Lengkapi ${item.title.toLowerCase()} melalui ${item.source}.`,
    );

  return {
    focus,
    ...FOCUS_META[focus],
    score,
    coverage,
    status,
    indicators,
    recommendations,
  };
}

export function buildSiapCompetencyMap(
  snapshot: SiapCompetencySnapshot,
  generatedAt = new Date().toISOString(),
): SiapCompetencyMap {
  const dimensions = [
    buildDimension("legalitas", legalitasIndicators(snapshot)),
    buildDimension("sertifikasi", sertifikasiIndicators(snapshot)),
    buildDimension("tender", tenderIndicators(snapshot)),
    buildDimension("proyek", proyekIndicators(snapshot)),
  ];
  const scoredDimensions = dimensions.filter(
    (dimension): dimension is SiapDimensionResult & { score: number } =>
      dimension.score !== null,
  );
  const overallScore =
    scoredDimensions.length > 0
      ? clamp(
          scoredDimensions.reduce((total, dimension) => total + dimension.score, 0) /
            scoredDimensions.length,
        )
      : null;
  const overallCoverage = clamp(
    dimensions.reduce((total, dimension) => total + dimension.coverage, 0) /
      dimensions.length,
  );

  let status: SiapReadinessStatus = "belum-ada-data";
  if (overallScore !== null) {
    if (overallCoverage < 60 || overallScore < 50) status = "perlu-dilengkapi";
    else if (overallCoverage >= 80 && overallScore >= 75) status = "siap";
    else status = "berkembang";
  }

  return { dimensions, overallScore, overallCoverage, status, generatedAt };
}