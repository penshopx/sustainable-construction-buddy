import { expect, test } from "@playwright/test";

test.describe("public and unauthenticated user flows", () => {
  test("loads the public landing page and opens authentication", async ({ page }) => {
    await page.goto("/");
    const joinCta = page
      .getByRole("button", {
        name: "Bergabung & Jadilah Kontraktor Berdaya Saing",
        exact: true,
      })
      .first();

    await expect(page).toHaveTitle(/PUB Konstruksi/);
    await expect(
      page.getByRole("heading", {
        name: /Industri Konstruksi Berubah Cepat/,
      }),
    ).toBeVisible();
    await expect(joinCta).toBeVisible();

    await joinCta.click();

    await expect(page).toHaveURL(/\/auth$/);
    await expect(
      page.getByRole("heading", { name: "Masuk ke Akun" }),
    ).toBeVisible();
  });

  test("redirects an empty dashboard session to a usable auth state", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/auth$/);
    await expect(
      page.getByRole("heading", { name: "Masuk ke Akun" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("email@perusahaan.com")).toBeVisible();
    await expect(page.getByPlaceholder("Minimal 6 karakter")).toBeVisible();

    await page.getByRole("button", { name: "Lupa password?" }).click();

    await expect(
      page.getByRole("heading", { name: "Lupa Password" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Kirim Link Reset" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Kembali ke login" }).click();
    await expect(
      page.getByRole("heading", { name: "Masuk ke Akun" }),
    ).toBeVisible();
  });
});