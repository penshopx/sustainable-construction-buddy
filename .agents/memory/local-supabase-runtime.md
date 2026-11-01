---
name: Supabase lokal pada runtime terbatas
description: Batas verifikasi HTTP Supabase lokal ketika proses kontainer tidak dapat menjalankan pemeriksaan kesehatan.
---

Tersedianya perintah Docker dan PostgreSQL yang menerima koneksi belum membuktikan stack Supabase lokal dapat digunakan. Runtime dapat menolak eksekusi proses pemeriksaan kesehatan dengan `OCI runtime exec failed`, sehingga Auth dan gateway belum tersedia.

**Why:** Penyiapan Supabase lokal dapat berhenti pada database berstatus unhealthy, termasuk saat opsi mengabaikan pemeriksaan kesehatan dipakai. Ini kegagalan lingkungan sebelum pengujian HTTP berjalan, bukan bukti RPC gagal.

**How to apply:** Bedakan hasil pemeriksaan sintaks dari hasil pengujian HTTP sesungguhnya. Jika stack tidak siap, nyatakan keterbatasan verifikasi dan gunakan CI Supabase lokal; jangan mengganti target dengan database hosted atau mengklaim uji SQL sebagai uji gateway.

Menjalankan `supabase start --ignore-health-check` setelah startup parsial dapat keluar sukses hanya dengan database yang sudah hidup, sementara Auth dan PostgREST tetap berhenti.

**Why:** Kode keluar nol pada startup ulang bukan bukti seluruh stack telah diinisialisasi.

**How to apply:** Wajib periksa ketersediaan Auth/PostgREST dan ledger seluruh migrasi sebelum menyebut pengujian skema lengkap berhasil.

Inisialisasi Realtime juga dapat gagal dengan `eafnosupport` pada listener ketika keluarga alamat jaringan tidak didukung runtime. Mengecualikan layanan Realtime dari `start` belum tentu melewati langkah inisialisasi skemanya.

**Why:** CLI dapat menjalankan kontainer inisialisasi sebelum memilih layanan yang dinyalakan. Menonaktifkan layanan saja tidak menjamin bootstrap database selesai.

**How to apply:** Jika database sehat tetapi `Initialising schema` berhenti, periksa error kontainer bootstrap. Database image Supabase tanpa bootstrap lengkap juga belum setara stack termigrasi: skema Storage awal dapat belum memiliki kolom yang dibutuhkan migrasi aplikasi.

Kegagalan `docker exec` tidak selalu menghalangi `docker run`. Bila CLI tidak dapat melewati health-check, layanan GoTrue, Storage API, dan PostgREST asli dapat dijalankan langsung pada database Supabase lokal yang sama untuk memverifikasi batas API/database.

**Why:** Runtime pernah berhasil menjalankan proses utama kontainer tetapi menolak proses health-check tambahan. Layanan asli masih bisa menerapkan migrasi provider dan memvalidasi JWT/RLS; ini berbeda dari mengganti skema dengan tabel minimal.

**How to apply:** Pastikan migrasi Auth/Storage asli selesai sebelum seluruh migrasi aplikasi dipasang dengan CLI dan ledger diperiksa. Bila memakai penerus HTTP lokal, teruskan request tanpa mengubah header/badan/respons dan nyatakan bahwa konfigurasi Kong tidak ikut diuji. Jangan menyebut startup CLI gagal sebagai stack resmi yang sehat.

Koneksi antarkontainer melalui jaringan bridge dapat macet meskipun proses layanan hidup dan PostgreSQL menerima koneksi dari host; jaringan host dengan koneksi loopback dapat bekerja pada runtime yang sama.

**Why:** Layanan asli pernah berhenti pada log awal tanpa menyelesaikan migrasi provider melalui bridge, bahkan dengan alamat IP langsung; pada jaringan host migrasi dan permintaan Auth/PostgREST berhasil.

**How to apply:** Bedakan proses hidup dari layanan siap. Jika koneksi bridge macet, verifikasi alternatif jaringan lokal tanpa mengganti skema atau memakai layanan hosted; tetap periksa migrasi provider dan ledger aplikasi sebelum menjalankan uji HTTP.
