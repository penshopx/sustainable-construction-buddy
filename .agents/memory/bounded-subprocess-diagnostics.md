---
name: Diagnostik subproses terbatas
description: Keamanan output kegagalan subproses saat log dibatasi ukurannya.
---

Saat menampilkan output subproses yang gagal, samarkan nilai rahasia dari lingkungan termasuk variabel bernama `*_KEY`, lalu batasi panjang hasilnya. Jika hanya menyimpan bagian akhir output, pertahankan overlap sepanjang nilai sensitif terpanjang saat menangkap output. Buang overlap mentah dan token awal yang tidak lengkap sebelum menyamarkan sisa output. Kredensial yang hanya muncul di URL subproses mungkin tidak ada di lingkungan, sehingga nilai lengkapnya tidak dapat dicocokkan setelah batas tangkapan memotong awal URL.

**Why:** Memotong output mentah tanpa overlap bisa membuang awal kredensial, menyisakan akhiran yang tidak lagi cocok. Membuang baris awal seluruhnya bisa menghilangkan pesan kesalahan yang masih berguna pada baris yang sama; membuang token awal sampai batas spasi lebih aman untuk URL tanpa menghilangkan pesan berikutnya. Nama kredensial berakhiran `KEY` tidak selalu memuat kata `SECRET` atau `TOKEN`.

**How to apply:** Berlaku untuk skrip validasi atau publikasi yang menampilkan stdout/stderr subproses pada log CI.

Perlakukan representasi JSON ber-escape sebagai URL saat menyamarkan diagnostik; jangan bergantung pada kredensial yang terdaftar di lingkungan. Batasi normalisasi pada delimiter URL, bukan seluruh pesan JSON.

**Why:** Subproses bisa menghasilkan tautan bertanda tangan dengan kredensial baru. Pemisah parameter ber-escape juga dapat membuat penyamaran generik menelan parameter aman atau rincian kesalahan berikutnya.

**How to apply:** Pertahankan pesan kesalahan dan parameter aman dalam uji keluaran pendek maupun terpotong, dengan nilai sintetis yang tidak terdaftar sebagai rahasia lingkungan.