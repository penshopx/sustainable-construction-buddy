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

test("ponsel dapat melompat ke daftar bagian dan membuka-tutup accordion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const explore = page.getByTestId("link-jelajahi-bagian");
  const introduction = page.getByTestId("button-expand-pengenalan");
  const readiness = page.getByTestId("button-expand-kesiapan");
  await expect(explore).toBeVisible();
  await explore.click();
  await expect(page).toHaveURL(/#jelajahi-bagian$/);
  await expect(page.getByRole("heading", { name: "Jelajahi bagian PUB" })).toBeInViewport();
  await expect(introduction).toHaveAttribute("aria-expanded", "false");
  await expect(readiness).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#video-pub")).toHaveCount(0);

  await introduction.click();
  await expect(introduction).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#video-pub")).toBeVisible();
  await readiness.click();
  await expect(introduction).toHaveAttribute("aria-expanded", "false");
  await expect(readiness).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#simulator-kesiapan")).toBeVisible();
  await readiness.click();
  await expect(readiness).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#simulator-kesiapan")).toHaveCount(0);

  await page.goto("/#perjalanan-anggota");
  await expect(page.getByTestId("button-expand-tentang")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#perjalanan-anggota")).toBeVisible();
});

test("desktop tetap menampilkan bagian lengkap tanpa tombol accordion", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByTestId("link-jelajahi-bagian")).toBeHidden();
  await expect(page.getByTestId("button-expand-pengenalan")).toHaveCount(0);
  await expect(page.locator("#video-pub")).toBeVisible();
  await expect(page.locator("#simulator-kesiapan")).toBeVisible();
});

test("rute anggota, admin, dan alias mewajibkan login tanpa sesi", async ({ page }) => {
  for (const path of ["/dashboard", "/assessment", "/siap-kompetensi", "/aspekindo-lms", "/ai-helpdesk", "/admin", "/admin/users", "/admin/akses", "/admin/permintaan"]) {
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
const LESSON_ID = "00000000-0000-4000-8000-000000000037";
const SECOND_LESSON_ID = "00000000-0000-4000-8000-000000000042";
const ENROLLMENT_ID = "00000000-0000-4000-8000-000000000038";
const ADMIN_REQUEST_ID = "00000000-0000-4000-8000-000000000041";
const VIDEO_STORAGE_PATH = "kursus-uji/video-pengenalan.mp4";
const VIDEO_SIGN_PATH = `/storage/v1/object/sign/aspekindo-learning/${VIDEO_STORAGE_PATH}`;
const VIDEO_SIGNED_URL = `https://${SUPABASE_HOST}${VIDEO_SIGN_PATH}?token=video-test-only`;
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

async function advanceAssessmentClock(page, milliseconds) {
  await page.evaluate((elapsed) => {
    const previousNow = Date.now;
    Date.now = () => previousNow() + elapsed;
    document.dispatchEvent(new Event("visibilitychange"));
  }, milliseconds);
}
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
const lesson = {
  id: LESSON_ID,
  course_id: COURSE_ID,
  title: "Mengenal dokumen BUJK",
  content_markdown: "Siapkan **dokumen legalitas BUJK** sebelum memulai proses.",
  passing_score: 0,
  sort_order: 1,
  status: "published",
};
const quizQuestions = [
  {
    id: "00000000-0000-4000-8000-000000000045",
    lesson_id: LESSON_ID,
    question_text: "Dokumen apa yang disiapkan lebih dahulu?",
    options: ["Dokumen legalitas", "Dokumen tidak terkait"],
    sort_order: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000046",
    lesson_id: LESSON_ID,
    question_text: "Apa langkah setelah dokumen terkumpul?",
    options: ["Abaikan pemeriksaan", "Periksa kelengkapan"],
    sort_order: 2,
  },
];
const secondLesson = {
  id: SECOND_LESSON_ID,
  course_id: COURSE_ID,
  title: "Memeriksa kesiapan dokumen",
  content_markdown: "Lanjutkan dengan **pemeriksaan kelengkapan dokumen**.",
  passing_score: 0,
  sort_order: 2,
  status: "published",
};
const material = {
  id: "00000000-0000-4000-8000-000000000039",
  lesson_id: LESSON_ID,
  title: "Daftar periksa dokumen",
  material_type: "text",
  content_markdown: "Periksa akta dan izin usaha.",
  external_url: null,
  sort_order: 1,
};
const videoMaterial = {
  id: "00000000-0000-4000-8000-000000000044",
  lesson_id: LESSON_ID,
  title: "Video pengenalan BUJK",
  material_type: "video",
  content_markdown: null,
  external_url: null,
  storage_path: VIDEO_STORAGE_PATH,
  mime_type: "video/mp4",
  file_size_bytes: 1024 * 1024,
  sort_order: 2,
};
const enrollment = {
  id: ENROLLMENT_ID,
  course_id: COURSE_ID,
  user_id: MEMBER_ID,
  status: "enrolled",
  enrolled_at: "2026-09-01T00:00:00.000Z",
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

async function installAuthenticatedFixture(page, { asAdmin = false, asSuperAdmin = false, roleCheck = null, assessment = null, lms = null } = {}) {
  const unexpectedRequests = [];
  if (lms) {
    lms.progress = [];
    lms.attempts = [];
    lms.completionRequests = [];
  }
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

  // Only local, read-only application assets may pass through. All data calls
  // (including a changed API host) must be fulfilled by this fixture or fail.
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === "127.0.0.1" && request.method() === "GET" &&
        ["document", "script", "stylesheet", "image", "font", "manifest"].includes(request.resourceType()) &&
        !url.pathname.startsWith("/api/") && !url.pathname.startsWith("/rest/")) {
      await route.continue();
      return;
    }
    if (url.hostname === "fonts.googleapis.com" && request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "text/css", body: "" });
      return;
    }
    unexpectedRequests.push(`${request.method()} ${url.hostname}${url.pathname}`);
    await route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"Unexpected test request"}' });
  });

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
    } else if (roleCheck && url.pathname === "/rest/v1/rpc/current_user_is_super_admin") {
      roleCheck.requests++;
      await roleCheck.waitForRelease;
      await route.fulfill(roleCheck.response);
      return;
    } else if (url.pathname === "/rest/v1/rpc/current_user_is_super_admin") {
      data = asSuperAdmin;
    } else if (url.pathname === "/rest/v1/user_roles") {
      data = asAdmin || asSuperAdmin ? [{ role: "admin" }] : [];
    } else if (asSuperAdmin && url.pathname === "/rest/v1/rpc/list_admin_directory") {
      data = [{
        user_id: MEMBER_ID, email: member.email, full_name: "Anggota Uji",
        company: "BUJK Uji", is_admin: false, is_super_admin: false,
      }];
    } else if (asSuperAdmin && url.pathname === "/rest/v1/admin_requests") {
      data = [{
        id: ADMIN_REQUEST_ID, user_id: MEMBER_ID, status: "pending",
        requested_at: "2026-09-01T00:00:00.000Z",
      }];
    } else if (url.pathname === "/functions/v1/competency-insight") {
      data = { source: "deterministic", recommendations: [], generatedAt: "2026-09-01T00:00:00.000Z" };
    } else if (lms?.video && url.pathname === VIDEO_SIGN_PATH && request.method() === "POST") {
      lms.signRequests.push({ path: url.pathname, body: request.postDataJSON() });
      if (lms.failFirstSign && lms.signRequests.length === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ statusCode: "500", error: "StorageError", message: "Gagal membuat tautan sementara" }),
        });
        return;
      }
      data = { signedURL: `/object/sign/aspekindo-learning/${VIDEO_STORAGE_PATH}?token=video-test-only` };
    } else if (lms?.video && url.pathname === VIDEO_SIGN_PATH && request.method() === "GET" &&
               url.searchParams.get("token") === "video-test-only") {
      lms.videoRequests.push(request.url());
      // Keep the simulated media request pending until the DOM assertion; no real
      // video bytes or storage service are needed to check source assignment.
      await new Promise((resolve) => { lms.releaseVideoResponse = resolve; });
      await route.fulfill({ status: 200, contentType: "video/mp4", body: "" });
      return;
    } else if (url.pathname === "/rest/v1/aspekindo_lms_courses") {
      data = url.searchParams.get("select") === "*" ? [course] : [{ id: COURSE_ID, title: course.title }];
    } else if (lms && url.pathname === "/rest/v1/aspekindo_lms_lessons" && request.method() === "GET") {
      data = [lms.quiz ? { ...lesson, passing_score: 75 } : lesson, secondLesson];
    } else if (lms && url.pathname === "/rest/v1/aspekindo_lms_materials" && request.method() === "GET") {
      data = lms.video ? [material, videoMaterial] : [material];
    } else if (lms && url.pathname === "/rest/v1/aspekindo_lms_enrollments" && request.method() === "GET") {
      data = lms.enrolled ? [enrollment] : [];
    } else if (lms && url.pathname === "/rest/v1/rpc/enroll_aspekindo_lms_course" && request.method() === "POST") {
      if (request.postDataJSON()?._course_id === COURSE_ID) {
        lms.enrolled = true;
        data = enrollment;
      }
    } else if (lms && url.pathname === "/rest/v1/aspekindo_lms_lesson_progress" && request.method() === "GET") {
      data = lms.progress;
    } else if (lms && url.pathname === "/rest/v1/aspekindo_lms_lesson_progress" && request.method() === "POST") {
      const progress = request.postDataJSON();
      if ([LESSON_ID, SECOND_LESSON_ID].includes(progress?.lesson_id) &&
          progress?.enrollment_id === ENROLLMENT_ID && progress?.course_id === COURSE_ID &&
          progress?.user_id === MEMBER_ID && progress?.status === "in_progress" &&
          (progress.lesson_id === LESSON_ID || lms.progress.some((item) => item.lesson_id === LESSON_ID && item.status === "completed"))) {
        lms.startedLesson = progress;
        const saved = { id: progress.lesson_id === LESSON_ID ? "00000000-0000-4000-8000-000000000040" : "00000000-0000-4000-8000-000000000043", ...progress };
        lms.progress = [...lms.progress.filter((item) => item.lesson_id !== progress.lesson_id), saved];
        data = single ? saved : [saved];
      }
    } else if (lms && url.pathname === "/rest/v1/rpc/complete_aspekindo_lms_lesson" && request.method() === "POST") {
      const lessonId = request.postDataJSON()?._lesson_id;
      lms.completionRequests.push(lessonId);
      const current = lms.progress.find((item) => item.lesson_id === lessonId && item.status === "in_progress");
      if (current && (lessonId === LESSON_ID ||
          lessonId === SECOND_LESSON_ID && lms.progress.some((item) => item.lesson_id === LESSON_ID && item.status === "completed")) &&
          (!lms.quiz || lessonId !== LESSON_ID || lms.attempts.some((attempt) => attempt.passed))) {
        data = { ...current, status: "completed", progress_percent: 100, completed_at: "2026-09-01T01:00:00.000Z" };
        lms.progress = [...lms.progress.filter((item) => item.lesson_id !== lessonId), data];
      }
    } else if (lms && url.pathname === "/rest/v1/aspekindo_lms_quiz_questions" && request.method() === "GET") {
      data = lms.quiz && url.searchParams.get("lesson_id") === `eq.${LESSON_ID}` ? quizQuestions : [];
    } else if (lms && url.pathname === "/rest/v1/aspekindo_lms_quiz_attempts" && request.method() === "GET") {
      data = lms.attempts.filter((attempt) =>
        (!url.searchParams.has("enrollment_id") || url.searchParams.get("enrollment_id") === `eq.${attempt.enrollment_id}`) &&
        (!url.searchParams.has("lesson_id") || url.searchParams.get("lesson_id") === `eq.${attempt.lesson_id}`)).reverse();
    } else if (lms?.quiz && url.pathname === "/rest/v1/rpc/submit_aspekindo_lms_quiz" && request.method() === "POST") {
      const submission = request.postDataJSON();
      const answers = submission?._answers;
      if (submission?._lesson_id === LESSON_ID && answers && typeof answers === "object" &&
          !Array.isArray(answers) && Object.keys(answers).length === quizQuestions.length &&
          quizQuestions.every((question) => Number.isInteger(answers[question.id]) &&
            answers[question.id] >= 0 && answers[question.id] < question.options.length)) {
        const correct = Number(answers[quizQuestions[0].id] === 0) + Number(answers[quizQuestions[1].id] === 1);
        const score = Math.round(correct / quizQuestions.length * 100);
        data = {
          id: `00000000-0000-4000-8000-${String(50 + lms.attempts.length).padStart(12, "0")}`,
          lesson_id: LESSON_ID, course_id: COURSE_ID, enrollment_id: ENROLLMENT_ID, user_id: MEMBER_ID,
          attempt_number: lms.attempts.length + 1, correct_answers: correct, total_questions: quizQuestions.length,
          score, passed: score >= 75, submitted_at: "2026-09-01T00:30:00.000Z",
        };
        lms.attempts.push(data);
      }
    } else if (assessment && url.pathname === "/rest/v1/rpc/get_questions_safe" && request.method() === "POST") {
      data = assessmentQuestions;
    } else if (assessment && url.pathname === "/rest/v1/competency_domains" && request.method() === "GET") {
      data = [
        { id: assessmentQuestions[0].domain_id, name: "Legalitas" },
        { id: assessmentQuestions[1].domain_id, name: "Manajemen" },
      ];
    } else if (assessment && url.pathname === "/rest/v1/pre_tests" && request.method() === "POST") {
      assessment.starts = (assessment.starts ?? 0) + 1;
      assessment.started = request.postDataJSON();
      data = { id: ASSESSMENT_ID, ...assessment.started, status: "in_progress" };
    } else if (assessment && url.pathname === "/rest/v1/pre_tests" && request.method() === "GET") {
      if (url.searchParams.has("id")) {
        assessment.recoveryChecks = (assessment.recoveryChecks ?? 0) + 1;
        data = assessment.started ? [{
          id: ASSESSMENT_ID, user_id: MEMBER_ID, status: assessment.submitted ? "completed" : "in_progress",
        }] : [];
      } else {
        data = assessment.submitted ? [{
          id: ASSESSMENT_ID, user_id: MEMBER_ID, status: "completed",
          score: assessment.result.score, determined_level: assessment.result.level, completed_at: "2026-09-01T01:00:00.000Z",
        }] : [];
      }
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
      assessment.submissions ??= [];
      assessment.submissions.push(assessment.submission);
      if (assessment.failFirstSubmit && assessment.submissions.length === 1) {
        await route.abort("failed");
        return;
      }
      assessment.successfulSubmissions = (assessment.successfulSubmissions ?? 0) + 1;
      assessment.submitted = true;
      const answers = assessment.submission?._answers;
      if (assessment.submission?._pre_test_id === ASSESSMENT_ID &&
          Array.isArray(answers) && answers.length === assessmentQuestions.length &&
          answers.every((answer, index) => answer.question_id === assessmentQuestions[index].id &&
            Number.isInteger(answer.selected_answer) &&
            answer.selected_answer >= -1 && answer.selected_answer < assessmentQuestions[index].options.length)) {
        const correct = answers.filter((answer, index) => answer.selected_answer === index).length;
        const score = Math.round(correct / assessmentQuestions.length * 100);
        assessment.result = { score, level: "Pemula", correct, total: assessmentQuestions.length };
        data = assessment.result;
      }
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
    expect(assessment.started).toEqual({ user_id: MEMBER_ID, total_questions: 2, status: "in_progress" });
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

  test("jawaban tetap tersedia dan submit dapat diulang setelah jaringan gagal", async ({ page }) => {
    const assessment = {
      started: null, checks: [], submissions: [], submitted: false,
      successfulSubmissions: 0, failFirstSubmit: true,
    };
    const unexpected = await installAuthenticatedFixture(page, { assessment });
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Mulai Assessment" }).click();

    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();
    await page.getByRole("button", { name: /Dokumen legalitas/ }).click();
    await page.getByRole("button", { name: "Selanjutnya" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[1].question_text })).toBeVisible();
    await page.getByRole("button", { name: /Lewati evaluasi/ }).click();
    await page.getByRole("button", { name: "Review Jawaban" }).click();
    await expect(page.getByRole("heading", { name: "Review Jawaban" })).toBeVisible();

    await page.getByRole("button", { name: "Selesai & Lihat Hasil" }).click();
    await expect(page.getByText("Gagal mengirim assessment.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Review Jawaban" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Selesai & Lihat Hasil" })).toBeEnabled();
    await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toHaveCount(0);
    expect(assessment.submissions).toHaveLength(1);
    expect(assessment.successfulSubmissions).toBe(0);

    await page.getByRole("button", { name: "Kembali ke Soal" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();
    await expect(page.getByRole("button", { name: /Dokumen legalitas/ })).toBeDisabled();
    await page.getByRole("button", { name: "Selanjutnya" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[1].question_text })).toBeVisible();
    await expect(page.getByRole("button", { name: /Lewati evaluasi/ })).toBeDisabled();
    await page.getByRole("button", { name: "Review Jawaban" }).click();

    await page.getByRole("button", { name: "Selesai & Lihat Hasil" }).click();
    await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toHaveCount(1);
    await expect(page.getByText("Skor: 50")).toBeVisible();
    expect(assessment.submissions).toEqual([
      {
        _pre_test_id: ASSESSMENT_ID,
        _answers: assessmentQuestions.map((q) => ({ question_id: q.id, selected_answer: 0 })),
      },
      {
        _pre_test_id: ASSESSMENT_ID,
        _answers: assessmentQuestions.map((q) => ({ question_id: q.id, selected_answer: 0 })),
      },
    ]);
    expect(assessment.successfulSubmissions).toBe(1);
    expect(unexpected).toEqual([]);
  });

  test("draf assessment dipulihkan pada soal dan review tanpa membuat pre-test baru", async ({ page }) => {
    const assessment = { started: null, checks: [], submissions: [], submitted: false };
    const unexpected = await installAuthenticatedFixture(page, { assessment });
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Mulai Assessment" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();
    await page.getByRole("button", { name: /Dokumen legalitas/ }).click();
    await expect(page.getByText("Penjelasan soal uji.")).toBeVisible();
    await page.getByRole("button", { name: "Selanjutnya" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[1].question_text })).toBeVisible();
    await page.reload();

    await expect(page.getByRole("heading", { name: assessmentQuestions[1].question_text })).toBeVisible();
    await expect(page.getByText("Soal 2/2")).toBeVisible();
    await page.getByRole("button", { name: "Sebelumnya" }).click();
    await expect(page.getByRole("button", { name: /Dokumen legalitas/ })).toBeDisabled();
    await page.getByRole("button", { name: "Selanjutnya" }).click();
    await page.getByRole("button", { name: /Periksa kesiapan/ }).click();
    await expect(page.getByText("Penjelasan soal uji.")).toBeVisible();
    await page.getByRole("button", { name: "Review Jawaban" }).click();
    await expect(page.getByRole("heading", { name: "Review Jawaban" })).toBeVisible();
    await page.reload();

    await expect(page.getByRole("heading", { name: "Review Jawaban" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Selesai & Lihat Hasil" })).toBeEnabled();
    await page.getByRole("button", { name: "Selesai & Lihat Hasil" }).click();
    await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toBeVisible();
    expect(assessment.starts).toBe(1);
    expect(assessment.recoveryChecks).toBe(2);
    expect(assessment.submissions).toEqual([{
      _pre_test_id: ASSESSMENT_ID,
      _answers: assessmentQuestions.map((q, i) => ({ question_id: q.id, selected_answer: i })),
    }]);
    await expect.poll(() => page.evaluate((id) =>
      localStorage.getItem(`pub_assessment_draft_v1:${id}`), MEMBER_ID)).toBeNull();
    await page.reload();
    await expect(page.getByRole("button", { name: "Mulai Assessment" })).toBeEnabled();
    expect(assessment.starts).toBe(1);
    expect(unexpected).toEqual([]);
  });

  test("draf lama yang sudah selesai tidak dipulihkan", async ({ page }) => {
    const assessment = { started: { user_id: MEMBER_ID, total_questions: 2 }, submitted: true,
      result: { score: 50, level: "Pemula" }, checks: [] };
    const unexpected = await installAuthenticatedFixture(page, { assessment });
    await page.addInitScript(({ id, question }) => {
      localStorage.setItem(`pub_assessment_draft_v1:${id}`, JSON.stringify({
        version: 1, preTestId: "00000000-0000-4000-8000-000000000032",
        questions: [question], answers: {}, answerResults: {},
        currentQ: 0, phase: "test", timeLeft: 90, timedOut: false,
      }));
    }, { id: MEMBER_ID, question: assessmentQuestions[0] });
    await page.goto("/assessment");
    await expect(page.getByRole("button", { name: "Mulai Assessment" })).toBeEnabled();
    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toHaveCount(0);
    expect(assessment.recoveryChecks).toBe(1);
    expect(unexpected).toEqual([]);
  });

  for (const { scenario, answerFirst, expectedScore } of [
    { scenario: "sebagian dijawab", answerFirst: true, expectedScore: 50 },
    { scenario: "tidak ada jawaban", answerFirst: false, expectedScore: 0 },
  ]) {
    test(`waktu habis: ${scenario} dikirim dan hasil sesuai jumlah soal`, async ({ page }) => {
      const assessment = { started: null, checks: [], submissions: [], submitted: false };
      const unexpected = await installAuthenticatedFixture(page, { assessment });
      await page.goto("/assessment");
      await page.getByRole("button", { name: "Mulai Assessment" }).click();
      await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();

      if (answerFirst) {
        await page.getByRole("button", { name: /Dokumen legalitas/ }).click();
        await expect(page.getByText("Penjelasan soal uji.")).toBeVisible();
        await expect(page.getByRole("button", { name: "Selanjutnya" })).toBeEnabled();
      } else {
        await expect(page.getByRole("button", { name: "Selanjutnya" })).toBeDisabled();
      }

      await advanceAssessmentClock(page, 181_000);
      await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toBeVisible();
      await expect(page.getByText(`Skor: ${expectedScore}`)).toBeVisible();
      await expect(page.getByText(`${answerFirst ? 1 : 0} dari 2 jawaban benar`)).toBeVisible();
      expect(assessment.submissions).toEqual([{
        _pre_test_id: ASSESSMENT_ID,
        _answers: [
          { question_id: assessmentQuestions[0].id, selected_answer: answerFirst ? 0 : -1 },
          { question_id: assessmentQuestions[1].id, selected_answer: -1 },
        ],
      }]);
      expect(assessment.checks).toHaveLength(answerFirst ? 1 : 0);
      expect(assessment.successfulSubmissions).toBe(1);
      expect(unexpected).toEqual([]);
    });
  }

  test("pengiriman saat waktu habis dapat dicoba lagi tanpa menjawab ulang", async ({ page }) => {
    const assessment = {
      started: null, checks: [], submissions: [], submitted: false,
      successfulSubmissions: 0, failFirstSubmit: true,
    };
    const unexpected = await installAuthenticatedFixture(page, { assessment });
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Mulai Assessment" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();
    await page.getByRole("button", { name: /Dokumen legalitas/ }).click();
    await expect(page.getByText("Penjelasan soal uji.")).toBeVisible();

    await advanceAssessmentClock(page, 181_000);
    await expect(page.getByRole("heading", { name: "Review Jawaban" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Gagal mengirim assessment.")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Soal yang belum dijawab dihitung salah");
    await expect(page.getByRole("button", { name: "Kembali ke Soal" })).toBeDisabled();
    const retry = page.getByRole("button", { name: "Selesai & Lihat Hasil" });
    await expect(retry).toBeEnabled();
    await retry.click();
    await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toBeVisible();
    await expect(page.getByText("Skor: 50")).toBeVisible();
    expect(assessment.submissions).toHaveLength(2);
    expect(assessment.submissions[0]).toEqual(assessment.submissions[1]);
    expect(assessment.submissions[1]._answers.map(({ selected_answer }) => selected_answer)).toEqual([0, -1]);
    expect(assessment.successfulSubmissions).toBe(1);
    expect(unexpected).toEqual([]);
  });

  test("batas waktu tetap berjalan saat review dan hanya mengirim sekali", async ({ page }) => {
    const assessment = { started: null, checks: [], submissions: [], submitted: false };
    const unexpected = await installAuthenticatedFixture(page, { assessment });
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Mulai Assessment" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();
    await page.getByRole("button", { name: /Dokumen legalitas/ }).click();
    await page.getByRole("button", { name: "Selanjutnya" }).click();
    await page.getByRole("button", { name: /Periksa kesiapan/ }).click();
    await page.getByRole("button", { name: "Review Jawaban" }).click();
    await expect(page.getByRole("heading", { name: "Review Jawaban" })).toBeVisible();

    await advanceAssessmentClock(page, 181_000);
    await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toBeVisible();
    expect(assessment.submissions).toEqual([{
      _pre_test_id: ASSESSMENT_ID,
      _answers: assessmentQuestions.map((q, i) => ({ question_id: q.id, selected_answer: i })),
    }]);
    expect(unexpected).toEqual([]);
  });

  test("tab yang ditinggalkan tidak mendapat tambahan waktu dari interval tertunda", async ({ page }) => {
    const assessment = { started: null, checks: [], submissions: [], submitted: false };
    const unexpected = await installAuthenticatedFixture(page, { assessment });
    // Simulate a throttled background tab: the countdown interval won't fire
    // before we return, but visibilitychange must reconcile with wall time.
    await page.addInitScript(() => {
      const originalSetInterval = window.setInterval.bind(window);
      window.setInterval = ((handler, delay, ...args) =>
        originalSetInterval(handler, delay === 1000 ? 600_000 : delay, ...args));
    });
    await page.goto("/assessment");
    await page.getByRole("button", { name: "Mulai Assessment" }).click();
    await expect(page.getByRole("heading", { name: assessmentQuestions[0].question_text })).toBeVisible();
    await expect(page.getByText("3:00")).toBeVisible();
    await advanceAssessmentClock(page, 30_000);
    await expect(page.getByText("2:30")).toBeVisible();
    await advanceAssessmentClock(page, 151_000);
    await expect(page.getByRole("heading", { name: "Assessment Selesai!" })).toBeVisible();
    expect(assessment.submissions).toHaveLength(1);
    expect(assessment.submissions[0]._answers.map(({ selected_answer }) => selected_answer)).toEqual([-1, -1]);
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

  test("anggota membuka materi pelajaran setelah memilih dan mendaftar kursus dari katalog", async ({ page }) => {
    const lms = { enrolled: false, startedLesson: null };
    const unexpected = await installAuthenticatedFixture(page, { lms });
    await page.goto("/aspekindo-lms");
    await expect(page.getByRole("heading", { name: course.title })).toBeVisible();
    await page.getByRole("link", { name: "Daftar" }).click();

    await expect(page).toHaveURL(new RegExp(`/aspekindo-lms/kursus/${COURSE_ID}$`));
    await expect(page.getByRole("heading", { name: course.title, level: 1 })).toBeVisible();
    await expect(page.getByText("Daftar kursus untuk membuka materi dan kuis.")).toBeVisible();
    await page.getByRole("button", { name: "Daftar kursus" }).click();

    await expect(page.getByRole("heading", { name: lesson.title })).toBeVisible();
    await expect(page.getByText("dokumen legalitas BUJK", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Materi pendukung" })).toBeVisible();
    await expect(page.getByText(material.title)).toBeVisible();
    await expect(page.getByText(material.content_markdown)).toBeVisible();
    await expect.poll(() => lms.startedLesson?.lesson_id).toBe(LESSON_ID);
    expect(unexpected).toEqual([]);
  });

  test("anggota terdaftar menerima URL bertanda tangan untuk video privat tanpa mengambil berkas nyata", async ({ page }) => {
    const lms = { enrolled: true, video: true, signRequests: [], videoRequests: [] };
    const unexpected = await installAuthenticatedFixture(page, { lms });
    try {
      await page.goto(`/aspekindo-lms/kursus/${COURSE_ID}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: lesson.title })).toBeVisible();
      await expect(page.getByText(videoMaterial.title)).toBeVisible();
      const video = page.locator("video").filter({ has: page.locator("source[type='video/mp4']") });
      await expect(video).toBeVisible();
      await expect(video.locator("source")).toHaveAttribute("src", VIDEO_SIGNED_URL);
      await expect(video).toHaveAttribute("controls", "");
      await expect.poll(() => lms.videoRequests).toContain(VIDEO_SIGNED_URL);
      expect(lms.signRequests).toEqual([{ path: VIDEO_SIGN_PATH, body: { expiresIn: 1800 } }]);
      expect(unexpected).toEqual([]);
    } finally {
      lms.releaseVideoResponse?.();
    }
  });

  test("anggota dapat memuat ulang video setelah pembuatan tautan privat gagal", async ({ page }) => {
    const lms = { enrolled: true, video: true, failFirstSign: true, signRequests: [], videoRequests: [] };
    const unexpected = await installAuthenticatedFixture(page, { lms });
    try {
      await page.goto(`/aspekindo-lms/kursus/${COURSE_ID}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(videoMaterial.title)).toBeVisible();
      await expect(page.getByText("Video belum dapat diputar")).toBeVisible();
      const reload = page.getByRole("button", { name: "Muat ulang video" });
      await expect(reload).toBeVisible();
      await expect(page.locator("video source")).toHaveCount(0);
      expect(lms.signRequests).toEqual([{ path: VIDEO_SIGN_PATH, body: { expiresIn: 1800 } }]);
      expect(lms.videoRequests).toEqual([]);

      await reload.click();
      const video = page.locator("video").filter({ has: page.locator("source[type='video/mp4']") });
      await expect(video).toBeVisible();
      await expect(video.locator("source")).toHaveAttribute("src", VIDEO_SIGNED_URL);
      await expect.poll(() => lms.videoRequests).toContain(VIDEO_SIGNED_URL);
      expect(lms.signRequests).toEqual([
        { path: VIDEO_SIGN_PATH, body: { expiresIn: 1800 } },
        { path: VIDEO_SIGN_PATH, body: { expiresIn: 1800 } },
      ]);
      expect(unexpected).toEqual([]);
    } finally {
      lms.releaseVideoResponse?.();
    }
  });

  test("pelajaran kedua terbuka dan dapat dibuka setelah pelajaran pertama selesai", async ({ page }) => {
    const lms = { enrolled: true, startedLesson: null };
    const unexpected = await installAuthenticatedFixture(page, { lms });
    await page.goto(`/aspekindo-lms/kursus/${COURSE_ID}`);

    const secondButton = page.getByRole("button", { name: new RegExp(secondLesson.title) });
    await expect(page.getByRole("heading", { name: lesson.title })).toBeVisible();
    await expect(secondButton).toHaveClass(/cursor-not-allowed/);
    await secondButton.click();
    await expect(page.getByRole("heading", { name: secondLesson.title })).toHaveCount(0);
    await expect.poll(() => lms.progress.find((item) => item.lesson_id === LESSON_ID)?.status).toBe("in_progress");

    await page.getByRole("button", { name: "Tandai pelajaran selesai" }).click();
    await expect.poll(() => lms.progress.find((item) => item.lesson_id === LESSON_ID)?.status).toBe("completed");
    await expect(secondButton).not.toHaveClass(/cursor-not-allowed/);
    await expect(page.getByText("Pelajaran ini sudah selesai")).toBeVisible();

    const progressAfterReload = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.hostname === SUPABASE_HOST &&
        url.pathname === "/rest/v1/aspekindo_lms_lesson_progress" &&
        response.request().method() === "GET";
    });
    await page.reload();
    const reloadedProgress = await (await progressAfterReload).json();
    expect(reloadedProgress).toEqual(expect.arrayContaining([
      expect.objectContaining({ lesson_id: LESSON_ID, status: "completed" }),
    ]));
    await expect(page.getByRole("heading", { name: course.title, level: 1 })).toBeVisible();
    await expect(secondButton).not.toHaveClass(/cursor-not-allowed/);
    await page.getByRole("button", { name: new RegExp(lesson.title) }).click();
    await expect(page.getByRole("heading", { name: lesson.title })).toBeVisible();
    await expect(page.getByText("Pelajaran ini sudah selesai")).toBeVisible();
    await secondButton.click();

    await expect(page.getByRole("heading", { name: secondLesson.title })).toBeVisible();
    await expect(page.getByText("pemeriksaan kelengkapan dokumen", { exact: false })).toBeVisible();
    await expect.poll(() => lms.progress.find((item) => item.lesson_id === SECOND_LESSON_ID)?.status).toBe("in_progress");
    expect(unexpected).toEqual([]);
  });

  test("kuis gagal menahan penyelesaian dan pelajaran berikutnya sampai percobaan lulus", async ({ page }) => {
    const lms = { enrolled: true, quiz: true };
    const unexpected = await installAuthenticatedFixture(page, { lms });
    await page.goto(`/aspekindo-lms/kursus/${COURSE_ID}`);

    const completeButton = page.getByRole("button", { name: "Tandai pelajaran selesai" });
    const secondButton = page.getByRole("button", { name: new RegExp(secondLesson.title) });
    await expect(page.getByRole("heading", { name: "Kuis pelajaran" })).toBeVisible();
    await expect(page.getByText("Nilai lulus minimal 75%", { exact: false })).toBeVisible();
    await expect(completeButton).toBeDisabled();
    await expect(secondButton).toHaveClass(/cursor-not-allowed/);
    await page.getByRole("button", { name: "Mulai kuis" }).click();
    await page.getByLabel("Dokumen legalitas").check();
    await page.getByLabel("Abaikan pemeriksaan").check();
    await page.getByRole("button", { name: "Kirim jawaban" }).click();

    await expect(page.getByText("Kuis belum lulus · Skor 50%")).toBeVisible();
    expect(lms.attempts.map(({ score, passed }) => ({ score, passed }))).toEqual([{ score: 50, passed: false }]);
    await expect(completeButton).toBeDisabled();
    await secondButton.click();
    await expect(page.getByRole("heading", { name: secondLesson.title })).toHaveCount(0);
    expect(lms.completionRequests).toEqual([]);

    await page.getByRole("button", { name: "Coba lagi" }).click();
    await page.getByLabel("Dokumen legalitas").check();
    await page.getByLabel("Periksa kelengkapan").check();
    await page.getByRole("button", { name: "Kirim jawaban" }).click();

    await expect(page.getByText("Kuis lulus · Skor 100%")).toBeVisible();
    expect(lms.attempts.map(({ score, passed }) => ({ score, passed }))).toEqual([
      { score: 50, passed: false }, { score: 100, passed: true },
    ]);
    await expect(completeButton).toBeEnabled();
    await expect(secondButton).toHaveClass(/cursor-not-allowed/);
    await completeButton.click();
    await expect(page.getByText("Pelajaran ini sudah selesai")).toBeVisible();
    await expect(secondButton).not.toHaveClass(/cursor-not-allowed/);
    expect(lms.completionRequests).toEqual([LESSON_ID]);
    await secondButton.click();
    await expect(page.getByRole("heading", { name: secondLesson.title })).toBeVisible();
    await expect.poll(() => lms.progress.find((item) => item.lesson_id === SECOND_LESSON_ID)?.status).toBe("in_progress");
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

test.describe("halaman khusus super-admin dengan sesi tiruan", () => {
  const restrictedPages = [
    { path: "/admin/akses", heading: "Kelola Akses Admin" },
    { path: "/admin/permintaan", heading: "Permintaan Akses Admin" },
  ];

  test("super-admin dapat melihat isi kedua halaman", async ({ page }) => {
    const unexpected = await installAuthenticatedFixture(page, { asSuperAdmin: true });

    for (const { path, heading } of restrictedPages) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Anggota Uji" })).toBeVisible();
    }
    expect(unexpected).toEqual([]);
  });

  for (const { role, options } of [
    { role: "admin biasa", options: { asAdmin: true } },
    { role: "anggota", options: {} },
  ]) {
    test(`${role} dialihkan dari kedua halaman tanpa melihat isinya`, async ({ page }) => {
      const unexpected = await installAuthenticatedFixture(page, options);

      for (const { path, heading } of restrictedPages) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(page.getByRole("heading", { name: heading })).toHaveCount(0);
      }
      expect(unexpected).toEqual([]);
    });
  }

  for (const { scenario, response } of [
    {
      scenario: "RPC mengembalikan error",
      response: {
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ code: "XX000", message: "Role lookup unavailable" }),
      },
    },
    {
      scenario: "RPC mengembalikan hasil tak valid",
      response: { status: 200, contentType: "application/json", body: JSON.stringify("true") },
    },
  ]) {
    for (const { path, heading } of restrictedPages) {
      test(`${scenario} tidak membuka ${path} dan mengalihkan ke dashboard`, async ({ page }) => {
        const roleCheck = { response, requests: 0 };
        roleCheck.waitForRelease = new Promise((resolve) => { roleCheck.release = resolve; });
        const unexpected = await installAuthenticatedFixture(page, { asAdmin: true, roleCheck });

        try {
          await page.goto(path, { waitUntil: "domcontentloaded" });
          await expect.poll(() => roleCheck.requests).toBeGreaterThan(0);
          await expect(page.getByRole("heading", { name: heading })).toHaveCount(0);
          roleCheck.release();
          await expect(page).toHaveURL(/\/dashboard$/);
          await expect(page.getByRole("heading", { name: heading })).toHaveCount(0);
          expect(unexpected).toEqual([]);
        } finally {
          roleCheck.release();
        }
      });
    }
  }
});