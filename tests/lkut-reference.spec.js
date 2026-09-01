import { expect, test } from "@playwright/test";

test("LKUT floating chatbot exposes Kepdirjen 281 references", async ({ page }) => {
  await page.goto("/");

  await page.getByTitle("Chatbot LKUT-PUB-LSBUKI").click();
  const referencesButton = page.getByRole("button", {
    name: /Pahami rujukan/,
  });
  await expect(referencesButton).toBeVisible();
  await referencesButton.click();

  await expect(page.getByText("Rujukan chatbot", { exact: true })).toBeVisible();
  await expect(page.getByText("Kepdirjen BK No. 281/KPTS/DK/2026", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Apa itu Kepdirjen Bina Konstruksi Nomor 281/KPTS/DK/2026?", { exact: true }),
  ).toBeVisible();

  await page.getByText("Apa itu Kepdirjen Bina Konstruksi Nomor 281/KPTS/DK/2026?", { exact: true }).click();
  await expect(page.getByText(/Keputusan Direktur Jenderal Bina Konstruksi Nomor 281\/KPTS\/DK\/2026 tanggal 26 Agustus 2026/)).toBeVisible();
});