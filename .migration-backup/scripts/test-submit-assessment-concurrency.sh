#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${TEST_DATABASE_URL:-${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}}"
PSQL=(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1)
TMP_DIR="$(mktemp -d)"

TEST_USER_ID="00000000-0000-4000-8000-000000000161"
TEST_DOMAIN_ID="00000000-0000-4000-8000-000000000162"
TEST_QUESTION_ID="00000000-0000-4000-8000-000000000163"
TEST_PRE_TEST_ID="00000000-0000-4000-8000-000000000164"
TEST_OLD_PRE_TEST_ID="00000000-0000-4000-8000-000000000165"
TEST_NEW_PRE_TEST_ID="00000000-0000-4000-8000-000000000166"

cleanup() {
  "${PSQL[@]}" >/dev/null 2>&1 <<SQL || true
DROP TRIGGER IF EXISTS submit_assessment_concurrency_audit_trigger ON public.pre_tests;
DROP FUNCTION IF EXISTS public.record_submit_assessment_completion();
DROP TABLE IF EXISTS public.submit_assessment_concurrency_audit;
DELETE FROM auth.users WHERE id = '$TEST_USER_ID';
DELETE FROM public.competency_domains WHERE id = '$TEST_DOMAIN_ID';
SQL
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cleanup

mkdir -p "$TMP_DIR"

"${PSQL[@]}" >/dev/null <<SQL
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
VALUES (
  '$TEST_USER_ID',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'assessment-concurrency@example.invalid',
  '',
  now(),
  '{}'::jsonb,
  '{"full_name":"Assessment Concurrency Test"}'::jsonb,
  now(),
  now()
);

INSERT INTO public.competency_domains (id, name)
VALUES ('$TEST_DOMAIN_ID', 'Assessment concurrency test');

INSERT INTO public.questions (
  id, domain_id, question_text, options, correct_answer
)
VALUES (
  '$TEST_QUESTION_ID',
  '$TEST_DOMAIN_ID',
  'Concurrency test question',
  '["A", "B"]'::jsonb,
  1
);

INSERT INTO public.pre_tests (id, user_id, total_questions)
VALUES ('$TEST_PRE_TEST_ID', '$TEST_USER_ID', 1);

CREATE TABLE public.submit_assessment_concurrency_audit (
  pre_test_id uuid NOT NULL,
  old_completed_at timestamptz,
  new_completed_at timestamptz NOT NULL
);

CREATE FUNCTION public.record_submit_assessment_completion()
RETURNS trigger
LANGUAGE plpgsql
AS \$\$
BEGIN
  IF NEW.id = '$TEST_PRE_TEST_ID'::uuid
     AND NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
    INSERT INTO public.submit_assessment_concurrency_audit (
      pre_test_id, old_completed_at, new_completed_at
    )
    VALUES (NEW.id, OLD.completed_at, NEW.completed_at);
  END IF;
  RETURN NEW;
END;
\$\$;

CREATE TRIGGER submit_assessment_concurrency_audit_trigger
AFTER UPDATE ON public.pre_tests
FOR EACH ROW
EXECUTE FUNCTION public.record_submit_assessment_completion();
SQL

# Hold the target row so both submit statements are active and waiting before
# either can complete. Releasing this transaction lets PostgreSQL serialize them.
"${PSQL[@]}" >/dev/null <<SQL &
BEGIN;
SELECT 1 FROM public.pre_tests WHERE id = '$TEST_PRE_TEST_ID' FOR UPDATE;
SELECT /* submit_assessment_concurrency_locker */ pg_sleep(5);
COMMIT;
SQL
LOCKER_PID=$!

LOCK_READY="f"
for _ in {1..100}; do
  LOCK_READY="$("${PSQL[@]}" -Atq -c "
    SELECT EXISTS (
      SELECT 1
      FROM pg_stat_activity
      WHERE query LIKE '%submit_assessment_concurrency_locker%'
        AND query NOT LIKE '%pg_stat_activity%'
        AND state = 'active'
    )
  ")"
  [[ "$LOCK_READY" == "t" ]] && break
  sleep 0.02
done

if [[ "$LOCK_READY" != "t" ]]; then
  echo "Failed to acquire the coordinating row lock." >&2
  exit 1
fi

submit() {
  local selected_answer="$1"
  local label="$2"
  "${PSQL[@]}" -Atq <<SQL
BEGIN;
SELECT set_config('request.jwt.claim.sub', '$TEST_USER_ID', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT /* submit_assessment_concurrency:$label */ public.submit_assessment(
  '$TEST_PRE_TEST_ID',
  jsonb_build_array(jsonb_build_object(
    'question_id', '$TEST_QUESTION_ID',
    'selected_answer', $selected_answer
  ))
)::text;
COMMIT;
SQL
}

submit 1 first >"$TMP_DIR/first.out" &
FIRST_PID=$!
submit 0 second >"$TMP_DIR/second.out" &
SECOND_PID=$!

CONCURRENT_CALLS=0
for _ in {1..100}; do
  CONCURRENT_CALLS="$("${PSQL[@]}" -Atq -c "
    SELECT count(*)
    FROM pg_stat_activity
    WHERE query LIKE '%submit_assessment_concurrency:%'
      AND query NOT LIKE '%pg_stat_activity%'
      AND state = 'active'
  ")"
  [[ "$CONCURRENT_CALLS" == "2" ]] && break
  sleep 0.02
done

if [[ "$CONCURRENT_CALLS" != "2" ]]; then
  echo "Expected two submit_assessment calls to be active concurrently; observed $CONCURRENT_CALLS." >&2
  exit 1
fi

wait "$LOCKER_PID"
wait "$FIRST_PID"
wait "$SECOND_PID"

FIRST_RESULT="$(grep '^{' "$TMP_DIR/first.out")"
SECOND_RESULT="$(grep '^{' "$TMP_DIR/second.out")"

if [[ -z "$FIRST_RESULT" || "$FIRST_RESULT" != "$SECOND_RESULT" ]]; then
  printf 'Concurrent submissions returned different results:\nfirst: %s\nsecond: %s\n' \
    "$FIRST_RESULT" "$SECOND_RESULT" >&2
  exit 1
fi

"${PSQL[@]}" -v expected_result="$FIRST_RESULT" >/dev/null <<SQL
SELECT set_config('test.expected_result', :'expected_result', false);
DO \$\$
DECLARE
  result jsonb := current_setting('test.expected_result')::jsonb;
  answer_count integer;
  completion_write_count integer;
  stored_answer integer;
  final_completed_at timestamptz;
  audited_completed_at timestamptz;
BEGIN
  SELECT count(*)::integer, min(selected_answer)
  INTO answer_count, stored_answer
  FROM public.pre_test_answers
  WHERE pre_test_id = '$TEST_PRE_TEST_ID';

  IF answer_count <> 1 THEN
    RAISE EXCEPTION 'Concurrent submissions created % answer rows instead of 1',
      answer_count;
  END IF;

  IF (stored_answer = 1) IS DISTINCT FROM ((result->>'score')::integer = 100) THEN
    RAISE EXCEPTION 'Stored answer does not match the shared result: answer %, result %',
      stored_answer, result;
  END IF;

  SELECT count(*)::integer, max(new_completed_at)
  INTO completion_write_count, audited_completed_at
  FROM public.submit_assessment_concurrency_audit
  WHERE pre_test_id = '$TEST_PRE_TEST_ID';

  SELECT completed_at
  INTO final_completed_at
  FROM public.pre_tests
  WHERE id = '$TEST_PRE_TEST_ID';

  IF completion_write_count <> 1 THEN
    RAISE EXCEPTION 'completed_at was written % times instead of once',
      completion_write_count;
  END IF;

  IF final_completed_at IS DISTINCT FROM audited_completed_at THEN
    RAISE EXCEPTION 'Final completed_at differs from the original completion timestamp';
  END IF;
END;
\$\$;
SQL

# The newer-started assessment must own the profile even when the older one
# commits later. These submits use separate psql processes/connections.
"${PSQL[@]}" >/dev/null <<SQL
DELETE FROM public.pre_tests WHERE id = '$TEST_PRE_TEST_ID';

INSERT INTO public.pre_tests (id, user_id, total_questions, started_at)
VALUES
  ('$TEST_OLD_PRE_TEST_ID', '$TEST_USER_ID', 1, '2026-09-10 10:00:00+00'),
  ('$TEST_NEW_PRE_TEST_ID', '$TEST_USER_ID', 1, '2026-09-10 10:05:00+00');
SQL

"${PSQL[@]}" >/dev/null <<SQL &
BEGIN;
SELECT 1 FROM public.pre_tests WHERE id = '$TEST_OLD_PRE_TEST_ID' FOR UPDATE;
SELECT /* submit_assessment_cross_pretest_locker */ pg_sleep(5);
COMMIT;
SQL
CROSS_LOCKER_PID=$!

CROSS_LOCK_READY="f"
for _ in {1..100}; do
  CROSS_LOCK_READY="$("${PSQL[@]}" -Atq -c "
    SELECT EXISTS (
      SELECT 1
      FROM pg_stat_activity
      WHERE query LIKE '%submit_assessment_cross_pretest_locker%'
        AND query NOT LIKE '%pg_stat_activity%'
        AND state = 'active'
    )
  ")"
  [[ "$CROSS_LOCK_READY" == "t" ]] && break
  sleep 0.02
done

if [[ "$CROSS_LOCK_READY" != "t" ]]; then
  echo "Failed to acquire the cross-pre-test coordinating row lock." >&2
  exit 1
fi

submit_pre_test() {
  local pre_test_id="$1"
  local selected_answer="$2"
  local label="$3"
  "${PSQL[@]}" -Atq <<SQL
BEGIN;
SELECT set_config('request.jwt.claim.sub', '$TEST_USER_ID', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT /* submit_assessment_cross_pretest:$label */ public.submit_assessment(
  '$pre_test_id',
  jsonb_build_array(jsonb_build_object(
    'question_id', '$TEST_QUESTION_ID',
    'selected_answer', $selected_answer
  ))
)::text;
COMMIT;
SQL
}

# The older assessment is deliberately blocked so the newer assessment commits
# first. Without the per-user winner rule, the older score would overwrite it.
submit_pre_test "$TEST_OLD_PRE_TEST_ID" 0 older >"$TMP_DIR/older.out" &
OLDER_PID=$!

OLDER_ACTIVE="f"
for _ in {1..100}; do
  OLDER_ACTIVE="$("${PSQL[@]}" -Atq -c "
    SELECT EXISTS (
      SELECT 1
      FROM pg_stat_activity
      WHERE query LIKE '%submit_assessment_cross_pretest:older%'
        AND query NOT LIKE '%pg_stat_activity%'
        AND state = 'active'
    )
  ")"
  [[ "$OLDER_ACTIVE" == "t" ]] && break
  sleep 0.02
done

if [[ "$OLDER_ACTIVE" != "t" ]]; then
  echo "The older assessment submit did not become active." >&2
  exit 1
fi

submit_pre_test "$TEST_NEW_PRE_TEST_ID" 1 newer >"$TMP_DIR/newer.out" &
NEWER_PID=$!
wait "$NEWER_PID"

if ! kill -0 "$OLDER_PID" 2>/dev/null; then
  echo "Test setup invalid: the older assessment did not remain blocked until the newer assessment completed." >&2
  exit 1
fi

wait "$CROSS_LOCKER_PID"
wait "$OLDER_PID"

"${PSQL[@]}" >/dev/null <<SQL
DO \$\$
DECLARE
  profile_level text;
  profile_score integer;
BEGIN
  SELECT current_level, total_score
  INTO profile_level, profile_score
  FROM public.profiles
  WHERE user_id = '$TEST_USER_ID';

  IF profile_level IS DISTINCT FROM 'Utama' OR profile_score IS DISTINCT FROM 100 THEN
    RAISE EXCEPTION
      'Profile followed the wrong assessment: level %, score %; expected Utama, 100',
      profile_level, profile_score;
  END IF;
END;
\$\$;
SQL

echo "Concurrent submit_assessment tests passed."
