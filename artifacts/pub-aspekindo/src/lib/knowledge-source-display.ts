export interface KnowledgeSourceDisplay {
  label: string;
  classification: string;
  status: string;
}

const sourceDisplay: Record<string, KnowledgeSourceDisplay> = {
  keputusan_dan_surat: {
    label: "Keputusan dan surat",
    classification: "Keputusan / surat",
    status: "Periksa status dan perubahan pada sumber resmi sebelum mengandalkan dokumen ini.",
  },
  paparan: {
    label: "Materi paparan",
    classification: "Materi pengetahuan nonnormatif",
    status: "Materi pendukung, bukan ketentuan regulasi yang berlaku.",
  },
  paparan_dan_usulan: {
    label: "Paparan dan usulan",
    classification: "Usulan nonnormatif",
    status: "Usulan atau proyeksi tidak sama dengan ketentuan yang telah berlaku.",
  },
  perspektif_pelaku_usaha: {
    label: "Perspektif pelaku usaha",
    classification: "Perspektif pelaku usaha",
    status: "Sudut pandang praktisi, bukan sumber ketentuan normatif.",
  },
  format_skema: {
    label: "Format skema LSBU",
    classification: "Skema / kompetensi",
    status: "Acuan skema lembaga; bukan bukti penerbitan atau keputusan SBU.",
  },
  peraturan_pemerintah: {
    label: "Peraturan Pemerintah",
    classification: "Regulasi normatif",
    status: "Naskah regulasi dalam koleksi; status terbaru tetap perlu diverifikasi.",
  },
  peraturan_menteri: {
    label: "Peraturan Menteri",
    classification: "Regulasi normatif",
    status: "Naskah regulasi dalam koleksi; status terbaru tetap perlu diverifikasi.",
  },
  peraturan_presiden: {
    label: "Peraturan Presiden",
    classification: "Regulasi normatif",
    status: "Naskah regulasi dalam koleksi; status terbaru tetap perlu diverifikasi.",
  },
  peraturan_lembaga: {
    label: "Peraturan Lembaga",
    classification: "Regulasi normatif",
    status: "Naskah regulasi dalam koleksi; status terbaru tetap perlu diverifikasi.",
  },
  lampiran_peraturan: {
    label: "Lampiran peraturan",
    classification: "Lampiran normatif",
    status: "Lampiran yang tersedia bisa parsial; periksa naskah resmi dan cakupannya.",
  },
  publikasi_statistik: {
    label: "Publikasi statistik BPS",
    classification: "Statistik / klasifikasi",
    status: "Publikasi statistik, bukan otomatis pemetaan atau konversi SBU.",
  },
  tabel_pemetaan: {
    label: "Tabel pemetaan salinan",
    classification: "Draf pemetaan",
    status: "Asal dan versi belum terverifikasi; bukan dasar keputusan hukum atau SBU.",
  },
};

export function describeKnowledgeSource(kind: string): KnowledgeSourceDisplay {
  return sourceDisplay[kind] ?? {
    label: kind || "Jenis sumber tidak diketahui",
    classification: "Jenis belum dipetakan",
    status: "Periksa asal, versi, dan status sumber sebelum menggunakannya.",
  };
}
