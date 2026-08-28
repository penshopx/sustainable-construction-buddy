---
name: Supabase key rotation diagnostics
description: Cara membedakan gangguan Supabase Auth dari API key proyek yang sudah tidak berlaku.
---

Saat Auth timeout, validasi URL proyek dan API key secara terpisah melalui REST API. Respons domain atau Storage yang sehat tidak membuktikan key masih berlaku. Alur autentikasi di UI harus memiliki batas waktu dan menjelaskan gangguan layanan tanpa membiarkan pengguna menunggu tanpa akhir.

**Why:** Project pernah mengalami `AuthRetryableFetchError` dan endpoint Auth timeout, sementara domain serta Storage tetap merespons. Probe REST kemudian menunjukkan bahwa anon/publishable dan service-role key sama-sama sudah ditolak sebagai key tidak valid, konsisten dengan rotasi API key.

**How to apply:** Saat sign up, login, reset password, atau pemulihan sesi gagal, probe REST dengan key tanpa pernah mencetak nilainya. Jika gateway menolak key, minta key terbaru melalui Secrets/Env Vars yang aman; jangan mengubah URL, database, atau provider Auth. Pertahankan timeout client dan pesan outage.