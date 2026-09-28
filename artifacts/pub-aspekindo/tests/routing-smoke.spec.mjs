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

test("rute anggota, admin, dan alias mewajibkan login tanpa sesi", async ({ page }) => {
  for (const path of ["/dashboard", "/assessment", "/siap-kompetensi", "/aspekindo-lms", "/ai-helpdesk", "/admin", "/admin/users"]) {
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
const ASSESSMENT_ID = "00000000-0000-4000-8000-000000000032";
const assessmentQuestions = [
  {
    id: "00000000-0000-4000-8000-000000000033",
    question_text: "Apa dokumen pertama yang perlu disiapkan?",
    options: ["Dokumen legalitas", "Dokumen lain"],
    difficulty: "Mudah",
    domain_id: "00000000-0000-4000-8000-000000000035",
    created_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000034",
    question_text: "Apa langkah berikutnya dalam evaluasi?",
    options: ["Lewati evaluasi", "Periksa kesiapan"],
    difficulty: "Sedang",
    domain_id: "00000000-0000-4000-8000-000000000036",
    created_at: "2026-09-01T00:00:00.000Z",
  },
];
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
  "notifications", "pre_tests", "aspekindo_members",
  "aspekindo_pub_activities", "aspekindo_activity_enrollments",
  "aspekindo_activity_evidence", "module_progress", "certificates",
  "pancek_assessments", "lkut_reports", "smap_documents", "projects",
  "lkut_project_data", "risk_registers", "budget_entries", "k3_checklists",
  "competency_scores", "aspekindo_lms_enrollments",
  "aspekindo_lms_lesson_progress", "aspekindo_lms_quiz_attempts",
  "aspekindo_lms_completion_records", "aspekindo_learning_agendas",
  "aspekindo_lms_sessions", "aspekindo_lms_lessons",
]);

async function installAuthenticatedFixture(page, { asAdmin = false, assessment = null } = {}) {
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
    } else if (url.pathname === "/rest/v1/user_roles") {
      data = asAdmin ? [{ role: "admin" }] : [];
    } else if (url.pathname === "/functions/v1/competency-insight") {
      data = { source: "deterministic", recommendations: [], generatedAt: "2026-09-01T00:00:00.000Z" };
    } else if (url.pathname === "/rest/v1/aspekindo_lms_courses") {
      data = url.searchParams.get("select") === "*" ? [course] : [{ id: COURSE_ID, title: course.title }];
    } else if (assessment && url.pathname === "/rest/v1/rpc/get_questions_safe" && request.method() === "POST") {
      data = assessmentQuestions;
    } else if (assessment && url.pathname === "/rest/v1/competency_domains" && request.method() === "GET") {
      data = [
        { id: assessmentQuestions[0].domain_id, name: "Legalitas" },
        { id: assessmentQuestions[1].domain_id, name: "Manajemen" },
      ];
    } else if (assessment && url.pathname === "/rest/v1/pre_tests" && request.method() === "POST") {
      assessment.started = request.postDataJSON();
      data = { id: ASSESSMENT_ID, ...assessment.started, status: "in_progress" };
    } else if (assessment && url.pathname === "/rest/v1/pre_tests" && request.method() === "GET") {
      data = assessment.submitted ? [{
        id: ASSESSMENT_ID, user_id: MEMBER_ID, status: "completed",
        score: 50, determined_level: "Pemula", completed_at: "2026-09-01T01:00:00.000Z",
      }] : [];
    } else if (assessment && url.pathname === "/rest/v1/rpc/check_question_answer" && request.method() === "POST") {
      const answer = request.postDataJSON();
      assessment.checks.push(answer);
      const question = assessmentQuestions.find((q) => q.id === answer._question_id);
      if (question && Number.isInteger(answer._selected_answer)) {
        const correctAnswer = question === assessmentQuestions[0] ? 0 : 1;
        data = {
          is_correct: answer._selected_answer === correctAnswer,
          correct_answer: correctAnswer,
          explanation: "Penjelasan soal uji.",
        };
      }
    } else if (assessment && url.pathname === "/rest/v1/rpc/submit_assessment" && request.method() === "POST") {
      assessment.submission = request.postDataJSON();
      assessment.submitted = true;
      data = { score: 50, level: "Pemula", correct: 1, total: 2 };
    } else if (url.pathname.startsWith("/rest/v1/") && emptyTables.has(endpoint)) {
      data = [];
    } else if (url.pathname === "/rest/v1/profiles") {
      const profile = {
        user_id: MEMBER_ID, full_name: "Anggota Uji", company: "BUJK Uji",
        position: "Anggota", current_level: "Pemula", total_score: 0,
        created_at: "2026-09-01T00:00:00.000Z",
      };
      data = single ? profile : [profile];
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
    const unexpected = await installAuthenticatedFixture(page);
    await page.goto("/assessment");
    await expect(page).toHaveURL(/\/assessment$/);
    await expect(page.getByRole("heading", { name: "Pre-test Assessment" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mulai Assessment" })).toBeVisible();
    await expect(page.getByText("Belum ada assessment yang selesai.")).toBeVisible();
    expect(unexpected).toEqual([]);
  });

  test("anggota menyelesaikan assessment dan melihat hasil dari respons server", async ({ page }) => {
    const assessment = { started: null, checks: [], submission: null, submitted: false };
    const unexpected = await installAuthenticatedFixture(page, { assessment });
    await page.goto("/assessment");
    await expect(page.getByRole("button", { name: "Mulai Assessment" })).toBeVisible();
    await page.getByRole("button", { name: "Mulai Assessment" }).click();

    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();
    await expect(page.getByText("Soal 1/2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Selanjutnya" })).toBeDisabled();
    await page.getByRole("button", { name: /Dokumen legalitas/ }).click();
    await expect(page.getByText("Penjelasan soal uji.")).toBeVisible();
    await page.getByRole("button", { name: "Selanjutnya" }).click();

    await expect(page.getByRole("heading", { name: assessmentQuestions[1].question_text })).toBeVisible();
    await page.getByRole("button", { name: /Lewati evaluasi/ }).click();
    await expect(page.getByText("Penjelasan soal uji.")).toBeVisible();
    await page.getByRole("button", { name: "Review Jawaban" }).click();
    await expect(page.getByRole("heading", { name: "Review Jawaban" })).toBeVisible();
    await page.getByRole("button", { name: "Selesai & Lihat Hasil" }).click();

    await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toBeVisible();
    await expect(page.getByText("Skor: 50")).toBeVisible();
    await expect(page.getByText("Level Kompetensi Anda:")).toBeVisible();
    await expect(page.getByText("1 dari 2 jawaban benar")).toBeVisible();
    expect(assessment.started).toEqual({ user_id: MEMBER_ID, total_questions: 2 });
    expect(assessment.checks).toEqual([
      { _question_id: assessmentQuestions[0].id, _selected_answer: 0 },
      { _question_id: assessmentQuestions[1].id, _selected_answer: 0 },
    ]);
    expect(assessment.submission).toEqual({
      _pre_test_id: ASSESSMENT_ID,
      _answers: assessmentQuestions.map((q) => ({ question_id: q.id, selected_answer: 0 })),
    });
    expect(unexpected).toEqual([]);
  });

  test("peta kompetensi memuat hasil kesiapan anggota", async ({ page }) => {
    const unexpected = await installAuthenticatedFixture(page);
    await page.goto("/siap-kompetensi");
    await expect(page).toHaveURL(/\/siap-kompetensi$/);
    await expect(page.getByRole("heading", { name: "Peta kesiapan usaha" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Legalitas" })).toBeVisible();
    expect(unexpected).toEqual([]);
  });

  test("LMS menampilkan katalog pembelajaran untuk anggota", async ({ page }) => {
    const unexpected = await installAuthenticatedFixture(page);
    await page.goto("/aspekindo-lms");
    await expect(page).toHaveURL(/\/aspekindo-lms$/);
    await expect(page.getByRole("heading", { name: "Katalog pembelajaran ASPEKINDO" })).toBeVisible();
    await expect(page.getByRole("heading", { name: course.title })).toBeVisible();
    expect(unexpected).toEqual([]);
  });
});

test.describe("halaman admin dengan sesi tiruan", () => {
  test("admin membuka panel dan pengelolaan pengguna", async ({ page }) => {
    const unexpected = await installAuthenticatedFixture(page, { asAdmin: true });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Panel Admin" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Data Pengguna" })).toBeVisible();

    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole("heading", { name: "Data Pengguna" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Anggota Uji" })).toBeVisible();
    expect(unexpected).toEqual([]);
  });

  test("anggota biasa dialihkan dari panel dan pengelolaan pengguna", async ({ page }) => {
    await installAuthenticatedFixture(page);

    for (const path of ["/admin", "/admin/users"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { name: "Panel Admin" })).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Data Pengguna" })).toHaveCount(0);
    }
  });
});