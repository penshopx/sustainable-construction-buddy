---
name: Diagnostik subproses terbatas
description: Keamanan output kegagalan subproses saat log dibatasi ukurannya.
---

Saat menampilkan output subproses yang gagal, samarkan nilai rahasia dari lingkungan termasuk variabel bernama `*_KEY`, lalu batasi panjang hasilnya. Jika hanya menyimpan bagian akhir output, pertahankan overlap sepanjang nilai sensitif terpanjang saat menangkap output, kemudian buang overlap awal itu setelah penyamaran dan sebelum pemotongan akhir. Overlap awal mungkin sudah dimulai di tengah nilai rahasia.

**Why:** Pemotongan output mentah sebelum penyamaran bisa membuang awal kredensial, menyisakan akhiran yang tidak lagi cocok dengan nilai lengkap. Bahkan jika overlap tersimpan, penggantian banyak kemunculan rahasia dengan penanda pendek bisa membuat fragmen di awal buffer masuk kembali ke batas output akhir. Nama kredensial berakhiran `KEY` tidak selalu memuat kata `SECRET` atau `TOKEN`.

**How to apply:** Berlaku untuk skrip validasi atau publikasi yang menampilkan stdout/stderr subproses pada log CI.