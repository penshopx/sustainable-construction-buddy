export interface AssessmentDraft {
  version: 1;
  preTestId: string;
  questions: { id: string; question_text: string; options: string[]; difficulty: string; domain_name?: string }[];
  answers: Record<string, number>;
  answerResults: Record<string, { selected: number; is_correct: boolean; correct_answer: number; explanation: string }>;
  currentQ: number;
  phase: "test" | "review";
  timeLeft: number;
  // Older drafts have no deadline; restore them using their last saved remaining time.
  deadlineAt?: number;
  timedOut: boolean;
}

const assessmentDraftPrefix = "pub_assessment_draft_v1:";
let draftStorageEpoch = 0;

export const assessmentDraftKey = (userId: string) => `${assessmentDraftPrefix}${userId}`;

// Invalidate writes queued by the previous session before touching storage.
export function clearLocalAssessmentDrafts(storage: Storage): void {
  draftStorageEpoch++;
  for (let i = storage.length - 1; i >= 0; i--) {
    const key = storage.key(i);
    if (key?.startsWith(assessmentDraftPrefix)) storage.removeItem(key);
  }
}

export function assessmentDraftStorageEpoch(): number {
  return draftStorageEpoch;
}

export function saveLocalAssessmentDraft(storage: Storage, ownerId: string, draft: AssessmentDraft, epoch: number): void {
  if (epoch === draftStorageEpoch) storage.setItem(assessmentDraftKey(ownerId), JSON.stringify(draft));
}

export function resolveServerAssessmentDraft(value: unknown): AssessmentDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.preTestId !== "string" || typeof record.startedAt !== "string" ||
      !Number.isInteger(record.totalQuestions)) return null;
  const startedAt = Date.parse(record.startedAt);
  if (!Number.isFinite(startedAt)) return null;
  const draft = parseAssessmentDraft(JSON.stringify(record.draft));
  if (!draft || draft.preTestId !== record.preTestId || draft.questions.length !== record.totalQuestions) return null;
  // The start timestamp belongs to the server, not to either device's draft.
  return { ...draft, deadlineAt: startedAt + draft.questions.length * 90_000 };
}

export function parseAssessmentDraft(raw: string): AssessmentDraft | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const draft = value as Record<string, unknown>;
    if (draft.version !== 1 || typeof draft.preTestId !== "string" || !draft.preTestId ||
        !Array.isArray(draft.questions) || draft.questions.length === 0 || draft.questions.length > 100 ||
        !Number.isInteger(draft.currentQ) || (draft.currentQ as number) < 0 ||
        (draft.currentQ as number) >= draft.questions.length ||
        !Number.isInteger(draft.timeLeft) || (draft.timeLeft as number) < 0 ||
        (draft.timeLeft as number) > draft.questions.length * 90 ||
         (draft.deadlineAt !== undefined && (!Number.isFinite(draft.deadlineAt) || (draft.deadlineAt as number) <= 0)) ||
        typeof draft.timedOut !== "boolean" ||
        (draft.phase !== "test" && draft.phase !== "review") ||
        !draft.answers || typeof draft.answers !== "object" || Array.isArray(draft.answers) ||
        !draft.answerResults || typeof draft.answerResults !== "object" || Array.isArray(draft.answerResults)) return null;

    const questions = draft.questions as Record<string, unknown>[];
    if (!questions.every((q) => q && typeof q.id === "string" && q.id &&
        typeof q.question_text === "string" && typeof q.difficulty === "string" &&
        (q.domain_name === undefined || typeof q.domain_name === "string") &&
        Array.isArray(q.options) && q.options.length > 0 &&
        q.options.every((option) => typeof option === "string")) ||
        new Set(questions.map((q) => q.id)).size !== questions.length) return null;

    const lengths = new Map(questions.map((q) => [q.id as string, (q.options as string[]).length]));
    const answers = draft.answers as Record<string, unknown>;
    if (!Object.entries(answers).every(([id, index]) =>
      lengths.has(id) && Number.isInteger(index) && (index as number) >= 0 && (index as number) < lengths.get(id)!)) return null;
    const results = draft.answerResults as Record<string, unknown>;
    if (!Object.entries(results).every(([id, result]) => {
      if (!result || typeof result !== "object" || Array.isArray(result)) return false;
      const r = result as Record<string, unknown>;
      return answers[id] === r.selected && typeof r.is_correct === "boolean" &&
        Number.isInteger(r.correct_answer) && (r.correct_answer as number) >= 0 &&
        (r.correct_answer as number) < (lengths.get(id) ?? 0) && typeof r.explanation === "string";
    })) return null;
    return draft as unknown as AssessmentDraft;
  } catch {
    return null;
  }
}