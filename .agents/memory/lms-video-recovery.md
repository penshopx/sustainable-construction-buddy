---
name: Pemulihan tautan video LMS
description: Pertimbangan agar pergantian tautan video privat tidak mengganggu pemutaran yang masih lancar.
---

Jangan mengganti sumber video aktif hanya karena umur tautan bertanda tangan sudah melewati batas aman. Minta tautan baru untuk pemutaran baru atau lanjutan, atau setelah pemutaran yang sedang berjalan benar-benar macet/gagal karena tautan menua.

**Why:** Browser dapat terus memutar konten yang sudah tersangga walau tautan permintaan berikutnya kedaluwarsa. Mengganti sumber lebih awal mengulang pemuatan dan dapat mengganggu video yang sebenarnya masih lancar.

**How to apply:** Saat mengubah pemutar atau masa berlaku URL, pertahankan sumber yang sedang bermain sampai ada sinyal macet yang bertahan atau kesalahan media. Setelah meminta tautan baru, periksa lagi apakah pemutaran sudah pulih sendiri sebelum mengganti sumber.

Anggaran retry hanya boleh pulih setelah kemajuan pemutaran yang berkelanjutan atau tindakan coba ulang pengguna, bukan setiap event `playing`.

**Why:** Koneksi yang tidak stabil dapat berulang kali mengeluarkan event `playing` tanpa kemajuan yang berarti; mengisi ulang anggaran pada setiap event itu membuat batas retry tidak efektif.

**How to apply:** Gunakan kemajuan nyata sebagai bukti stabil, dan pertahankan anggaran yang sudah terpakai saat video hanya sempat berjalan sebentar.

Sinyal gangguan baru saat permintaan pemulihan lama masih berlangsung harus tetap antre, meskipun pemutaran sempat pulih dan membatalkan percobaan lama.

**Why:** Pemulihan sesaat tidak menjamin jaringan stabil; membuang sinyal baru dapat meninggalkan video gagal tanpa retry atau pemberitahuan.

**How to apply:** Bedakan pembatalan percobaan lama dari sinyal kegagalan yang lebih baru, dan batalkan keduanya bila pengguna sengaja menjeda.