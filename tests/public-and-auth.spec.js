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

  test("renders a safe dashboard for a new user without operational data", async ({ page }) => {
    const userId = "00000000-0000-4000-8000-000000000010";
    const fakeUser = {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email: "new-user-without-data@example.test",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: "2026-08-25T00:00:00.000Z",
    };
    const fakeSession = {
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: fakeUser,
    };

    await page.addInitScript(({ session }) => {
      localStorage.setItem(
        "sb-vwbgdyykeiilhffwvnku-auth-token",
        JSON.stringify(session),
      );
      localStorage.setItem("pub_onboarding_done", "1");
    }, { session: fakeSession });

    await page.route("**/auth/v1/**", async (route) => {
      const requestUrl = route.request().url();
      if (requestUrl.endsWith("/user")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(fakeUser),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });

    await page.route("**/rest/v1/**", async (route) => {
      const requestUrl = new URL(route.request().url());
      const table = requestUrl.pathname.split("/").pop();

      if (table === "profiles" && requestUrl.searchParams.has("user_id")) {
        await route.fulfill({
          status: 406,
          contentType: "application/json",
          body: JSON.stringify({
            code: "PGRST116",
            message: "JSON object requested, multiple (or no) rows returned",
            details: "The result contains 0 rows",
            hint: null,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: { "content-range": "*/0" },
        contentType: "application/json",
        body: route.request().method() === "HEAD" ? "" : "[]",
      });
    });

    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "User" })).toBeVisible();
    await expect(page.getByText("Pilih Jabatan Anda")).toBeVisible();
    await expect(page.getByRole("button", { name: /Proyek Aktif/ }).first()).toContainText("0");
    await expect(page.getByRole("button", { name: /Modul Selesai/ }).first()).toContainText("0/0");
    await expect(page.getByRole("button", { name: /Risk Register/ }).first()).toContainText("0");
    await expect(page.getByRole("button", { name: /Budget Warning/ }).first()).toContainText("0");
    await expect(page.getByText("Belum ada progres domain")).toBeVisible();
    await expect(page.getByText("Belum ada asesmen")).toBeVisible();
    await expect(page.getByText("Belum ada laporan")).toBeVisible();
    await expect(page.getByText("0 produk")).toBeVisible();
    await expect(page.getByText("0 order")).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});