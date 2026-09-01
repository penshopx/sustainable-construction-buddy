export const ENGINE_SCHEMA_VERSION = "pub-siap-v1";
export const ENGINE_TIMEOUT_MS = 8_000;
export const MAX_RECOMMENDATIONS = 3;

export const recommendationCatalog = {
  "legalitas-member": {
    focus: "legalitas",
    text: "Lengkapi status dan identitas keanggotaan BUJK.",
    href: "/pancek",
    label: "Lengkapi profil",
  },
  "legalitas-pancek": {
    focus: "legalitas",
    text: "Lengkapi identitas badan usaha, NIB, dan NPWP melalui PANCEK.",
    href: "/pancek",
    label: "Buka PANCEK",
  },
  "legalitas-lkut": {
    focus: "legalitas",
    text: "Lengkapi data KTA, SBU, perizinan, dan administrasi pada LKUT.",
    href: "/lkut",
    label: "Buka LKUT",
  },
  "sertifikasi-assessment": {
    focus: "sertifikasi",
    text: "Selesaikan pre-test untuk memetakan level kompetensi awal.",
    href: "/assessment",
    label: "Mulai assessment",
  },
  "sertifikasi-lms": {
    focus: "sertifikasi",
    text: "Lanjutkan E-Course, kuis, dan completion record di LMS ASPEKINDO.",
    href: "/aspekindo-lms",
    label: "Buka LMS",
  },
  "sertifikasi-evidence": {
    focus: "sertifikasi",
    text: "Tambahkan bukti penyelesaian dari sertifikat, PANCEK, atau SMAP.",
    href: "/certificates",
    label: "Lihat bukti",
  },
  "tender-learning": {
    focus: "tender",
    text: "Pelajari pengadaan, kontrak, dokumen penawaran, dan risiko tender.",
    href: "/courses",
    label: "Buka E-Course",
  },
  "tender-team": {
    focus: "tender",
    text: "Tinjau kesiapan tim menggunakan assessment dan scoring 4 Pilar.",
    href: "/analytics",
    label: "Buka Analytics",
  },
  "tender-risk": {
    focus: "tender",
    text: "Petakan risiko tender, supplier, dan rencana mitigasinya.",
    href: "/risk-register",
    label: "Buka workspace",
  },
  "proyek-workspace": {
    focus: "proyek",
    text: "Catat proyek aktif atau selesai beserta status dan kompleksitasnya.",
    href: "/projects",
    label: "Buka proyek",
  },
  "proyek-evidence": {
    focus: "proyek",
    text: "Lengkapi evidence pengalaman proyek pada data proyek dan LKUT.",
    href: "/lkut",
    label: "Buka LKUT",
  },
  "proyek-controls": {
    focus: "proyek",
    text: "Lengkapi kontrol K3, risiko, dan biaya pada workspace proyek.",
    href: "/k3-checklist",
    label: "Buka kontrol proyek",
  },
};

export function toRecommendation(key) {
  const item = recommendationCatalog[key];
  return item ? { text: item.text, href: item.href, label: item.label } : null;
}

export function deterministicKeys(missingKeys) {
  const focusOrder = ["legalitas", "sertifikasi", "tender", "proyek"];
  return [...new Set(missingKeys)]
    .filter((key) => Boolean(recommendationCatalog[key]))
    .sort((left, right) =>
      focusOrder.indexOf(recommendationCatalog[left].focus)
      - focusOrder.indexOf(recommendationCatalog[right].focus)
    )
    .slice(0, MAX_RECOMMENDATIONS);
}

export function parseRecommendationKeys(payload, availableKeys) {
  if (!payload || typeof payload !== "object") return [];
  const recommendationKeys = payload.recommendationKeys;
  if (!Array.isArray(recommendationKeys)) return [];

  const allowed = new Set(availableKeys.filter((key) => Boolean(recommendationCatalog[key])));
  return [...new Set(recommendationKeys)]
    .filter((key) => typeof key === "string" && allowed.has(key))
    .slice(0, MAX_RECOMMENDATIONS);
}

export async function requestRecommendationKeys(
  engineUrl,
  engineApiKey,
  availableKeys,
  fetchImpl = fetch,
  timeoutMs = ENGINE_TIMEOUT_MS,
) {
  const url = new URL(engineUrl);
  if (url.protocol !== "https:") {
    throw new Error("Competency engine URL must use HTTPS");
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${engineApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      schemaVersion: ENGINE_SCHEMA_VERSION,
      availableRecommendationKeys: deterministicKeys(availableKeys),
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Competency engine returned HTTP ${response.status}`);
  }

  return parseRecommendationKeys(await response.json(), availableKeys);
}