import { test, expect } from "@playwright/test";

const PROJECT_REFS = ["yidlglstzvizsszrpobi", "vwbgdyykeiilhffwvnku"];
const ADMIN_ID = "00000000-0000-4000-8000-000000000901";
const COURSE_ID = "00000000-0000-4000-8000-000000000902";

async function installAdminSession(page) {
  const user = {
    id: ADMIN_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "admin-lms@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Admin LMS" },
    created_at: "2026-09-01T00:00:00.000Z",
  };
  const session = {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
  const state = {
    courses: [{
      id: COURSE_ID,
      course_code: "ASPEKINDO-LMS-ADMIN-01",
      slug: "fondasi-siap-proyek",
      title: "Fondasi SIAP Proyek",
      description_markdown: "Pembelajaran awal untuk admin.",
      audience: "Anggota BUJK",
      status: "draft",
      siap_focus: "proyek",
      member_only: true,
      agenda_id: null,
      created_by: ADMIN_ID,
      published_at: null,
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
    }],
  };

  await page.addInitScript(({ authSession, projectRefs }) => {
    for (const projectRef of projectRefs) {
      localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(authSession));
    }
    localStorage.setItem("pub_onboarding_done", "1");
  }, { authSession: session, projectRefs: PROJECT_REFS });

  await page.route("**/auth/v1/**", async (route) => {
    if (route.request().url().endsWith("/user")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.route("**/rest/v1/**", async (route) => {
    const request = route.request();
    const endpoint = new URL(request.url()).pathname.split("/").pop();
    const objectRequested = request.headers().accept?.includes("vnd.pgrst.object");

    if (endpoint === "user_roles") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ role: "admin" }]) });
      return;
    }
    if (endpoint === "profiles") {
      const profile = { user_id: ADMIN_ID, full_name: "Admin LMS", company: "PUB ASPEKINDO" };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(objectRequested ? profile : [profile]) });
      return;
    }
    if (endpoint === "aspekindo_lms_courses") {
      if (request.method() === "POST") {
        const body = request.postDataJSON();
        state.courses.unshift({
          ...body,
          id: "00000000-0000-4000-8000-000000000903",
          course_code: "ASPEKINDO-LMS-ADMIN-02",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000903" }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(state.courses) });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { "content-range": "*/0" },
      contentType: "application/json",
      body: request.method() === "HEAD" ? "" : "[]",
    });
  });
}

test("admin keeps access to the incoming native LMS course manager", async ({ page }) => {
  await installAdminSession(page);
  await page.goto("/admin/lms-aspekindo");

  await expect(page.getByRole("heading", { name: "Kelola LMS ASPEKINDO" })).toBeVisible();
  await expect(page.getByText("Terpisah dari Operasi Kegiatan PUB legacy")).toBeVisible();
  await expect(page.getByText("Fondasi SIAP Proyek").first()).toBeVisible();

  await page.getByRole("button", { name: "Tambah kursus" }).click();
  await page.getByLabel("Judul kursus *").fill("Manajemen Risiko Tender");
  await expect(page.getByLabel("Slug *")).toHaveValue("manajemen-risiko-tender");
  await page.getByText("SIAP Sertifikasi", { exact: true }).click();
  await page.getByRole("option", { name: "SIAP Tender" }).click();
  await page.getByRole("button", { name: "Simpan kursus" }).click();

  await expect(page.getByText("Manajemen Risiko Tender").first()).toBeVisible();
  await expect(page.getByText("ASPEKINDO-LMS-ADMIN-02").first()).toBeVisible();
  await page.getByRole("button", { name: "Pratinjau" }).click();
  await expect(page.getByRole("dialog")).toContainText("SIAP Tender");
});