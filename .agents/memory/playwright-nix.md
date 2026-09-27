---
name: Playwright di Nix
description: Perbedaan dependensi native browser Playwright pada workspace Nix dan GitHub Actions Ubuntu.
---

Instalasi browser Playwright yang sukses belum memastikan browser dapat diluncurkan di workspace Nix. Bila semua tes gagal sebelum halaman dibuat, periksa pesan pustaka bersama yang hilang, bukan mengubah tes aplikasi. Dalam satu pengujian lokal, pustaka GLib dan kemudian GBM diperlukan; pemasangan dependensi Nix untuk keduanya memungkinkan browser berjalan.

**Why:** Perintah pemasangan Chromium hanya mengunduh browser; lingkungan Nix tidak otomatis menyediakan semua pustaka bersama seperti runner GitHub Actions Ubuntu.

**How to apply:** Bila pengujian browser lokal gagal saat peluncuran, periksa pesan error browser dan pasang dependensi sistem lewat fasilitas package-management. Jangan simpulkan kegagalan CI dari kegagalan pustaka lokal; verifikasi CI memakai runner dan langkah instalasi dependensinya sendiri.