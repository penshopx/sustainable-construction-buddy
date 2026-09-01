# Kontrak Insight Kompetensi PUB–Gustafta

Dokumen ini mencatat kontrak integrasi yang diterapkan pada deployment produksi Gustafta dan dipakai oleh Supabase Edge Function `competency-insight`.

## Endpoint dan autentikasi

- Method: `POST`
- Endpoint produksi: `https://gustafta.my.id/api/v1/ai/assist`
- Header: `Authorization: Bearer <API_KEY>`
- Content type: `application/json`
- Secret pada Gustafta: `GAIA_SIAP_API_KEY`
- Duplikat secret server-side pada Supabase: `GUSTAFTA_ENGINE_API_KEY`

Nilai kedua secret API key harus sama. Secret hanya berada di environment server dan tidak pernah dikirim ke browser.

## Request

```json
{
  "schemaVersion": "pub-siap-v1",
  "availableRecommendationKeys": [
    "legalitas-pancek",
    "sertifikasi-lms",
    "tender-risk"
  ]
}
```

Tidak ada identitas anggota, email, user ID, skor mentah, atau data profil pada payload.

## Response

```json
{
  "recommendationKeys": [
    "legalitas-pancek",
    "sertifikasi-lms",
    "tender-risk"
  ]
}
```

Jaminan provider:

- Maksimum tiga key.
- Duplikat dihapus.
- Urutan input dipertahankan.
- Output hanya berasal dari `availableRecommendationKeys`.
- Field tambahan pada request, termasuk identitas anggota, ditolak dengan HTTP 400.

Adapter PUB tetap menerapkan allowlist katalog internal, deduplikasi, dan batas maksimum tiga hasil. Respons kosong, invalid, timeout, atau error HTTP memakai fallback deterministik.

## Verifikasi

```bash
npm run test:insight
npm run test:insight:live
```

Tes kontrak lokal mencakup success, timeout, output invalid, deduplikasi, dan allowlist. Probe live memverifikasi bahwa request tanpa sesi ditolak, health hanya dapat dibaca admin, dan request dengan sesi anggota sementara menghasilkan respons aman dengan `source: connected` atau `source: deterministic` serta maksimal tiga rekomendasi. Probe tidak mencetak payload, token, identitas, atau URL provider, dan akun sementara selalu dihapus agar dapat dijalankan ulang.