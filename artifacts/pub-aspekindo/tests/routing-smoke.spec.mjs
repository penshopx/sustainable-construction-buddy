import { expect, test } from "@playwright/test";

test("rute publik utama dari build aplikasi aktif dapat dibuka", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Standar Sertifikasi BUJK Diperbarui/ })).toBeVisible();

  await page.goto("/simulator-sbu");
  await expect(page.getByRole("heading", { name: "Ukur kesiapan BUJK sebelum mengurus SBU" })).toBeVisible();

  await page.goto("/simulator-lkut");
  await expect(page.getByRole("heading", { name: "Ukur kesiapan dokumen LKUT BUJK" })).toBeVisible();

  await page.goto("/program-kegiatan");
  await expect(page.getByRole("heading", { name: "Ruang kolaborasi untuk BUJK yang terus bertumbuh." })).toBeVisible();
});

test("rute anggota dan alias mewajibkan login tanpa sesi", async ({ page }) => {
  for (const path of ["/dashboard", "/assessment", "/siap-kompetensi", "/aspekindo-lms", "/ai-helpdesk"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole("heading", { name: "Masuk ke Akun" })).toBeVisible();
  }
});

test("rute tidak dikenal menampilkan halaman 404", async ({ page }) => {
  await page.goto("/rute-tidak-tersedia");
  await expect(page).toHaveURL(/\/rute-tidak-tersedia$/);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});