---
name: Tujuan rilis produksi
description: Konfirmasi pemilik atas tujuan Supabase produksi dan batas izin konfigurasi.
---

Pemilik mengonfirmasi `yidlglstzvizsszrpobi` sebagai tujuan Supabase produksi
pada 29 Oktober 2026 dan mengizinkan penyetelan `SUPABASE_PROJECT_REF` pada
lingkungan produksi. Izin tersebut tidak mencakup publikasi atau deploy.

**Why:** Pemilik sebelumnya belum dapat memastikan tujuan produksi; nilai yang
terlihat di dashboard atau TOML saja bukan persetujuan. Konfirmasi akhirnya
diberikan secara eksplisit, khusus untuk tujuan dan konfigurasi tersebut.

**How to apply:** Pertahankan pemisahan konfigurasi produksi dari pengujian dan
development. Jika tujuan berubah, minta konfirmasi baru; jangan menyalin ref
otomatis dari TOML sebagai bukti otorisasi. Keberhasilan pemeriksaan konfigurasi
tanpa deploy bukan bukti bahwa aplikasi atau fungsi produksi telah diterbitkan.
