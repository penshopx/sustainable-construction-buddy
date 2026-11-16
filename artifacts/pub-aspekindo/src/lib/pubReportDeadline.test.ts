import assert from "node:assert/strict";
import test from "node:test";
import { estimatePubReportDeadline } from "./pubReportDeadline.ts";

test("estimasi batas laporan menghitung hari kerja setelah kegiatan dan melewati akhir pekan", () => {
  const result = estimatePubReportDeadline(new Date(2026, 0, 2, 12), 2);
  assert.equal(result?.getFullYear(), 2026);
  assert.equal(result?.getMonth(), 0);
  assert.equal(result?.getDate(), 6);
});

test("estimasi nol hari kerja mempertahankan tanggal kegiatan", () => {
  const eventDate = new Date(2026, 0, 2, 12);
  assert.equal(estimatePubReportDeadline(eventDate, 0)?.getTime(), eventDate.getTime());
});

test("estimasi menolak tanggal dan jumlah hari kerja yang tidak valid", () => {
  assert.equal(estimatePubReportDeadline("not-a-date"), null);
  assert.equal(estimatePubReportDeadline(new Date(), -1), null);
  assert.equal(estimatePubReportDeadline(new Date(), 1.5), null);
});
