import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";

const agendas = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    title: "Agenda WIB titik",
    category: "Sesi pembelajaran",
    description: "Pembekalan praktik usaha untuk anggota.",
    audience: "Anggota ASPEKINDO",
    status: "published",
    start_date: "2026-09-10",
    end_date: null,
    schedule: "09.00–12.00 WIB",
    location: "Gedung ASPEKINDO Jakarta",
    registration_url: "https://aspekindo.id/daftar-wib",
    registration_details: "Pendaftaran ditutup 8 September.",
    created_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    title: "Agenda WITA titik dua",
    category: "Klinik pendampingan",
    description: "Klinik pendampingan sertifikasi BUJK.",
    audience: "BUJK anggota",
    status: "published",
    start_date: "2026-09-11",
    end_date: null,
    schedule: "13:15–16:45 WITA",
    location: "Ruang Rapat ASPEKINDO Makassar",
    registration_url: "https://aspekindo.id/daftar-wita",
    registration_details: "Bawa dokumen legalitas perusahaan.",
    created_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    title: "Agenda WIT titik",
    category: "Forum berbagi",
    description: "Forum berbagi pengalaman proyek.",
    audience: "Pelaku usaha konstruksi",
    status: "published",
    start_date: "2026-09-12",
    end_date: null,
    schedule: "08.30–10.00 WIT",
    location: "Hotel ASPEKINDO Jayapura",
    registration_url: "https://aspekindo.id/daftar-wit",
    registration_details: "Kapasitas terbatas.",
    created_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    title: "Agenda lintas tengah malam",
    category: "Sesi pembelajaran",
    description: "Sesi intensif untuk persiapan tender.",
    audience: "Anggota ASPEKINDO",
    status: "published",
    start_date: "2026-09-13",
    end_date: null,
    schedule: "22:00–01:30 WIB",
    location: "Online",
    registration_url: "https://aspekindo.id/daftar-malam",
    registration_details: "Tautan konferensi dikirim setelah pendaftaran.",
    created_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    title: "Agenda sehari penuh",
    category: "Forum berbagi",
    description: "Lokakarya tahunan ASPEKINDO.",
    audience: "Seluruh anggota",
    status: "published",
    start_date: "2026-09-14",
    end_date: null,
    schedule: "Sehari penuh",
    location: "Balai Sidang Jakarta",
    registration_url: "https://aspekindo.id/daftar-sehari",
    registration_details: "Registrasi ulang mulai pukul 08.00.",
    created_at: "2026-08-28T00:00:00.000Z",
    updated_at: "2026-08-28T00:00:00.000Z",
  },
];

const expectedCalendarDates = {
  "Agenda WIB titik": {
    google: "20260910T020000Z/20260910T050000Z",
    icsStart: "DTSTART:20260910T020000Z",
    icsEnd: "DTEND:20260910T050000Z",
  },
  "Agenda WITA titik dua": {
    google: "20260911T051500Z/20260911T084500Z",
    icsStart: "DTSTART:20260911T051500Z",
    icsEnd: "DTEND:20260911T084500Z",
  },
  "Agenda WIT titik": {
    google: "20260911T233000Z/20260912T010000Z",
    icsStart: "DTSTART:20260911T233000Z",
    icsEnd: "DTEND:20260912T010000Z",
  },
  "Agenda lintas tengah malam": {
    google: "20260913T150000Z/20260913T183000Z",
    icsStart: "DTSTART:20260913T150000Z",
    icsEnd: "DTEND:20260913T183000Z",
  },
  "Agenda sehari penuh": {
    google: "20260914/20260915",
    icsStart: "DTSTART;VALUE=DATE:20260914",
    icsEnd: "DTEND;VALUE=DATE:20260915",
  },
};

async function mockPublicAgenda(page) {
  await page.route("**/auth/v1/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.pathname.endsWith("/user")) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "No active session" }),
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
    const request = route.request();
    const requestUrl = new URL(request.url());
    const table = requestUrl.pathname.split("/").pop();

    if (table === "aspekindo_learning_agendas") {
      await route.fulfill({
        status: 200,
        headers: { "content-range": `0-${agendas.length - 1}/${agendas.length}` },
        contentType: "application/json",
        body: JSON.stringify(agendas),
      });
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

async function readDownload(download) {
  const path = await download.path();
  if (!path) throw new Error("Calendar download did not produce a file path");
  return fs.readFile(path, "utf8");
}

test.describe("ASPEKINDO agenda calendar exports", () => {
  test("preserves Indonesian time zones and formats in Google Calendar and ICS", async ({ page }) => {
    await mockPublicAgenda(page);
    await page.goto("/");

    const agendaSection = page.locator("#agenda-aspekindo");
    await agendaSection.scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("heading", { name: "Agenda WITA titik dua" }),
    ).toBeVisible();

    for (const agenda of agendas) {
      const expected = expectedCalendarDates[agenda.title];
      const googleLink = page.getByRole("link", {
        name: `Simpan ${agenda.title} ke Google Calendar`,
      });
      const googleUrl = new URL(await googleLink.getAttribute("href"));
      expect(googleUrl.searchParams.get("action")).toBe("TEMPLATE");
      expect(googleUrl.searchParams.get("text")).toBe(agenda.title);
      expect(googleUrl.searchParams.get("dates")).toBe(expected.google);
      expect(googleUrl.searchParams.get("location")).toBe(agenda.location);

      const details = googleUrl.searchParams.get("details");
      expect(details).toContain(agenda.description);
      expect(details).toContain(`Jadwal: ${agenda.schedule}`);
      expect(details).toContain(`Detail pendaftaran: ${agenda.registration_details}`);
      expect(details).toContain(`Daftar kegiatan: ${agenda.registration_url}`);

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", {
          name: `Unduh file kalender ${agenda.title}`,
        }).click(),
      ]);
      const ics = await readDownload(download);

      expect(ics).toContain(expected.icsStart);
      expect(ics).toContain(expected.icsEnd);
      expect(ics).toContain(`SUMMARY:${agenda.title}`);
      expect(ics).toContain(`DESCRIPTION:${agenda.description}`);
      expect(ics).toContain(`LOCATION:${agenda.location}`);
      expect(ics).toContain(`URL:${agenda.registration_url}`);
      if (agenda.title === "Agenda sehari penuh") {
        expect(ics).not.toContain("DTSTART:");
        expect(ics).not.toContain("DTEND:");
      }
    }
  });
});