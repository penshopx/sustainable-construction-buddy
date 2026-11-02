#!/usr/bin/env bash
# Sourced by test-submit-assessment-concurrency.sh after local Auth sign-in.
# The subshell keeps worker cleanup separate from the parent fixture cleanup.
test_concurrent_http_submissions() (
  set -euo pipefail
  local mode="${1:-unexpired}"
  local TEST_HTTP_PRE_TEST_ID="$TEST_HTTP_PRE_TEST_ID" TEST_QUESTION_ID="$TEST_QUESTION_ID"
  local first_answer=1 second_answer=0
  case "$mode" in
    unexpired) ;;
    expired)
      TEST_HTTP_PRE_TEST_ID="$TEST_HTTP_EXPIRED_PRE_TEST_ID"
      TEST_QUESTION_ID="$TEST_HTTP_EXPIRED_QUESTION_ID"
      # Neither late device choice matches the correct server draft (1).
      first_answer=0
      second_answer=2
      ;;
    *) echo "Unknown HTTP concurrency scenario: $mode" >&2; exit 1 ;;
  esac
  local locker_pid="" first_pid="" second_pid=""
  trap 'for pid in "$first_pid" "$second_pid" "$locker_pid"; do
    if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi
  done' EXIT

  rm -f "$TMP_DIR/http-lock-ready" "$TMP_DIR/http-lock-release"
  if [[ "$mode" == "expired" ]]; then
    "${PSQL[@]}" >/dev/null <<SQL
INSERT INTO public.questions (id, domain_id, question_text, options, correct_answer)
VALUES ('$TEST_QUESTION_ID', '$TEST_DOMAIN_ID', 'Expired two-device test',
        '["Late device A", "Saved server choice", "Late device B"]'::jsonb, 1);
INSERT INTO public.pre_tests (
  id, user_id, total_questions, status, started_at, deadline_at, authorized_question_ids
) VALUES (
  '$TEST_HTTP_PRE_TEST_ID', '$TEST_USER_ID', 1, 'in_progress',
  clock_timestamp() - interval '3 minutes', clock_timestamp() - interval '90 seconds',
  ARRAY['$TEST_QUESTION_ID'::uuid]
);
INSERT INTO public.assessment_drafts (pre_test_id, draft, updated_at)
VALUES (
  '$TEST_HTTP_PRE_TEST_ID',
  jsonb_build_object(
    'version', 1, 'revision', 0, 'preTestId', '$TEST_HTTP_PRE_TEST_ID',
    'questions', jsonb_build_array(jsonb_build_object('id', '$TEST_QUESTION_ID')),
    'answers', jsonb_build_object('$TEST_QUESTION_ID', 1),
    'answerResults', '{}'::jsonb, 'phase', 'review'
  ),
  clock_timestamp() - interval '2 minutes'
);
DO \$\$
DECLARE
  assessment public.pre_tests%ROWTYPE;
  saved public.assessment_drafts%ROWTYPE;
BEGIN
  SELECT * INTO STRICT assessment FROM public.pre_tests WHERE id = '$TEST_HTTP_PRE_TEST_ID';
  SELECT * INTO STRICT saved FROM public.assessment_drafts WHERE pre_test_id = assessment.id;
  IF assessment.user_id IS DISTINCT FROM '$TEST_USER_ID'::uuid
     OR assessment.status IS DISTINCT FROM 'in_progress'
     OR assessment.completed_at IS NOT NULL
     OR NOT public.assessment_deadline_passed(assessment.deadline_at, clock_timestamp())
     OR saved.updated_at >= assessment.deadline_at
     OR public.validate_assessment_draft(saved.draft) IS NOT TRUE
     OR saved.draft->'answers'->>'$TEST_QUESTION_ID' IS DISTINCT FROM '1'
     OR EXISTS (SELECT 1 FROM public.pre_test_answers WHERE pre_test_id = assessment.id) THEN
    RAISE EXCEPTION 'Expired concurrency requires an unfinished owner assessment and a valid pre-deadline server draft';
  END IF;
END;
\$\$;
SQL
  else
    "${PSQL[@]}" >/dev/null <<SQL
INSERT INTO public.pre_tests (id, user_id, total_questions)
VALUES ('$TEST_HTTP_PRE_TEST_ID', '$TEST_USER_ID', 1);
SQL
  fi

  "${PSQL[@]}" >/dev/null <<SQL
-- Audit actual writes, not only the final row count: deleting and reinserting
-- an answer (or overwriting it) must not pass as "saved once".
CREATE TABLE public.assessment_http_write_audit (kind text NOT NULL);
CREATE FUNCTION public.record_assessment_http_write()
RETURNS trigger LANGUAGE plpgsql AS \$\$
BEGIN
  IF TG_TABLE_NAME = 'pre_tests' THEN
    IF NEW.id = '$TEST_HTTP_PRE_TEST_ID'::uuid
       AND (NEW.status = 'completed'
            OR NEW.completed_at IS DISTINCT FROM OLD.completed_at) THEN
      INSERT INTO public.assessment_http_write_audit VALUES ('completion');
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.pre_test_id = '$TEST_HTTP_PRE_TEST_ID'::uuid THEN
      INSERT INTO public.assessment_http_write_audit VALUES ('answer_DELETE');
    END IF;
  ELSIF NEW.pre_test_id = '$TEST_HTTP_PRE_TEST_ID'::uuid THEN
    INSERT INTO public.assessment_http_write_audit VALUES ('answer_' || TG_OP);
  END IF;
  RETURN NULL;
END;
\$\$;
CREATE TRIGGER assessment_http_completion_audit AFTER UPDATE ON public.pre_tests
FOR EACH ROW EXECUTE FUNCTION public.record_assessment_http_write();
CREATE TRIGGER assessment_http_answer_audit AFTER INSERT OR UPDATE OR DELETE ON public.pre_test_answers
FOR EACH ROW EXECUTE FUNCTION public.record_assessment_http_write();
SQL

  # Hold this unfinished assessment until BOTH requests wait on its lock.
  # Release immediately after observation, before the gateway statement timeout.
  # Merely launching curl twice could test sequential replay.
  "${PSQL[@]}" >"$TMP_DIR/http-locker.out" 2>&1 <<SQL &
BEGIN;
SET LOCAL application_name = 'assessment_http_concurrency_locker';
SET LOCAL statement_timeout = '20s';
SELECT 1 FROM public.pre_tests WHERE id = '$TEST_HTTP_PRE_TEST_ID' FOR UPDATE;
\! touch "$TMP_DIR/http-lock-ready"
\! timeout 20 sh -c 'while [ ! -e "$TMP_DIR/http-lock-release" ]; do sleep 0.05; done'
COMMIT;
SQL
  locker_pid=$!

  local blocked=0
  for _ in {1..100}; do
    [[ -f "$TMP_DIR/http-lock-ready" ]] && break
    sleep 0.05
  done
  if [[ ! -f "$TMP_DIR/http-lock-ready" ]]; then
    echo "Could not lock the unfinished assessment for concurrent HTTP submissions." >&2
    exit 1
  fi

  submit_http() {
    local answer="$1" label="$2"
    curl --silent --show-error --max-time 25 \
      --output "$TMP_DIR/http-$label.json" --write-out '%{http_code}' \
      --request POST "${TEST_SUPABASE_URL%/}/rest/v1/rpc/submit_assessment" \
      --header "apikey: $TEST_SUPABASE_ANON_KEY" \
      --header "Authorization: Bearer $OWNER_TOKEN" \
      --header 'Content-Type: application/json' \
      --data "{\"_pre_test_id\":\"$TEST_HTTP_PRE_TEST_ID\",\"_answers\":[{\"question_id\":\"$TEST_QUESTION_ID\",\"selected_answer\":$answer}]}" \
      >"$TMP_DIR/http-$label.status"
  }
  submit_http "$first_answer" first &
  first_pid=$!
  submit_http "$second_answer" second &
  second_pid=$!

  for _ in {1..100}; do
    # Follow the blocker tree: the second call can wait on the first call's
    # tuple lock, rather than directly on the coordinating transaction.
    blocked="$("${PSQL[@]}" -Atq -c "
      WITH RECURSIVE waiting(pid) AS (
        SELECT pid FROM pg_stat_activity
        WHERE application_name = 'assessment_http_concurrency_locker'
        UNION
        SELECT a.pid FROM pg_stat_activity a
        JOIN waiting w ON w.pid = ANY(pg_blocking_pids(a.pid))
      )
      SELECT count(*) FROM pg_stat_activity a JOIN waiting w USING (pid)
      WHERE a.application_name <> 'assessment_http_concurrency_locker'
        AND a.query LIKE '%submit_assessment%' AND a.state = 'active'
        AND a.wait_event_type = 'Lock'")"
    [[ "$blocked" == "2" ]] && break
    sleep 0.05
  done
  if [[ "$blocked" != "2" ]]; then
    echo "Expected two HTTP RPCs blocked on the same unfinished assessment; observed $blocked." >&2
    exit 1
  fi

  touch "$TMP_DIR/http-lock-release"
  wait "$locker_pid"
  locker_pid=""
  wait "$first_pid"
  first_pid=""
  wait "$second_pid"
  second_pid=""

  local label
  for label in first second; do
    if [[ "$(cat "$TMP_DIR/http-$label.status")" != "200" ]] ||
       ! jq -e 'type == "object" and
         (. == {"score":100,"level":"Utama","correct":1,"total":1} or
          . == {"score":0,"level":"Pemula","correct":0,"total":1})' \
         "$TMP_DIR/http-$label.json" >/dev/null 2>&1; then
      echo "Concurrent owner HTTP submission ($label) failed or returned an invalid result." >&2
      exit 1
    fi
  done
  if ! jq -e --slurp '.[0] == .[1]' \
      "$TMP_DIR/http-first.json" "$TMP_DIR/http-second.json" >/dev/null; then
    echo "Concurrent owner HTTP submissions returned different scores/results." >&2
    exit 1
  fi
  if [[ "$mode" == "expired" ]] &&
     ! jq -e '. == {"score":100,"level":"Utama","correct":1,"total":1}' \
       "$TMP_DIR/http-first.json" >/dev/null; then
    echo "Both expired RPCs must return the server draft result, not either late payload." >&2
    exit 1
  fi

  "${PSQL[@]}" -v expected_result="$(cat "$TMP_DIR/http-first.json")" >/dev/null <<SQL
SELECT set_config('test.http_result', :'expected_result', false);
DO \$\$
DECLARE
  result jsonb := current_setting('test.http_result')::jsonb;
  assessment public.pre_tests%ROWTYPE;
  answer public.pre_test_answers%ROWTYPE;
BEGIN
  SELECT * INTO STRICT assessment FROM public.pre_tests WHERE id = '$TEST_HTTP_PRE_TEST_ID';
  SELECT * INTO STRICT answer FROM public.pre_test_answers WHERE pre_test_id = '$TEST_HTTP_PRE_TEST_ID';
  IF assessment.user_id IS DISTINCT FROM '$TEST_USER_ID'::uuid
     OR assessment.status IS DISTINCT FROM 'completed' OR assessment.completed_at IS NULL
     OR jsonb_build_object('score', assessment.score, 'level', assessment.determined_level,
          'correct', assessment.correct_answers, 'total', assessment.total_questions)
        IS DISTINCT FROM result
     OR answer.question_id IS DISTINCT FROM '$TEST_QUESTION_ID'::uuid
     OR answer.selected_answer IS DISTINCT FROM (result->>'correct')::integer
     OR answer.is_correct IS DISTINCT FROM ((result->>'correct')::integer = 1) THEN
    RAISE EXCEPTION 'Concurrent HTTP result does not match the single persisted owner answer and score';
  END IF;
  IF (SELECT count(*) FROM public.assessment_http_write_audit WHERE kind = 'completion') <> 1
     OR (SELECT count(*) FROM public.assessment_http_write_audit WHERE kind = 'answer_INSERT') <> 1
     OR (SELECT count(*) FROM public.assessment_http_write_audit) <> 2 THEN
    RAISE EXCEPTION 'Concurrent HTTP submissions must write the answer and completion exactly once';
  END IF;
END;
\$\$;

-- Do not leave this newer result participating in the parent script's profile
-- precedence assertions for the separate first-owner-submit fixture.
DROP TRIGGER assessment_http_answer_audit ON public.pre_test_answers;
DROP TRIGGER assessment_http_completion_audit ON public.pre_tests;
DROP FUNCTION public.record_assessment_http_write();
DROP TABLE public.assessment_http_write_audit;
DELETE FROM public.pre_tests WHERE id = '$TEST_HTTP_PRE_TEST_ID';
SQL
  echo "Two overlapping $mode owner HTTP RPCs returned identical results and saved the answer/completion once."
)
