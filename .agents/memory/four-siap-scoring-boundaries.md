---
name: 4 SIAP scoring boundaries
description: Prinsip interpretasi dan batas produk untuk peta Legalitas, Sertifikasi, Tender, dan Proyek.
---

Peta 4 SIAP harus menampilkan skor bukti dan cakupan data sebagai dua ukuran terpisah. Data yang belum tersedia berarti belum dapat dinilai, bukan kompetensi bernilai nol. Rekomendasi bersifat panduan dan bukan keputusan sertifikasi, verifikasi legal, atau jaminan kelayakan tender.

Engine eksternal hanya boleh menjadi mesin internal. Jangan menampilkan nama engine, tautan eksternal, secret, atau klaim integrasi aktif di browser sebelum kontrak server-side tersedia.

**Why:** Menggabungkan kekosongan data dengan ketidakmampuan menghasilkan penilaian yang menyesatkan, sedangkan mempublikasikan engine eksternal mengaburkan kepemilikan produk dan batas keamanan.

**How to apply:** Setiap sumber baru harus memiliki atribusi SIAP yang eksplisit, batas kepemilikan anggota, indikator yang dapat dijelaskan, state data parsial, serta adapter server-side bila membutuhkan engine eksternal.