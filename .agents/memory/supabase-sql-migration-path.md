---
name: Supabase SQL migration path
description: Prinsip memilih jalur migrasi hosted Supabase dan menangani kegagalan izin secara aman.
---

Gunakan metadata resmi project untuk memperoleh endpoint database; jangan menebak host atau cluster dari region. Jalur SQL alternatif tetap membutuhkan identitas yang memiliki privilege database pada project tujuan.

**Why:** Endpoint yang tampak valid dapat tetap menunjuk tenant yang salah, sedangkan kegagalan izin tidak akan pulih lewat retry. PostgreSQL juga melarang penggunaan nilai enum baru dalam transaksi yang sama sebelum nilainya dikomit.

**How to apply:** Verifikasi identitas project dan hak akses sebelum migrasi. Retry hanya kegagalan sementara seperti throttling; untuk penolakan izin, perbaiki role atau gunakan jalur yang dijalankan pemilik project. Pisahkan transaksi penambahan enum dari migrasi yang memakainya. Jangan pernah menyimpan atau mencetak kredensial.