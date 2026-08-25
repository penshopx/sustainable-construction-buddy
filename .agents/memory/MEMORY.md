# Agent Memory

- [Blocked packages & stubs](blocked-packages.md) — html2pdf.js dan xlsx diblokir Replit; pakai alias Vite ke stub lokal.
- [Supabase kept on Replit](supabase-kept.md) — Supabase tidak diganti Replit Postgres; terlalu dalam untuk migrasi penuh.
- [Imported Node dependency setup](imported-node-dependency-setup.md) — proyek impor dapat memiliki lockfile tanpa node_modules; instalasi dapat menyegarkan dependency transitive.
- [Post-merge hook](post-merge-hook.md) — proyek impor membutuhkan path hook eksplisit di konfigurasi Replit agar setup pasca-merge berjalan.
- [Brand architecture](brand-architecture.md) — PUB adalah payung; DokumenProyek kemitraan/helpdesk, PT SKI pengelola, Gustafta engine, LKUT-PUB-LSBU produk asli.
- [React compiler on Replit](react-compiler-on-replit.md) — gunakan plugin React berbasis Babel bila binding SWC native memicu Bus error saat Vite mulai.
- [Startup smoke gate](startup-smoke-gate.md) — jalankan smoke sebelum preview, klaim port eksklusif, dan pastikan proses yang diuji tetap hidup.
