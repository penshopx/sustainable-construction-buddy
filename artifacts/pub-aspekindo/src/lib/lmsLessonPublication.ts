import type { supabase } from "../integrations/supabase/client";

type QuizQuestion = {
  id: string;
  question_text: string;
  options: unknown;
  points: number;
};
type AnswerKey = { question_id: string; correct_option: number };

export const QUIZ_PUBLICATION_GUIDANCE =
  "Simpan pelajaran sebagai draf, lalu tambahkan minimal satu soal valid di Bank soal dengan pertanyaan, minimal dua opsi jawaban, poin positif, dan kunci jawaban yang sesuai. Setelah itu, terbitkan kembali pelajaran.";

export function hasValidQuizQuestion(questions: QuizQuestion[], keys: AnswerKey[]): boolean {
  return questions.some((question) => {
    const options = question.options;
    const key = keys.find((item) => item.question_id === question.id);
    return Boolean(
      question.question_text.trim() &&
      Array.isArray(options) &&
      options.length >= 2 &&
      options.every((option) => typeof option === "string" && option.trim()) &&
      Number.isInteger(question.points) && question.points > 0 &&
      key && Number.isInteger(key.correct_option) &&
      key.correct_option >= 0 && key.correct_option < options.length,
    );
  });
}

// Read on every publish/save, not from the quiz tab's potentially stale state.
export async function getLessonPublicationError(
  client: typeof supabase,
  lesson: { id?: string; is_published: boolean; passing_score: number },
): Promise<string | null> {
  if (!lesson.is_published || lesson.passing_score <= 0) return null;
  if (!lesson.id) return QUIZ_PUBLICATION_GUIDANCE;
  try {
    const questions = await client.from("aspekindo_lms_quiz_questions")
      .select("id, question_text, options, points").eq("lesson_id", lesson.id);
    if (questions.error) throw questions.error;
    if (!questions.data?.length) return QUIZ_PUBLICATION_GUIDANCE;
    const keys = await client.from("aspekindo_lms_quiz_answer_keys")
      .select("question_id, correct_option").in("question_id", questions.data.map((question) => question.id));
    if (keys.error) throw keys.error;
    return hasValidQuizQuestion(questions.data, keys.data ?? []) ? null : QUIZ_PUBLICATION_GUIDANCE;
  } catch {
    return "Kesiapan kuis belum dapat diperiksa. Pelajaran belum diterbitkan. Coba simpan kembali setelah koneksi pulih atau simpan sebagai draf.";
  }
}
