import assert from "node:assert/strict";
import test from "node:test";
import { assessmentDraftKey, assessmentDraftStorageEpoch, assessmentSecondsLeft, clearLocalAssessmentDrafts, resolveAssessmentClock, resolveServerAssessmentDraft, saveLocalAssessmentDraft, type AssessmentDraft } from "./assessmentDraft.ts";

const draft: AssessmentDraft = {
  version: 1, preTestId: "test-owner-1",
  questions: [{ id: "q1", question_text: "Pertanyaan?", options: ["A", "B"], difficulty: "Pemula" }],
  answers: { q1: 1 }, answerResults: {}, currentQ: 0, phase: "review",
  timeLeft: 3, deadlineAt: 9999999999999, timedOut: false,
};
const envelope = { preTestId: draft.preTestId, startedAt: "2026-09-28T10:00:00Z", deadlineAt: "2026-09-28T10:01:30Z", serverNow: "2026-09-28T10:00:00Z", totalQuestions: 1, draft };

test("pulihkan soal, jawaban, dan deadline dari server tanpa mempercayai deadline draf", () => {
  const result = resolveServerAssessmentDraft(envelope);
  assert.deepEqual(result?.answers, { q1: 1 });
  assert.equal(result?.phase, "review");
  assert.equal(result?.deadlineAt, Date.parse(envelope.deadlineAt));
});

test("tolak draf server dengan id atau jumlah soal yang tidak cocok", () => {
  assert.equal(resolveServerAssessmentDraft({ ...envelope, preTestId: "test-other" }), null);
  assert.equal(resolveServerAssessmentDraft({ ...envelope, totalQuestions: 2 }), null);
  assert.equal(resolveServerAssessmentDraft({ ...envelope, deadlineAt: "invalid" }), null);
});

test("perubahan jam perangkat atau deadline draf tidak memperpanjang hitung mundur server", () => {
  const originalNow = Date.now;
  try {
    const clock = resolveAssessmentClock(envelope, 1000)!;
    Date.now = () => 0;
    assert.equal(assessmentSecondsLeft(clock, 31_000), 60);
    Date.now = () => 9_999_999_999_999;
    assert.equal(assessmentSecondsLeft(clock, 91_000), 0);
    assert.equal(resolveServerAssessmentDraft({ ...envelope, draft: { ...draft, deadlineAt: 9999999999999 } })?.deadlineAt, clock.deadlineAt);
  } finally {
    Date.now = originalNow;
  }
});

test("draf browser lama tetap dikunci berdasarkan anggota", () => {
  assert.notEqual(assessmentDraftKey("owner"), assessmentDraftKey("other"));
});

test("logout menghapus semua draf anggota tanpa menghapus data browser lain atau menghidupkan penulisan lama", () => {
  const items = new Map<string, string>([
    [assessmentDraftKey("owner"), JSON.stringify(draft)],
    [assessmentDraftKey("previous"), JSON.stringify(draft)],
    ["pub_onboarding_done", "1"],
  ]);
  const storage = {
    get length() { return items.size; },
    key: (index: number) => [...items.keys()][index] ?? null,
    removeItem: (key: string) => { items.delete(key); },
    setItem: (key: string, value: string) => { items.set(key, value); },
  } as Storage;
  const oldEpoch = assessmentDraftStorageEpoch();
  clearLocalAssessmentDrafts(storage);
  assert.deepEqual([...items], [["pub_onboarding_done", "1"]]);
  saveLocalAssessmentDraft(storage, "owner", draft, oldEpoch);
  assert.equal(items.has(assessmentDraftKey("owner")), false);
  saveLocalAssessmentDraft(storage, "owner", draft, assessmentDraftStorageEpoch());
  assert.equal(items.has(assessmentDraftKey("owner")), true);
});