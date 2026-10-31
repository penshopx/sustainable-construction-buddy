---
name: Supabase lokal pada runtime terbatas
description: Batas verifikasi HTTP Supabase lokal ketika proses kontainer tidak dapat menjalankan pemeriksaan kesehatan.
---

Tersedianya perintah Docker dan PostgreSQL yang menerima koneksi belum membuktikan stack Supabase lokal dapat digunakan. Runtime dapat menolak eksekusi proses pemeriksaan kesehatan dengan `OCI runtime exec failed`, sehingga Auth dan gateway belum tersedia.

**Why:** Penyiapan Supabase lokal dapat berhenti pada database berstatus unhealthy, termasuk saat opsi mengabaikan pemeriksaan kesehatan dipakai. Ini kegagalan lingkungan sebelum pengujian HTTP berjalan, bukan bukti RPC gagal.

**How to apply:** Bedakan hasil pemeriksaan sintaks dari hasil pengujian HTTP sesungguhnya. Jika stack tidak siap, nyatakan keterbatasan verifikasi dan gunakan CI Supabase lokal; jangan mengganti target dengan database hosted atau mengklaim uji SQL sebagai uji gateway.

Inisialisasi Realtime juga dapat gagal dengan `eafnosupport` pada listener ketika keluarga alamat jaringan tidak didukung runtime. Mengecualikan layanan Realtime dari `start` belum tentu melewati langkah inisialisasi skemanya.

**Why:** CLI dapat menjalankan kontainer inisialisasi sebelum memilih layanan yang dinyalakan. Menonaktifkan layanan saja tidak menjamin bootstrap database selesai.

**How to apply:** Jika database sehat tetapi `Initialising schema` berhenti, periksa error kontainer bootstrap. Database image Supabase tanpa bootstrap lengkap juga belum setara stack termigrasi: skema Storage awal dapat belum memiliki kolom yang dibutuhkan migrasi aplikasi.
