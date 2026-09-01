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
    enrollments: [],
    courses: [{
      id: COURSE_ID,
      course_code: "ASPEKINDO-LMS-ADMIN-01",
      slug: "fondasi-siap-proyek",
      title: "Fondasi SIAP Proyek",
      description_markdown: "Pembelajaran awal untuk admin.",
      audience: "Anggota BUJK",
      status: "draft",
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
    const url = new URL(request.url());
    const endpoint = url.pathname.split("/").pop();
    const objectRequested = request.headers().accept?.includes("vnd.pgrst.object");

    if (endpoint === "user_roles") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ role: "admin" }]) });
      return;
    }

    if (endpoint === "profiles") {
      const adminProfile = {
        user_id: ADMIN_ID,
        full_name: "Admin LMS",
        company: "PUB ASPEKINDO",
      };
      const participantProfile = {
        user_id: "00000000-0000-4000-8000-000000000904",
        full_name: "Peserta Baru",
        company: "BUJK Uji",
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(objectRequested ? adminProfile : [adminProfile, participantProfile]),
      });
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

    if (endpoint === "aspekindo_lms_enrollments") {
      if (request.method() === "POST") {
        const body = request.postDataJSON();
        state.enrollments.push({
          ...body,
          id: "00000000-0000-4000-8000-000000000905",
          enrolled_at: new Date().toISOString(),
        });
        await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(state.enrollments) });
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

test.describe("operasi LMS ASPEKINDO native", () => {
  test("admin membuka ruang native dan membuat kursus draft", async ({ page }) => {
    await installAdminSession(page);
    await page.goto("/admin/lms-aspekindo");

    await expect(page.getByRole("heading", { name: "Kelola LMS ASPEKINDO" })).toBeVisible();
    await expect(page.getByText("Terpisah dari Operasi Kegiatan PUB legacy")).toBeVisible();
    await expect(page.getByText("Fondasi SIAP Proyek").first()).toBeVisible();

    await page.getByRole("button", { name: "Tambah kursus" }).click();
    await page.getByLabel("Judul kursus *").fill("Manajemen Risiko Tender");
    await expect(page.getByLabel("Slug *")).toHaveValue("manajemen-risiko-tender");
    await page.getByRole("button", { name: "Simpan kursus" }).click();

    await expect(page.getByText("Manajemen Risiko Tender").first()).toBeVisible();
    await expect(page.getByText("ASPEKINDO-LMS-ADMIN-02").first()).toBeVisible();

    await page.getByRole("button", { name: "Pratinjau" }).click();
    await expect(page.getByRole("dialog")).toContainText("Pratinjau kursus");
    await expect(page.getByRole("dialog")).toContainText("Manajemen Risiko Tender");
    await page.getByRole("button", { name: "Tutup pratinjau" }).click();

    await page.getByRole("tab", { name: "Peserta & bukti" }).click();
    await page.getByRole("button", { name: "Tambah peserta" }).click();
    await page.getByRole("dialog").getByRole("combobox").first().click();
    await page.getByText("Peserta Baru · BUJK Uji").click();
    await page.getByRole("button", { name: "Simpan enrollment" }).click();

    await expect(page.getByText("Peserta Baru")).toBeVisible();
    await expect(page.getByText("BUJK Uji")).toBeVisible();
    await page.getByLabel("Cari peserta LMS").fill("tidak ditemukan");
    await expect(page.getByText("Tidak ada peserta yang cocok dengan filter.")).toBeVisible();
    await page.getByLabel("Cari peserta LMS").fill("");
    await expect(page.getByText("Peserta Baru")).toBeVisible();
  });
});