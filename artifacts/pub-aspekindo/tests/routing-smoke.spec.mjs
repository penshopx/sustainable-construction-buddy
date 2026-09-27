import { expect, test } from "@playwright/test";

test("rute publik utama dari build aplikasi aktif dapat dibuka", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Standar Sertifikasi BUJK Diperbarui/ })).toBeVisible();

  await page.goto("/simulator-sbu");
  await expect(page.getByRole("heading", { name: "Ukur kesiapan BUJK sebelum mengurus SBU", level: 1 })).toBeVisible();

  await page.goto("/simulator-lkut");
  await expect(page.getByRole("heading", { name: "Ukur kesiapan dokumen LKUT BUJK", level: 1 })).toBeVisible();

  await page.goto("/program-kegiatan");
  await expect(page.getByRole("heading", { name: "Ruang kolaborasi untuk BUJK yang terus bertumbuh.", level: 1 })).toBeVisible();
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

// CI builds against ci-playwright.supabase.co. Nothing here uses a real account or database.
const SUPABASE_HOST = "ci-playwright.supabase.co";
const MEMBER_ID = "00000000-0000-4000-8000-000000000030";
const COURSE_ID = "00000000-0000-4000-8000-000000000031";
const member = {
  id: MEMBER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "anggota@example.test",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { full_name: "Anggota Uji" },
  created_at: "2026-09-01T00:00:00.000Z",
};
const course = {
  id: COURSE_ID,
  course_code: "LMS-UJI-01",
  title: "Kursus Uji Anggota",
  description_markdown: "Materi latihan untuk anggota.",
  audience: "Anggota BUJK",
  status: "published",
  agenda_id: null,
  created_at: "2026-09-01T00:00:00.000Z",
};

const emptyTables = new Set([
  "notifications", "user_roles", "pre_tests", "aspekindo_members",
  "aspekindo_pub_activities", "aspekindo_activity_enrollments",
  "aspekindo_activity_evidence", "module_progress", "certificates",
  "pancek_assessments", "lkut_reports", "smap_documents", "projects",
  "lkut_project_data", "risk_registers", "budget_entries", "k3_checklists",
  "competency_scores", "aspekindo_lms_enrollments",
  "aspekindo_lms_lesson_progress", "aspekindo_lms_quiz_attempts",
  "aspekindo_lms_completion_records", "aspekindo_learning_agendas",
  "aspekindo_lms_sessions", "aspekindo_lms_lessons",
]);

async function installMemberFixture(page) {
  const unexpectedRequests = [];
  await page.addInitScript(({ user, hostname }) => {
    localStorage.setItem(`sb-${hostname.split(".")[0]}-auth-token`, JSON.stringify({
      access_token: "test-only-access-token",
      refresh_token: "test-only-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }));
    localStorage.setItem("pub_onboarding_done", "1");
  }, { user: member, hostname: SUPABASE_HOST });

  // Intercept every Supabase HTTP call, including unexpected ones; never let a
  // test request escape to a live project if the build configuration changes.
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const endpoint = url.pathname.split("/").pop();
    const single = request.headers().accept?.includes("vnd.pgrst.object");
    let data;

    if (url.hostname !== SUPABASE_HOST) {
      unexpectedRequests.push(`${request.method()} ${url.hostname}${url.pathname}`);
    } else if (url.pathname === "/auth/v1/user") {
      data = member;
    } else if (url.pathname === "/rest/v1/rpc/current_user_is_super_admin") {
      data = false;
    } else if (url.pathname === "/functions/v1/competency-insight") {
      data = { source: "deterministic", recommendations: [], generatedAt: "2026-09-01T00:00:00.000Z" };
    } else if (url.pathname === "/rest/v1/aspekindo_lms_courses") {
      data = url.searchParams.get("select") === "*" ? [course] : [{ id: COURSE_ID, title: course.title }];
    } else if (url.pathname.startsWith("/rest/v1/") && emptyTables.has(endpoint)) {
      data = [];
    } else if (url.pathname === "/rest/v1/profiles") {
      data = { user_id: MEMBER_ID, full_name: "Anggota Uji", current_level: "Pemula" };
    } else {
      unexpectedRequests.push(`${request.method()} ${url.pathname}`);
    }

    await route.fulfill({
      status: data === undefined ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(data === undefined ? { message: "Unexpected test request" } : single && Array.isArray(data) ? data[0] ?? null : data),
    });
  });
  return unexpectedRequests;
}

test.describe("halaman anggota dengan sesi tiruan", () => {
  test("assessment menampilkan formulir awal dan riwayat", async ({ page }) => {
    const unexpected = await installMemberFixture(page);
    await page.goto("/assessment");
    await expect(page).toHaveURL(/\/assessment$/);
    await expect(page.getByRole("heading", { name: "Pre-test Assessment" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mulai Assessment" })).toBeVisible();
    await expect(page.getByText("Belum ada assessment yang selesai.")).toBeVisible();
    expect(unexpected).toEqual([]);
  });

  test("peta kompetensi memuat hasil kesiapan anggota", async ({ page }) => {
    const unexpected = await installMemberFixture(page);
    await page.goto("/siap-kompetensi");
    await expect(page).toHaveURL(/\/siap-kompetensi$/);
    await expect(page.getByRole("heading", { name: "Peta kesiapan usaha" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Legalitas" })).toBeVisible();
    expect(unexpected).toEqual([]);
  });

  test("LMS menampilkan katalog pembelajaran untuk anggota", async ({ page }) => {
    const unexpected = await installMemberFixture(page);
    await page.goto("/aspekindo-lms");
    await expect(page).toHaveURL(/\/aspekindo-lms$/);
    await expect(page.getByRole("heading", { name: "Katalog pembelajaran ASPEKINDO" })).toBeVisible();
    await expect(page.getByRole("heading", { name: course.title })).toBeVisible();
    expect(unexpected).toEqual([]);
  });
});