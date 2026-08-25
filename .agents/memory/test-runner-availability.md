---
name: Test runner availability
description: Batasan keamanan package registry untuk runner test frontend proyek ini.
---

Jangan mempertahankan konfigurasi atau tipe global test yang merujuk runner frontend bila runner tersebut tidak dapat dipasang secara konsisten dari registry Replit.

**Why:** Versi Vitest yang kompatibel dengan Vite 5 pernah ditolak package firewall karena CVE. Konfigurasi atau test contoh yang tertinggal membuat pemeriksaan tipe gagal sebelum memeriksa kode aplikasi.

**How to apply:** Saat menambahkan kembali test frontend, pilih runner yang lolos firewall dan cocok dengan versi Vite aktif, tambahkan dependency beserta lockfile-nya, lalu aktifkan konfigurasi dan tipe global hanya setelah perintah test serta typecheck berhasil.