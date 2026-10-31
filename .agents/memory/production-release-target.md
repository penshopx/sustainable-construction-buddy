---
name: Tujuan rilis produksi
description: Konfirmasi pemilik atas tujuan Supabase produksi dan batas izin konfigurasi.
---

Pemilik mengonfirmasi `yidlglstzvizsszrpobi` sebagai tujuan Supabase produksi
pada 29 Oktober 2026 dan mengizinkan penyetelan `SUPABASE_PROJECT_REF` pada
lingkungan produksi. Izin tersebut tidak mencakup publikasi atau deploy.

**Why:** Pemilik sebelumnya belum dapat memastikan tujuan produksi; nilai yang
terlihat di dashboard atau TOML saja bukan persetujuan. Konfirmasi akhirnya
diberikan secara eksplisit, khusus untuk tujuan dan konfigurasi tersebut.

**How to apply:** Pertahankan pemisahan konfigurasi produksi dari pengujian dan
development. Jika tujuan berubah, minta konfirmasi baru; jangan menyalin ref
otomatis dari TOML sebagai bukti otorisasi. Keberhasilan pemeriksaan konfigurasi
tanpa deploy bukan bukti bahwa aplikasi atau fungsi produksi telah diterbitkan.

Untuk pengujian akun, jangan menyimpulkan tujuan preview hanya dari berkas `.env`
lokal. Cocokkan nilai `VITE_SUPABASE_URL` yang efektif pada klien Vite aktif
dengan konfigurasi runtime dan tujuan yang disetujui sebelum membuat akun uji.

**Why:** Berkas lokal pernah menunjuk proyek lama sementara preview aktif sudah
memakai tujuan yang benar. Perbandingan terhadap berkas itu saja menghalangi
pengujian tanpa menunjukkan adanya kesalahan pada aplikasi yang sedang berjalan.

**How to apply:** Periksa properti URL yang benar pada runtime, bukan sembarang
URL Supabase yang ditemukan dalam teks konfigurasi. Bila tujuan efektif benar-benar
berbeda, hentikan pembuatan akun/perubahan data; jangan mengganti proyek otomatis.
