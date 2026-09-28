---
name: Uji RPC LMS terisolasi
description: Batas cakupan pengujian fungsi database LMS pada PostgreSQL lokal.
---

Jalankan definisi fungsi migrasi yang sebenarnya pada database PostgreSQL lokal terisolasi untuk menguji penilaian dan transisi status. Jangan menganggap skema minimal ini juga menguji kebijakan RLS, grant, dan seluruh trigger dari migrasi Supabase.

**Why:** Pengujian browser yang memakai fixture tidak pernah menjalankan fungsi SQL. Uji lokal yang menjalankan fungsi asli menemukan pemanggilan fungsi JSONB yang tidak ada di PostgreSQL, tanpa menyentuh data hosted.

**How to apply:** Untuk perubahan skor dan penyelesaian LMS, pertahankan uji fungsi lokal yang cepat; bila perubahan melibatkan hak akses, trigger, atau skema lengkap, tambahkan uji pada database Supabase pengujian dengan semua migrasi terpasang.