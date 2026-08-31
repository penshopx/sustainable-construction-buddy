import { expect, test } from "@playwright/test";

const program = {
  id: "00000000-0000-4000-8000-000000000050",
  title: "Workshop Tata Kelola BUJK",
  description: "Kegiatan peningkatan kapasitas untuk badan usaha jasa konstruksi.",
  category: "workshop",
  status: "upcoming",
  start_date: "2026-09-20",
  end_date: "2026-09-21",
  location: "Jakarta",
  progress_percent: 0,
  image_url: "",
  created_at: "2026-08-31T00:00:00.000Z",
  updated_at: "2026-08-31T00:00:00.000Z",
};

test("public program pages show activities without exposing participant data", async ({ page }) => {
  const requestedTables = [];

  await page.route("**/rest/v1/**", async (route) => {
    const table = new URL(route.request().url()).pathname.split("/").pop();
    requestedTables.push(table);
    const body = table === "pub_programs"
      ? JSON.stringify([program])
      : table === "pub_program_updates"
        ? JSON.stringify([{
          id: "00000000-0000-4000-8000-000000000051",
          program_id: program.id,
          title: "Pendaftaran dibuka",
          content: "Pendaftaran peserta akan diumumkan melalui agenda PUB.",
          published_at: "2026-08-31T00:00:00.000Z",
          created_at: "2026-08-31T00:00:00.000Z",
          pub_programs: program,
        }])
        : "[]";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body,
    });
  });

  await page.goto("/program-kegiatan");

  await expect(page).toHaveTitle(/Program & Kegiatan PUB/);
  await expect(page.getByRole("link", { name: "Program & Kegiatan", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Program yang sedang dan akan berjalan" })).toBeVisible();
  await expect(page.getByRole("link", { name: program.title }).first()).toBeVisible();
  await expect(page.getByText("Pendaftaran dibuka")).toBeVisible();
  await expect(page.getByText("Peserta", { exact: true })).toHaveCount(0);
  expect(requestedTables).not.toContain("pub_program_participants");

  await page.getByRole("link", { name: program.title }).first().click();

  await expect(page).toHaveURL(new RegExp(`/program-kegiatan/${program.id}$`));
  await expect(page.getByRole("heading", { name: program.title })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Update kegiatan" })).toBeVisible();
  await expect(page.getByText("Pendaftaran dibuka")).toBeVisible();
  await expect(page.getByText("Peserta", { exact: true })).toHaveCount(0);
  expect(requestedTables).not.toContain("pub_program_participants");
});