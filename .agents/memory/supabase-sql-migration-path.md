---
name: Supabase SQL migration path
description: Jalur aman untuk migrasi hosted Supabase saat koneksi MCP atau password pooler tidak tersedia.
---

Gunakan metadata project Supabase untuk memperoleh host pooler yang tepat; jangan menebak nomor cluster dari region. Jika koneksi MCP tidak memberikan kredensial atau password pooler ditolak, Supabase Management Database Query API dengan personal access token adalah jalur SQL resmi yang dapat dipakai untuk inspeksi dan migrasi. Namun token tetap harus berasal dari akun dengan privilege database project; token yang valid dapat menjawab `403 necessary privileges` dan tidak akan bisa dipulihkan dengan retry.

**Why:** Host pooler yang tampak valid dapat menjawab tetapi menolak tenant jika nomor cluster salah, sementara password tersimpan dapat berasal dari project lama. Pada project ini, MCP menolak operasi SQL dengan permission error dan Management API menolak token workspace dengan HTTP 403 karena privilege akun, sehingga mengulang kedua jalur tanpa perubahan role tidak membantu. Database Query API juga menerapkan rate limit. Selain itu, nilai enum PostgreSQL yang baru ditambahkan harus dikomit sebelum dipakai dalam fungsi atau ekspresi berikutnya.

**How to apply:** Ambil metadata project dan pooler terlebih dahulu, rekam kondisi awal tanpa PII, lalu terapkan migrasi berurutan dan catat riwayatnya. Beri jeda/retry pada HTTP 429, tetapi untuk HTTP 403 minta project owner menaikkan role akun token atau jalankan migration melalui SQL Editor Supabase oleh pemilik project. Komit penambahan enum dalam transaksi tersendiri sebelum menjalankan migrasi yang memakai nilai tersebut. Jangan pernah mencetak token, password, connection string, atau data pengguna.