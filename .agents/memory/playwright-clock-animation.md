---
name: Jam palsu dan animasi browser
description: Pengujian timer React dengan transisi animasi dan jam Playwright.
---

Untuk uji browser yang mempercepat timer sambil memeriksa layar hasil, jangan selalu memajukan seluruh jam virtual sekaligus. Percepat hanya interval hitung mundur yang relevan dan biarkan frame animasi berjalan dengan waktu normal.

**Why:** Pada alur assessment, jam virtual berhasil mengirim payload saat waktu habis, tetapi tampilan hasil tetap tertahan di layar soal karena transisi AnimatePresence tidak selesai. Memajukan jam lagi atau melanjutkan jam tidak memperbaiki tampilan tersebut.

**How to apply:** Bila uji yang memakai page.clock menunjukkan request berhasil namun layar lama bertahan, periksa animasi transisi sebelum menyimpulkan kode aplikasi gagal. Untuk timer berbasis interval, percepat interval di konteks browser terisolasi dan pertahankan waktu frame serta jaringan biasa.