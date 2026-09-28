---
name: Logout di perangkat bersama
description: Keputusan privasi untuk cadangan draf assessment lokal setelah sesi berakhir
---

Saat sesi keluar, semua cadangan draf assessment yang tertinggal di browser harus dibersihkan, termasuk hasil penulisan asinkron yang dimulai sebelum logout. Draf yang telah tersimpan di server tetap dapat dipulihkan setelah masuk kembali; cadangan lokal yang belum terkirim sengaja tidak bertahan melewati logout.

**Why:** Pada perangkat bersama, kehilangan cadangan offline lebih aman daripada meninggalkan soal dan jawaban anggota untuk pengguna berikutnya.

**How to apply:** Saat mengubah mekanisme penyimpanan atau pemulihan draf, pertahankan batas sesi ini dan pastikan respons jaringan yang terlambat tidak menghidupkan kembali cadangan setelah logout.