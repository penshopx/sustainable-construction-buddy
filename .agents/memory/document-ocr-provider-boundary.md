---
name: Batas penyedia OCR dokumen
description: Alasan penguncian penyedia dan engine PDF pada OCR privat.
---

Persetujuan OCR menyebut penyedia tertentu. Jangan membiarkan pemrosesan PDF
memakai engine bawaan OpenRouter atau perpindahan provider otomatis ketika
mengubah integrasinya.

**Why:** Dokumentasi OpenRouter menyebut default PDF dapat beralih ke
Mistral OCR bila model tidak menerima file secara native. Itu menambahkan
penerima dokumen di luar penyedia yang dijelaskan pada persetujuan.

**How to apply:** Kunci engine dan provider sesuai persetujuan. Jika kombinasi
tersebut tidak tersedia, tampilkan kegagalan; perluas persetujuan terlebih dulu
sebelum menambahkan penerima file atau fallback.
