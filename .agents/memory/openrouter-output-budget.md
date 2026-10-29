---
name: Pemeriksaan batas keluaran OpenRouter
description: Mengapa uji prompt pendek belum membuktikan permintaan AI aplikasi yang sebenarnya.
---

Keberhasilan panggilan OpenRouter dengan batas keluaran kecil belum membuktikan bahwa permintaan aplikasi dengan batas keluaran lebih besar dapat berjalan.

**Why:** OpenRouter dapat menolak permintaan dengan status 402 berdasarkan biaya maksimum keluaran yang diminta, sementara model dan kunci yang sama menerima permintaan kecil.

**How to apply:** Saat mendiagnosis AI, cocokkan model, kebijakan provider, dan max_tokens aplikasi. Jangan mengganti model diam-diam atau menganggap kegagalan ini sebagai kegagalan autentikasi/dokumen. Laporkan batas kredit tanpa membocorkan respons mentah provider.
