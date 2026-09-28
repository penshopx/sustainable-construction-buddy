-- Run against a migrated test database as its owner (or with the local runner).
-- All fixture rows, including the simulated auth user, are rolled back.
BEGIN;

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000711',
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'lms-quiz-authority@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()
);

INSERT INTO public.aspekindo_lms_courses (id, slug, title, status, member_only)
VALUES ('00000000-0000-4000-8000-000000000712', 'quiz-authority-test', 'Quiz authority test', 'published', false);
INSERT INTO public.aspekindo_lms_lessons (id, course_id, title, slug, passing_score, is_published)
VALUES (
  '00000000-0000-4000-8000-000000000713',
  '00000000-0000-4000-8000-000000000712', 'Quiz lesson', 'quiz-lesson', 70, true
);
INSERT INTO public.aspekindo_lms_enrollments (id, course_id, user_id)
VALUES (
  '00000000-0000-4000-8000-000000000714',
  '00000000-0000-4000-8000-000000000712',
  '00000000-0000-4000-8000-000000000711'
);
INSERT INTO public.aspekindo_lms_quiz_questions (id, lesson_id, question_text, options, sort_order)
VALUES
  ('00000000-0000-4000-8000-000000000715', '00000000-0000-4000-8000-000000000713', 'First?', '["wrong","right"]', 0),
  ('00000000-0000-4000-8000-000000000716', '00000000-0000-4000-8000-000000000713', 'Second?', '["right","wrong"]', 1);
INSERT INTO public.aspekindo_lms_quiz_answer_keys (question_id, correct_option)
VALUES
  ('00000000-0000-4000-8000-000000000715', 1),
  ('00000000-0000-4000-8000-000000000716', 0);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000711', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);

DO $$
DECLARE
  v_lesson_id constant uuid := '00000000-0000-4000-8000-000000000713';
  failed public.aspekindo_lms_quiz_attempts;
BEGIN
  -- A direct RPC caller can send an invented score, but only answer IDs/choices
  -- are accepted by the grader. The extra field must not affect the result.
  failed := public.submit_aspekindo_lms_quiz(v_lesson_id,
    '{"00000000-0000-4000-8000-000000000715":0,"00000000-0000-4000-8000-000000000716":1,"score":100}'::jsonb);
  RAISE EXCEPTION 'Unexpected acceptance of an extra score field: %', failed;
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM NOT LIKE 'Jumlah jawaban kuis harus sama dengan jumlah soal%' THEN
    RAISE;
  END IF;
END;
$$;

DO $$
DECLARE
  v_lesson_id constant uuid := '00000000-0000-4000-8000-000000000713';
  v_enrollment_id constant uuid := '00000000-0000-4000-8000-000000000714';
  failed public.aspekindo_lms_quiz_attempts;
  passed public.aspekindo_lms_quiz_attempts;
  progress public.aspekindo_lms_lesson_progress;
BEGIN
  failed := public.submit_aspekindo_lms_quiz(v_lesson_id,
    '{"00000000-0000-4000-8000-000000000715":0,"00000000-0000-4000-8000-000000000716":1}'::jsonb);
  IF failed.score IS DISTINCT FROM 0 OR failed.passed IS DISTINCT FROM false
     OR failed.total_questions IS DISTINCT FROM 2 OR failed.correct_answers IS DISTINCT FROM 0
     OR (SELECT count(*) FROM public.aspekindo_lms_quiz_answers
         WHERE attempt_id = failed.id AND is_correct = false) <> 2 THEN
    RAISE EXCEPTION 'Server did not grade wrong answers as failing: %', failed;
  END IF;

  BEGIN
    PERFORM public.complete_aspekindo_lms_lesson(v_lesson_id);
    RAISE EXCEPTION 'Failed quiz incorrectly allowed lesson completion';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Kuis pelajaran harus lulus sebelum diselesaikan' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM public.aspekindo_lms_lesson_progress lp
             WHERE lp.enrollment_id = v_enrollment_id AND lp.lesson_id = v_lesson_id AND lp.status = 'completed') THEN
    RAISE EXCEPTION 'Completion persisted despite the failed quiz';
  END IF;

  passed := public.submit_aspekindo_lms_quiz(v_lesson_id,
    '{"00000000-0000-4000-8000-000000000715":1,"00000000-0000-4000-8000-000000000716":0}'::jsonb);
  IF passed.score IS DISTINCT FROM 100 OR passed.passed IS DISTINCT FROM true
     OR passed.correct_answers IS DISTINCT FROM 2 OR passed.total_questions IS DISTINCT FROM 2
     OR passed.attempt_number IS DISTINCT FROM 2 THEN
    RAISE EXCEPTION 'Server did not grade correct answers as passing: %', passed;
  END IF;
  progress := public.complete_aspekindo_lms_lesson(v_lesson_id);
  IF progress.status IS DISTINCT FROM 'completed' OR progress.progress_percent IS DISTINCT FROM 100
     OR progress.user_id IS DISTINCT FROM auth.uid()
     OR progress.enrollment_id IS DISTINCT FROM v_enrollment_id
     OR progress.lesson_id IS DISTINCT FROM v_lesson_id
     OR progress.completed_at IS NULL THEN
    RAISE EXCEPTION 'Passing quiz did not permit lesson completion: %', progress;
  END IF;
END;
$$;

ROLLBACK;