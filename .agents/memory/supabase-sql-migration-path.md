---
name: Supabase SQL migration path
description: Jalur aman untuk migrasi hosted Supabase saat koneksi MCP atau password pooler tidak tersedia.
---

Gunakan metadata project Supabase untuk memperoleh host pooler yang tepat; jangan menebak nomor cluster dari region. Jika koneksi MCP tidak memberikan kredensial atau password pooler ditolak, Supabase Management Database Query API dengan personal access token adalah jalur SQL resmi yang dapat dipakai untuk inspeksi dan migrasi.

**Why:** Host pooler yang tampak valid dapat menjawab tetapi menolak tenant jika nomor cluster salah, sementara password tersimpan dapat berasal dari project lama. Database Query API juga menerapkan rate limit. Selain itu, nilai enum PostgreSQL yang baru ditambahkan harus dikomit sebelum dipakai dalam fungsi atau ekspresi berikutnya.

**How to apply:** Ambil metadata project dan pooler terlebih dahulu, rekam kondisi awal tanpa PII, lalu terapkan migrasi berurutan dan catat riwayatnya. Beri jeda/retry pada HTTP 429. Komit penambahan enum dalam transaksi tersendiri sebelum menjalankan migrasi yang memakai nilai tersebut. Jangan pernah mencetak token, password, connection string, atau data pengguna.