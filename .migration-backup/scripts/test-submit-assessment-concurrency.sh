#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${TEST_DATABASE_URL:-${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}}"
PSQL=(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1)
TMP_DIR="$(mktemp -d)"

TEST_USER_ID="00000000-0000-4000-8000-000000000161"
TEST_OTHER_USER_ID="00000000-0000-4000-8000-000000000169"
TEST_DOMAIN_ID="00000000-0000-4000-8000-000000000162"
TEST_QUESTION_ID="00000000-0000-4000-8000-000000000163"
TEST_PRE_TEST_ID="00000000-0000-4000-8000-000000000164"
TEST_OLD_PRE_TEST_ID="00000000-0000-4000-8000-000000000165"
TEST_NEW_PRE_TEST_ID="00000000-0000-4000-8000-000000000166"
TEST_TIE_LOW_ID="00000000-0000-4000-8000-000000000167"
TEST_TIE_HIGH_ID="00000000-0000-4000-8000-000000000168"
TEST_OWNERSHIP_PRE_TEST_ID="00000000-0000-4000-8000-000000000170"

cleanup() {
  "${PSQL[@]}" >/dev/null 2>&1 <<SQL || true
DROP TRIGGER IF EXISTS submit_assessment_concurrency_audit_trigger ON public.pre_tests;
DROP FUNCTION IF EXISTS public.record_submit_assessment_completion();
DROP TABLE IF EXISTS public.submit_assessment_concurrency_audit;
DELETE FROM auth.users WHERE id IN ('$TEST_USER_ID', '$TEST_OTHER_USER_ID');
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
VALUES
  (
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
  ),
  (
    '$TEST_OTHER_USER_ID',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'assessment-other-user@example.invalid',
    '',
    now(),
    '{}'::jsonb,
    '{"full_name":"Assessment Other User"}'::jsonb,
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

# Both assessments are now completed. Replaying the older one with a different
# answer must return its original result without changing either stored data or
# the profile owned by the newer-started assessment.
OLDER_RESULT="$(grep '^{' "$TMP_DIR/older.out")"
NEWER_RESULT="$(grep '^{' "$TMP_DIR/newer.out")"
if [[ -z "$OLDER_RESULT" || -z "$NEWER_RESULT" || "$OLDER_RESULT" == "$NEWER_RESULT" ]]; then
  printf 'Cross-pre-test submissions did not produce distinct results:\nolder: %s\nnewer: %s\n' \
    "$OLDER_RESULT" "$NEWER_RESULT" >&2
  exit 1
fi

OLDER_COMPLETED_AT="$("${PSQL[@]}" -Atq -c "
  SELECT completed_at FROM public.pre_tests WHERE id = '$TEST_OLD_PRE_TEST_ID'
")"
submit_pre_test "$TEST_OLD_PRE_TEST_ID" 1 older_replay >"$TMP_DIR/older-replay.out"
OLDER_REPLAY_RESULT="$(grep '^{' "$TMP_DIR/older-replay.out")"
if [[ "$OLDER_REPLAY_RESULT" != "$OLDER_RESULT" ]]; then
  printf 'Replaying the older assessment changed its result:\noriginal: %s\nreplay: %s\n' \
    "$OLDER_RESULT" "$OLDER_REPLAY_RESULT" >&2
  exit 1
fi

"${PSQL[@]}" -v older_completed_at="$OLDER_COMPLETED_AT" >/dev/null <<SQL
SELECT set_config('test.older_completed_at', :'older_completed_at', false);
DO \$\$
DECLARE
  older_started_at timestamptz;
  newer_started_at timestamptz;
  older_completed_at timestamptz;
  older_score integer;
  newer_score integer;
  older_level text;
  profile_level text;
  profile_score integer;
  answer_count integer;
  stored_answer integer;
BEGIN
  SELECT started_at, completed_at, score, determined_level
  INTO older_started_at, older_completed_at, older_score, older_level
  FROM public.pre_tests
  WHERE id = '$TEST_OLD_PRE_TEST_ID' AND user_id = '$TEST_USER_ID' AND status = 'completed';

  SELECT started_at, score
  INTO newer_started_at, newer_score
  FROM public.pre_tests
  WHERE id = '$TEST_NEW_PRE_TEST_ID' AND user_id = '$TEST_USER_ID' AND status = 'completed';

  IF older_started_at IS NULL OR newer_started_at IS NULL
     OR older_started_at >= newer_started_at
     OR older_score IS DISTINCT FROM 0 OR newer_score IS DISTINCT FROM 100
     OR older_level IS DISTINCT FROM 'Pemula'
     OR older_completed_at IS DISTINCT FROM current_setting('test.older_completed_at')::timestamptz THEN
    RAISE EXCEPTION 'Replayed assessment changed or the distinct completed assessments were not set up correctly';
  END IF;

  SELECT count(*)::integer, min(selected_answer)
  INTO answer_count, stored_answer
  FROM public.pre_test_answers
  WHERE pre_test_id = '$TEST_OLD_PRE_TEST_ID';
  IF answer_count <> 1 OR stored_answer IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'Replaying the older assessment changed its saved answer: count %, answer %',
      answer_count, stored_answer;
  END IF;

  SELECT current_level, total_score
  INTO profile_level, profile_score
  FROM public.profiles
  WHERE user_id = '$TEST_USER_ID';
  IF profile_level IS DISTINCT FROM 'Utama' OR profile_score IS DISTINCT FROM 100 THEN
    RAISE EXCEPTION 'Replaying the older assessment changed the profile: level %, score %',
      profile_level, profile_score;
  END IF;
END;
\$\$;
SQL

# Both assessments start at exactly the same time. The higher UUID must own
# the profile regardless of which transaction finishes last.
run_tie_case() {
  local blocked_id="$1"
  local first_id="$2"
  local label="$3"
  local blocked_answer first_answer
  local lock_ready="f"
  local blocked_active="f"

  if [[ "$blocked_id" == "$TEST_TIE_HIGH_ID" ]]; then
    blocked_answer=1
    first_answer=0
  else
    blocked_answer=0
    first_answer=1
  fi

  "${PSQL[@]}" >/dev/null <<SQL
DELETE FROM public.pre_tests WHERE id IN ('$TEST_TIE_LOW_ID', '$TEST_TIE_HIGH_ID');
INSERT INTO public.pre_tests (id, user_id, total_questions, started_at)
VALUES
  ('$TEST_TIE_LOW_ID', '$TEST_USER_ID', 1, '2026-09-10 11:00:00+00'),
  ('$TEST_TIE_HIGH_ID', '$TEST_USER_ID', 1, '2026-09-10 11:00:00+00');
UPDATE public.profiles
SET current_level = 'Pemula', total_score = 0
WHERE user_id = '$TEST_USER_ID';
SQL

  "${PSQL[@]}" >/dev/null <<SQL &
BEGIN;
SELECT 1 FROM public.pre_tests WHERE id = '$blocked_id' FOR UPDATE;
SELECT /* submit_assessment_tie_locker:$label */ pg_sleep(5);
COMMIT;
SQL
  local locker_pid=$!

  for _ in {1..100}; do
    lock_ready="$("${PSQL[@]}" -Atq -c "
      SELECT EXISTS (
        SELECT 1 FROM pg_stat_activity
        WHERE query LIKE '%submit_assessment_tie_locker:$label%'
          AND query NOT LIKE '%pg_stat_activity%'
          AND state = 'active'
      )
    ")"
    [[ "$lock_ready" == "t" ]] && break
    sleep 0.02
  done
  if [[ "$lock_ready" != "t" ]]; then
    echo "Failed to acquire the tie-case row lock ($label)." >&2
    exit 1
  fi

  submit_pre_test "$blocked_id" "$blocked_answer" "tie_blocked_$label" >"$TMP_DIR/tie-blocked-$label.out" &
  local blocked_pid=$!

  for _ in {1..100}; do
    blocked_active="$("${PSQL[@]}" -Atq -c "
      SELECT EXISTS (
        SELECT 1 FROM pg_stat_activity
        WHERE query LIKE '%submit_assessment_cross_pretest:tie_blocked_$label%'
          AND query NOT LIKE '%pg_stat_activity%'
          AND state = 'active'
      )
    ")"
    [[ "$blocked_active" == "t" ]] && break
    sleep 0.02
  done
  if [[ "$blocked_active" != "t" ]]; then
    echo "Blocked tie-case submit did not become active ($label)." >&2
    exit 1
  fi

  submit_pre_test "$first_id" "$first_answer" "tie_first_$label" >"$TMP_DIR/tie-first-$label.out" &
  local first_pid=$!
  wait "$first_pid"

  if ! kill -0 "$blocked_pid" 2>/dev/null; then
    echo "Tie-case setup invalid: blocked submit finished before the first one ($label)." >&2
    exit 1
  fi

  wait "$locker_pid"
  wait "$blocked_pid"

  "${PSQL[@]}" >/dev/null <<SQL
DO \$\$
DECLARE
  profile_level text;
  profile_score integer;
  completed_count integer;
  shared_start_count integer;
  low_score integer;
  high_score integer;
BEGIN
  SELECT count(*), count(DISTINCT started_at)
  INTO completed_count, shared_start_count
  FROM public.pre_tests
  WHERE id IN ('$TEST_TIE_LOW_ID', '$TEST_TIE_HIGH_ID')
    AND user_id = '$TEST_USER_ID'
    AND status = 'completed';

  IF completed_count <> 2 OR shared_start_count <> 1 THEN
    RAISE EXCEPTION 'Tie-case assessments were not both completed with identical started_at (%)',
      '$label';
  END IF;

  SELECT score INTO low_score FROM public.pre_tests WHERE id = '$TEST_TIE_LOW_ID';
  SELECT score INTO high_score FROM public.pre_tests WHERE id = '$TEST_TIE_HIGH_ID';
  IF low_score IS DISTINCT FROM 0 OR high_score IS DISTINCT FROM 100 THEN
    RAISE EXCEPTION 'Tie-case assessment scores incorrect (%): low %, high %',
      '$label', low_score, high_score;
  END IF;

  SELECT current_level, total_score
  INTO profile_level, profile_score
  FROM public.profiles
  WHERE user_id = '$TEST_USER_ID';

  IF profile_level IS DISTINCT FROM 'Utama' OR profile_score IS DISTINCT FROM 100 THEN
    RAISE EXCEPTION
      'Tie-case profile followed wrong ID (%): level %, score %; expected Utama, 100 from %',
      '$label', profile_level, profile_score, '$TEST_TIE_HIGH_ID';
  END IF;
END;
\$\$;
SQL
}

# Higher ID finishes last, then higher ID finishes first.
run_tie_case "$TEST_TIE_HIGH_ID" "$TEST_TIE_LOW_ID" high_last
run_tie_case "$TEST_TIE_LOW_ID" "$TEST_TIE_HIGH_ID" high_first

# A different authenticated user must not be able to submit the owner's
# unfinished assessment. Compare complete rows before and after the attempt,
# then prove the owner can still submit the same pre-test successfully.
"${PSQL[@]}" >/dev/null <<SQL
INSERT INTO public.pre_tests (id, user_id, total_questions)
VALUES ('$TEST_OWNERSHIP_PRE_TEST_ID', '$TEST_USER_ID', 1);

UPDATE public.profiles
SET current_level = 'Muda', total_score = 73
WHERE user_id = '$TEST_USER_ID';

DO \$\$
DECLARE
  before_pre_test jsonb;
  before_profile jsonb;
  attacker_result jsonb;
  answer_count integer;
BEGIN
  SELECT to_jsonb(pt) INTO STRICT before_pre_test
  FROM public.pre_tests pt WHERE pt.id = '$TEST_OWNERSHIP_PRE_TEST_ID';
  SELECT to_jsonb(p) INTO STRICT before_profile
  FROM public.profiles p WHERE p.user_id = '$TEST_USER_ID';

  PERFORM set_config('request.jwt.claim.sub', '$TEST_OTHER_USER_ID', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  attacker_result := public.submit_assessment(
    '$TEST_OWNERSHIP_PRE_TEST_ID',
    jsonb_build_array(jsonb_build_object(
      'question_id', '$TEST_QUESTION_ID',
      'selected_answer', 0
    ))
  );

  IF attacker_result IS DISTINCT FROM '{"error":"Unauthorized"}'::jsonb THEN
    RAISE EXCEPTION 'Submitting another user''s pre-test returned %, expected Unauthorized',
      attacker_result;
  END IF;

  SELECT count(*) INTO answer_count
  FROM public.pre_test_answers WHERE pre_test_id = '$TEST_OWNERSHIP_PRE_TEST_ID';
  IF answer_count <> 0 THEN
    RAISE EXCEPTION 'Unauthorized submission saved % answers', answer_count;
  END IF;

  IF (SELECT to_jsonb(pt) FROM public.pre_tests pt
      WHERE pt.id = '$TEST_OWNERSHIP_PRE_TEST_ID') IS DISTINCT FROM before_pre_test THEN
    RAISE EXCEPTION 'Unauthorized submission changed the owner''s pre-test';
  END IF;
  IF (SELECT to_jsonb(p) FROM public.profiles p
      WHERE p.user_id = '$TEST_USER_ID') IS DISTINCT FROM before_profile THEN
    RAISE EXCEPTION 'Unauthorized submission changed the owner''s profile';
  END IF;
END;
\$\$;
SQL

OWNER_RESULT="$(
  "${PSQL[@]}" -Atq <<SQL | grep '^{'
BEGIN;
SELECT set_config('request.jwt.claim.sub', '$TEST_USER_ID', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT public.submit_assessment(
  '$TEST_OWNERSHIP_PRE_TEST_ID',
  jsonb_build_array(jsonb_build_object(
    'question_id', '$TEST_QUESTION_ID',
    'selected_answer', 1
  ))
)::text;
COMMIT;
SQL
)"

"${PSQL[@]}" -v owner_result="$OWNER_RESULT" >/dev/null <<SQL
SELECT set_config('test.owner_result', :'owner_result', false);
DO \$\$
DECLARE
  answer_count integer;
  saved_answer integer;
  saved_correct boolean;
  owner_pre_test public.pre_tests%ROWTYPE;
  profile_level text;
  profile_score integer;
BEGIN
  IF current_setting('test.owner_result')::jsonb IS DISTINCT FROM
     '{"score":100,"level":"Utama","correct":1,"total":1}'::jsonb THEN
    RAISE EXCEPTION 'Owner could not complete the pre-test: %',
      current_setting('test.owner_result');
  END IF;

  SELECT * INTO STRICT owner_pre_test
  FROM public.pre_tests WHERE id = '$TEST_OWNERSHIP_PRE_TEST_ID';
  SELECT count(*), min(selected_answer), bool_and(is_correct)
  INTO answer_count, saved_answer, saved_correct
  FROM public.pre_test_answers WHERE pre_test_id = '$TEST_OWNERSHIP_PRE_TEST_ID';
  SELECT current_level, total_score INTO STRICT profile_level, profile_score
  FROM public.profiles WHERE user_id = '$TEST_USER_ID';

  IF owner_pre_test.status IS DISTINCT FROM 'completed'
     OR owner_pre_test.completed_at IS NULL
     OR owner_pre_test.correct_answers IS DISTINCT FROM 1
     OR owner_pre_test.score IS DISTINCT FROM 100
     OR owner_pre_test.determined_level IS DISTINCT FROM 'Utama'
     OR answer_count <> 1 OR saved_answer IS DISTINCT FROM 1
     OR saved_correct IS DISTINCT FROM true
     OR profile_level IS DISTINCT FROM 'Utama' OR profile_score IS DISTINCT FROM 100 THEN
    RAISE EXCEPTION 'Owner submission did not save the expected answer, result and profile';
  END IF;
END;
\$\$;
SQL

echo "Concurrent submit_assessment tests passed."
