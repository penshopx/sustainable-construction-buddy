---
name: Tujuan backend PUB
description: Proyek Supabase pengganti yang disetujui dan batas izin sebelum skema siap.
---

Proyek `jmkjomjomkwiztjusdbz` di Singapura adalah backend baru yang disetujui
pemilik untuk PUB ASPEKINDO. Pemilik menjalankan paket SQL manual dan mengizinkan
runtime development/preview memakai proyek ini melalui konfigurasi dev khusus.
Produksi harus tetap memakai target lama sampai ada persetujuan terpisah.

**Why:** Proyek Supabase lama terhapus tanpa backup. Proyek pengganti dibuat
secara manual di Singapura; proyek Tokyo yang terlihat sebelumnya bukan target
yang dipilih.

**How to apply:** Gunakan ref ini untuk pengujian PUB di development/preview.
Jangan mengubah target atau secrets produksi, menerbitkan aplikasi, atau menganggap
preview terhubung hanya karena URL/ref cocok. Verifikasi request nyata dan tabel
yang dibutuhkan sebelum menyatakan alur aplikasi siap.

Untuk pengujian akun, jangan menyimpulkan tujuan preview hanya dari berkas `.env`
lokal. Cocokkan nilai `VITE_SUPABASE_URL` yang efektif pada klien Vite aktif
dengan konfigurasi runtime dan tujuan yang disetujui sebelum membuat akun uji.

**Why:** Nilai konfigurasi lokal, environment runtime, dan preview dapat berbeda
cakupan; satu file saja tidak membuktikan target yang benar-benar sedang digunakan.

**How to apply:** Periksa properti URL yang benar pada runtime, bukan sembarang
URL Supabase yang ditemukan dalam teks konfigurasi. Bila tujuan efektif benar-benar
berbeda, hentikan pembuatan akun/perubahan data; jangan mengganti proyek otomatis.

Pemeriksaan pascarilis memakai origin Supabase HTTPS standar untuk ref produksi
yang diharapkan; jangan menerima domain kustom atau menebak ref dari URL.

**Why:** Probe memakai kredensial istimewa dan membuat pengguna sementara.
Kesamaan ref publisher saja tidak menjamin URL probe menunjuk tujuan yang sama.
Pembatasan origin yang ketat sengaja menolak kredensial URL dan komponen tambahan,
bukan mencoba memperbaikinya secara diam-diam.

**How to apply:** Pertahankan validasi sebelum seluruh request probe dan sebelum
deploy pada publisher. Mode pemeriksaan konfigurasi saja tetap memeriksa ref/TOML,
bukan mengklaim kesiapan URL atau hasil probe.

Jika migrasi diterapkan lewat SQL Editor secara manual, database tidak otomatis
mencatat versi-versi pada riwayat migrasi Supabase.

**Why:** `supabase db push` sesudah penerapan manual dapat mencoba menjalankan ulang
migrasi dan gagal atau meninggalkan skema parsial.

**How to apply:** Utamakan Supabase CLI dengan berkas migrasi asli. Jika paket SQL
manual dipakai, jangan lanjutkan `db push` sampai status seluruh versi diperbaiki
melalui mekanisme CLI dan diverifikasi. Jangan mengulang bundel penuh setelah
kegagalan parsial tanpa memeriksa skema terlebih dahulu.

Pemilik mengonfirmasi bahwa akun bootstrap Super Admin yang telah ditetapkan
dalam migrasi PUB dipertahankan untuk proyek baru.

**Why:** Hak Super Admin bergantung pada identitas yang dipilih, dan perubahan
tanpa keputusan pemilik dapat membuat operator kehilangan akses utama.

**How to apply:** Pertahankan binding akun yang ada saat menyiapkan paket migrasi
PUB ini. Jangan mengganti identitas tersebut kecuali pemilik meminta perubahan.
