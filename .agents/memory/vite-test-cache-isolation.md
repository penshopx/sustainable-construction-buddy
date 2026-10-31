---
name: Isolasi cache Vite untuk pengujian SSR
description: Pengujian Node yang membuat server Vite dapat mengganggu preview aktif bila memakai cache optimasi yang sama
---

Pisahkan cache optimasi dependensi server Vite pengujian dari cache server preview, terutama bila konfigurasi optimasinya berbeda.

**Why:** Menjalankan pengujian SSR saat preview aktif pernah mengubah cache dependensi yang dipakai preview; browser menerima 504 untuk modul optimasi meskipun workflow dan HTML utama tetap sehat. Restart preview memulihkannya.

**How to apply:** Beri server Vite pengujian direktori cache tersendiri. Jika preview mendadak kosong setelah pengujian Node, bedakan kegagalan modul optimasi dari kegagalan kode aplikasi; jangan mengubah autentikasi untuk memperbaiki gejala cache.
