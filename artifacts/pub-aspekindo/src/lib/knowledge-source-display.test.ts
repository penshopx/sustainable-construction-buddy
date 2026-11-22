import test from "node:test";
import assert from "node:assert/strict";
import { describeKnowledgeSource } from "./knowledge-source-display.ts";

test("source classifications separate regulations, knowledge, schemes, proposals, and business perspectives", () => {
  assert.equal(describeKnowledgeSource("peraturan_menteri").classification, "Regulasi normatif");
  assert.equal(describeKnowledgeSource("paparan").classification, "Materi pengetahuan nonnormatif");
  assert.equal(describeKnowledgeSource("format_skema").classification, "Skema / kompetensi");
  assert.equal(describeKnowledgeSource("paparan_dan_usulan").classification, "Usulan nonnormatif");
  assert.equal(describeKnowledgeSource("perspektif_pelaku_usaha").classification, "Perspektif pelaku usaha");
  assert.equal(describeKnowledgeSource("tabel_pemetaan").classification, "Draf pemetaan");
});

test("reference status stays cautious and unknown source kinds are not silently promoted", () => {
  assert.match(describeKnowledgeSource("peraturan_pemerintah").status, /tetap perlu diverifikasi/);
  assert.match(describeKnowledgeSource("tabel_pemetaan").status, /belum terverifikasi/);
  assert.equal(describeKnowledgeSource("unknown_kind").classification, "Jenis belum dipetakan");
});
