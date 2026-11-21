---
name: Tujuan backend PUB
description: Proyek Supabase pengganti yang disetujui dan batas izin sebelum skema siap.
---

Proyek `jmkjomjomkwiztjusdbz` di Singapura adalah backend baru yang disetujui
pemilik untuk PUB ASPEKINDO. Proyek ini masih kosong; persetujuan tersebut
mencakup persiapan lokal migrasi saja, bukan penerapan SQL, perubahan runtime
atau secret, maupun publikasi/deploy.

**Why:** Proyek Supabase lama terhapus tanpa backup. Proyek pengganti dibuat
secara manual di Singapura; proyek Tokyo yang terlihat sebelumnya bukan target
yang dipilih.

**How to apply:** Gunakan ref ini sebagai target migrasi PUB setelah pemeriksaan
lokal. Jangan mengalihkan runtime aplikasi sebelum skema siap dan izin eksplisit
diberikan. Periksa target efektif sebelum setiap perubahan jarak jauh; ref dalam
berkas saja bukan bukti bahwa database sudah dimigrasikan atau aplikasi diterbitkan.

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
