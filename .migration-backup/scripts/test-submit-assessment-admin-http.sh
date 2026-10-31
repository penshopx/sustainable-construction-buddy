#!/usr/bin/env bash
# Sourced by test-submit-assessment-concurrency.sh before the owner's first
# submission and reused after completion. Never use the service role for
# member-data HTTP requests.
assessment_admin_http_token() {
  local status
  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-session.json" --write-out '%{http_code}' \
    --request POST "${TEST_SUPABASE_URL%/}/auth/v1/token?grant_type=password" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header 'Content-Type: application/json' \
    --data "$(jq -nc --arg password "$ADMIN_PASSWORD" \
      '{email:"assessment-admin@example.invalid",password:$password}')")"
  if [[ "$status" != "200" ]] ||
     ! jq -e --arg admin "$TEST_ADMIN_USER_ID" --arg owner "$TEST_USER_ID" \
       --arg other "$TEST_OTHER_USER_ID" \
       '.user.id == $admin and .user.id != $owner and .user.id != $other and
        (.access_token | type) == "string" and (.access_token | length) > 0' \
       "$TMP_DIR/admin-session.json" >/dev/null; then
    echo "Could not obtain the local assessment admin's distinct Auth session (HTTP $status)" >&2
    return 1
  fi
  jq -r '.access_token' "$TMP_DIR/admin-session.json"
}

# Called with a verified real admin token while the owner's assessment is
# unfinished. All fixture reads/writes bypass RLS; every access under test uses
# Auth/PostgREST with the anon API key and the appropriate user's session.
test_admin_http_draft_privacy() {
  local admin_token="$1" status before_state expected_admin expected_owner attack
  local own_pre_test_id="00000000-0000-4000-8000-000000000182"

  "${PSQL[@]}" >/dev/null <<SQL
INSERT INTO public.pre_tests (
  id, user_id, total_questions, status, started_at, deadline_at, authorized_question_ids
)
SELECT '$own_pre_test_id', '$TEST_ADMIN_USER_ID', 1, 'in_progress',
  started_at - interval '1 second', deadline_at, ARRAY['$TEST_QUESTION_ID'::uuid]
FROM public.pre_tests WHERE id = '$TEST_OWNERSHIP_PRE_TEST_ID';
INSERT INTO public.assessment_drafts (pre_test_id, draft)
SELECT id, jsonb_build_object(
  'version', 1, 'revision', 0, 'preTestId', id,
  'questions', jsonb_build_array(jsonb_build_object('id', '$TEST_QUESTION_ID')),
  'answers', jsonb_build_object('$TEST_QUESTION_ID',
    CASE WHEN user_id = '$TEST_USER_ID'::uuid THEN 1 ELSE 0 END),
  'answerResults', '{}'::jsonb, 'phase', 'review'
)
FROM public.pre_tests WHERE id IN ('$TEST_OWNERSHIP_PRE_TEST_ID', '$own_pre_test_id');
DO \$\$
BEGIN
  IF (SELECT count(*) FROM public.pre_tests pt
      JOIN public.assessment_drafts ad ON ad.pre_test_id = pt.id
      WHERE pt.id IN ('$TEST_OWNERSHIP_PRE_TEST_ID', '$own_pre_test_id')
        AND pt.status = 'in_progress' AND pt.completed_at IS NULL
        AND pt.deadline_at IS NOT NULL
        AND NOT public.assessment_deadline_passed(pt.deadline_at, clock_timestamp())
        AND public.validate_assessment_draft(ad.draft) IS TRUE) <> 2 THEN
    RAISE EXCEPTION 'Draft privacy fixture requires two valid, unfinished, unexpired drafts';
  END IF;
END;
\$\$;
SQL
  before_state="$(assessment_http_state)"
  # Match every response field except the intentionally changing server clock.
  expected_admin="$("${PSQL[@]}" -Atq -c "
    SELECT jsonb_build_object('preTestId', pt.id, 'startedAt', pt.started_at,
      'deadlineAt', pt.deadline_at, 'totalQuestions', pt.total_questions, 'draft', ad.draft)
    FROM public.pre_tests pt JOIN public.assessment_drafts ad ON ad.pre_test_id = pt.id
    WHERE pt.id = '$own_pre_test_id'")"
  expected_owner="$("${PSQL[@]}" -Atq -c "
    SELECT jsonb_build_object('preTestId', pt.id, 'startedAt', pt.started_at,
      'deadlineAt', pt.deadline_at, 'totalQuestions', pt.total_questions, 'draft', ad.draft)
    FROM public.pre_tests pt JOIN public.assessment_drafts ad ON ad.pre_test_id = pt.id
    WHERE pt.id = '$TEST_OWNERSHIP_PRE_TEST_ID'")"

  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-active-draft.json" --write-out '%{http_code}' \
    --request POST "${TEST_SUPABASE_URL%/}/rest/v1/rpc/get_active_assessment_draft" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token" \
    --header 'Content-Type: application/json' --data '{}')"
  if [[ "$status" != "200" ]] ||
     ! jq -e --argjson expected "$expected_admin" \
       'del(.serverNow) == $expected' "$TMP_DIR/admin-active-draft.json" >/dev/null 2>&1; then
    echo "Admin HTTP recovery did not return only the admin's own draft (HTTP $status)" >&2
    exit 1
  fi

  # Exercise both an explicit victim filter and an unfiltered table read.
  # Current grants reject SELECT entirely; a future owner-only RLS policy
  # may return rows, but only the admin's exact fixture row is allowed.
  local filter
  for filter in "pre_test_id=eq.$TEST_OWNERSHIP_PRE_TEST_ID&select=*" "select=*"; do
    status="$(curl --silent --show-error --max-time 15 \
      --output "$TMP_DIR/admin-draft-table.json" --write-out '%{http_code}' \
      "${TEST_SUPABASE_URL%/}/rest/v1/assessment_drafts?$filter" \
      --header "apikey: $TEST_SUPABASE_ANON_KEY" \
      --header "Authorization: Bearer $admin_token")"
    if [[ "$status" == "403" ]]; then
      if ! jq -e '.code == "42501" and .message == "permission denied for table assessment_drafts"' \
        "$TMP_DIR/admin-draft-table.json" >/dev/null 2>&1; then
        echo "Admin draft SELECT failed for an unexpected reason" >&2
        exit 1
      fi
    elif [[ "$status" != "200" ]] ||
         ! jq -e --arg id "$own_pre_test_id" --arg filter "$filter" \
           --argjson expected "$expected_admin" \
           'type == "array" and
            (if $filter == "select=*" then
              all(.[]; .pre_test_id == $id and .draft == $expected.draft)
             else . == [] end)' "$TMP_DIR/admin-draft-table.json" >/dev/null 2>&1; then
      echo "Admin HTTP SELECT exposed member drafts or failed unexpectedly (HTTP $status)" >&2
      exit 1
    fi
  done

  # Structurally valid payload, matching roster and current revision: denial
  # must be ownership, not validation, expiry, or a compare-and-swap conflict.
  attack="$(jq -nc --argjson expected "$expected_owner" --arg question "$TEST_QUESTION_ID" \
    '{_pre_test_id:$expected.preTestId,
      _draft:($expected.draft | .answers[$question] = 0)}')"
  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-save-member-draft.json" --write-out '%{http_code}' \
    --request POST "${TEST_SUPABASE_URL%/}/rest/v1/rpc/save_assessment_draft" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token" \
    --header 'Content-Type: application/json' --data "$attack")"
  if [[ "$status" != "400" ]] ||
     ! jq -e '. == {code:"P0001",details:null,hint:null,message:"Assessment unavailable"}' \
       "$TMP_DIR/admin-save-member-draft.json" >/dev/null 2>&1; then
    echo "Admin HTTP save of member draft was not denied solely for ownership (HTTP $status)" >&2
    exit 1
  fi
  if [[ "$(assessment_http_state)" != "$before_state" ]]; then
    echo "Admin draft HTTP checks changed the member draft, assessment, answers, or profile" >&2
    exit 1
  fi

  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/owner-recovered-draft.json" --write-out '%{http_code}' \
    --request POST "${TEST_SUPABASE_URL%/}/rest/v1/rpc/get_active_assessment_draft" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $OWNER_TOKEN" \
    --header 'Content-Type: application/json' --data '{}')"
  if [[ "$status" != "200" ]] ||
     ! jq -e --argjson expected "$expected_owner" 'del(.serverNow) == $expected' \
       "$TMP_DIR/owner-recovered-draft.json" >/dev/null 2>&1; then
    echo "Owner HTTP recovery did not preserve the original member draft (HTTP $status)" >&2
    exit 1
  fi
  if [[ "$(assessment_http_state)" != "$before_state" ]]; then
    echo "Owner draft recovery changed persisted member data" >&2
    exit 1
  fi
  "${PSQL[@]}" >/dev/null -c "DELETE FROM public.pre_tests WHERE id = '$own_pre_test_id'"
  echo "Admin HTTP recovered only its own draft; member draft SELECT/save were blocked, owner rows stayed unchanged and owner recovery succeeded."
}

test_admin_http_unfinished() {
  local status admin_token before_state
  # Commit the role so the real Auth/PostgREST session sees admin privileges.
  "${PSQL[@]}" >/dev/null <<SQL
INSERT INTO public.user_roles (user_id, role)
VALUES ('$TEST_ADMIN_USER_ID', 'admin');
SQL
  admin_token="$(assessment_admin_http_token)"
  before_state="$(assessment_http_state)"
  if ! jq -e --arg owner "$TEST_USER_ID" \
    '.pre_test.user_id == $owner and .pre_test.status == "in_progress" and
     .pre_test.completed_at == null and .answers == [] and
     .profile.user_id == $owner' >/dev/null <<<"$before_state"; then
    echo "Admin first HTTP submission requires an unfinished owner assessment without saved answers" >&2
    exit 1
  fi

  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-unfinished-role.json" --write-out '%{http_code}' \
    "${TEST_SUPABASE_URL%/}/rest/v1/user_roles?user_id=eq.$TEST_ADMIN_USER_ID&role=eq.admin&select=user_id,role" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token")"
  if [[ "$status" != "200" ]] ||
     ! jq -e --arg admin "$TEST_ADMIN_USER_ID" \
       '. == [{"user_id":$admin,"role":"admin"}]' \
       "$TMP_DIR/admin-unfinished-role.json" >/dev/null 2>&1; then
    echo "Admin first HTTP submission lacks the application admin role (HTTP $status)" >&2
    exit 1
  fi
  # Positive control: summary visibility must not imply permission to submit.
  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-unfinished-summary.json" --write-out '%{http_code}' \
    "${TEST_SUPABASE_URL%/}/rest/v1/pre_tests?id=eq.$TEST_OWNERSHIP_PRE_TEST_ID&select=id,user_id,status,score,determined_level,correct_answers,total_questions" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token")"
  if [[ "$status" != "200" ]] ||
     ! jq -e --argjson state "$before_state" \
       '. == [$state.pre_test | {id,user_id,status,score,determined_level,correct_answers,total_questions}]' \
       "$TMP_DIR/admin-unfinished-summary.json" >/dev/null 2>&1; then
    echo "Admin cannot read the unfinished member summary (HTTP $status)" >&2
    exit 1
  fi
  test_admin_http_draft_privacy "$admin_token"
  # The privacy check intentionally adds a member draft. Include it in the
  # baseline for the subsequent unauthorized submission check.
  before_state="$(assessment_http_state)"
  # Check the actual database clock immediately before the attack, not a
  # client-side timestamp or the fixture's earlier creation time.
  if [[ "$("${PSQL[@]}" -Atq -c "
    SELECT status = 'in_progress' AND completed_at IS NULL
      AND deadline_at IS NOT NULL
      AND NOT public.assessment_deadline_passed(deadline_at, clock_timestamp())
    FROM public.pre_tests WHERE id = '$TEST_OWNERSHIP_PRE_TEST_ID'")" != "t" ]]; then
    echo "Admin first HTTP submission requires an unfinished, unexpired assessment" >&2
    exit 1
  fi
  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-unfinished-rpc.json" --write-out '%{http_code}' \
    --request POST "${TEST_SUPABASE_URL%/}/rest/v1/rpc/submit_assessment" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token" \
    --header 'Content-Type: application/json' \
    --data "$(jq -nc --arg id "$TEST_OWNERSHIP_PRE_TEST_ID" --arg question "$TEST_QUESTION_ID" \
      '{_pre_test_id:$id,_answers:[{question_id:$question,selected_answer:0}]}')")"
  if [[ "$status" != "200" ]] ||
     ! jq -e '. == {"error":"Unauthorized"}' \
       "$TMP_DIR/admin-unfinished-rpc.json" >/dev/null 2>&1; then
    echo "Admin first HTTP submission did not return only Unauthorized (HTTP $status)" >&2
    exit 1
  fi
  # Privileged snapshots include every column, answers, draft and owner profile,
  # so RLS cannot conceal a write made by an accidentally permissive RPC.
  if [[ "$(assessment_http_state)" != "$before_state" ]]; then
    echo "Admin first HTTP submission changed the assessment, answers, draft, or owner profile" >&2
    exit 1
  fi
  "${PSQL[@]}" >/dev/null -c "
    DELETE FROM public.user_roles WHERE user_id = '$TEST_ADMIN_USER_ID' AND role = 'admin'"
  unset admin_token
  echo "Admin HTTP submission of unfinished assessment returned only Unauthorized without changing owner data."
}

test_admin_http_replay() {
  local status admin_token before_state payload label own_summary
  local own_pre_test_id="00000000-0000-4000-8000-000000000181"

  # Commit the application role so PostgREST's separate connections see it.
  # Remove it below before the existing transactional table-policy tests.
  "${PSQL[@]}" >/dev/null <<SQL
INSERT INTO public.user_roles (user_id, role)
VALUES ('$TEST_ADMIN_USER_ID', 'admin');
INSERT INTO public.pre_tests (
  id, user_id, total_questions, status, score,
  determined_level, correct_answers, completed_at
)
VALUES (
  '$own_pre_test_id', '$TEST_ADMIN_USER_ID', 1, 'completed', 100,
  'Utama', 1, now()
);
SQL
  own_summary="$("${PSQL[@]}" -Atq -c "
    SELECT jsonb_build_object(
      'id', id, 'user_id', user_id, 'status', status, 'score', score,
      'determined_level', determined_level, 'correct_answers', correct_answers,
      'total_questions', total_questions
    ) FROM public.pre_tests WHERE id = '$own_pre_test_id'")"

  admin_token="$(assessment_admin_http_token)"
  unset ADMIN_PASSWORD
  before_state="$(assessment_http_state)"
  if ! jq -e --arg owner "$TEST_USER_ID" \
    '.pre_test.user_id == $owner and .pre_test.status == "completed" and
     (.answers | length) == 1 and .profile.user_id == $owner' \
    >/dev/null <<<"$before_state"; then
    echo "Admin HTTP replay requires a completed owner assessment, answer and profile" >&2
    exit 1
  fi

  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-role-response.json" --write-out '%{http_code}' \
    "${TEST_SUPABASE_URL%/}/rest/v1/user_roles?user_id=eq.$TEST_ADMIN_USER_ID&role=eq.admin&select=user_id,role" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token")"
  if [[ "$status" != "200" ]] ||
     ! jq -e --arg admin "$TEST_ADMIN_USER_ID" \
       '. == [{"user_id":$admin,"role":"admin"}]' \
       "$TMP_DIR/admin-role-response.json" >/dev/null 2>&1; then
    echo "Admin HTTP replay session does not have the application admin role (HTTP $status)" >&2
    exit 1
  fi

  # Positive control: the same token can read the member's stored summary.
  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-summary-response.json" --write-out '%{http_code}' \
    "${TEST_SUPABASE_URL%/}/rest/v1/pre_tests?id=eq.$TEST_OWNERSHIP_PRE_TEST_ID&select=id,user_id,status,score,determined_level,correct_answers,total_questions" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token")"
  if [[ "$status" != "200" ]] ||
     ! jq -e --argjson state "$before_state" \
       '. == [$state.pre_test | {id,user_id,status,score,determined_level,correct_answers,total_questions}]' \
       "$TMP_DIR/admin-summary-response.json" >/dev/null 2>&1; then
    echo "Admin HTTP session cannot read the member's saved summary (HTTP $status)" >&2
    exit 1
  fi

  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-answers-response.json" --write-out '%{http_code}' \
    "${TEST_SUPABASE_URL%/}/rest/v1/pre_test_answers?pre_test_id=eq.$TEST_OWNERSHIP_PRE_TEST_ID" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token")"
  if [[ "$status" != "200" ]] ||
     ! jq -e '. == []' "$TMP_DIR/admin-answers-response.json" >/dev/null 2>&1; then
    echo "Admin HTTP table read exposed the member's per-question answers (HTTP $status)" >&2
    exit 1
  fi
  if [[ "$(assessment_http_state)" != "$before_state" ]]; then
    echo "Admin HTTP reads changed the assessment, answers, or owner profile" >&2
    exit 1
  fi

  # Check an ordinary replay and an empty replay. Exact equality rejects any
  # result leakage, including an error object with extra score/answer fields.
  for label in changed-answer empty-answers; do
    payload='[]'
    if [[ "$label" == "changed-answer" ]]; then
      payload="$(jq -nc --arg question "$TEST_QUESTION_ID" \
        '[{question_id:$question,selected_answer:0}]')"
    fi
    status="$(curl --silent --show-error --max-time 15 \
      --output "$TMP_DIR/admin-rpc-$label-response.json" --write-out '%{http_code}' \
      --request POST "${TEST_SUPABASE_URL%/}/rest/v1/rpc/submit_assessment" \
      --header "apikey: $TEST_SUPABASE_ANON_KEY" \
      --header "Authorization: Bearer $admin_token" \
      --header 'Content-Type: application/json' \
      --data "$(jq -nc --arg id "$TEST_OWNERSHIP_PRE_TEST_ID" --argjson answers "$payload" \
        '{_pre_test_id:$id,_answers:$answers}')")"
    if [[ "$status" != "200" ]] ||
       ! jq -e '. == {"error":"Unauthorized"}' \
         "$TMP_DIR/admin-rpc-$label-response.json" >/dev/null 2>&1; then
      echo "Admin HTTP assessment replay ($label) did not return only Unauthorized (HTTP $status)" >&2
      exit 1
    fi
    # Use privileged full-row snapshots: the admin's RLS view hides answers
    # and would otherwise conceal a write by an accidentally permissive RPC.
    if [[ "$(assessment_http_state)" != "$before_state" ]]; then
      echo "Admin HTTP replay ($label) changed the assessment, answers, or owner profile" >&2
      exit 1
    fi
  done
  # Commit revocation through the privileged fixture connection. Do not sign
  # in, refresh, or replace admin_token: PostgREST must apply the new database
  # role membership to the very same Auth session on its next request.
  "${PSQL[@]}" >/dev/null <<SQL
DELETE FROM public.user_roles
WHERE user_id = '$TEST_ADMIN_USER_ID' AND role = 'admin';
DO \$\$
BEGIN
  IF public.has_role('$TEST_ADMIN_USER_ID', 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'HTTP revocation fixture still has effective admin access';
  END IF;
END;
\$\$;
SQL
  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/revoked-admin-member-summary.json" --write-out '%{http_code}' \
    "${TEST_SUPABASE_URL%/}/rest/v1/pre_tests?id=eq.$TEST_OWNERSHIP_PRE_TEST_ID&select=id,user_id,status,score,determined_level,correct_answers,total_questions" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token")"
  if [[ "$status" != "200" ]] ||
     ! jq -e '. == []' "$TMP_DIR/revoked-admin-member-summary.json" >/dev/null 2>&1; then
    echo "Revoked admin's unchanged HTTP token can still read a member result or failed (HTTP $status)" >&2
    exit 1
  fi

  # Positive control: an expired/rejected token or a deny-all SELECT policy
  # must not masquerade as successful revocation of access to other members.
  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/revoked-admin-own-summary.json" --write-out '%{http_code}' \
    "${TEST_SUPABASE_URL%/}/rest/v1/pre_tests?id=eq.$own_pre_test_id&select=id,user_id,status,score,determined_level,correct_answers,total_questions" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header "Authorization: Bearer $admin_token")"
  if [[ "$status" != "200" ]] ||
     ! jq -e --argjson expected "$own_summary" '. == [$expected]' \
       "$TMP_DIR/revoked-admin-own-summary.json" >/dev/null 2>&1; then
    echo "Revoked admin's unchanged HTTP token cannot read their own saved result (HTTP $status)" >&2
    exit 1
  fi
  if [[ "$(assessment_http_state)" != "$before_state" ]]; then
    echo "Admin HTTP revocation checks changed the member assessment, answers, or profile" >&2
    exit 1
  fi
  unset admin_token
  "${PSQL[@]}" >/dev/null <<SQL
DELETE FROM public.pre_tests WHERE id = '$own_pre_test_id';
SQL
  echo "Admin HTTP summary access succeeded; per-question answers stayed hidden and RPC replays were denied without changing owner data."
  echo "After admin revocation, the unchanged HTTP token hid the member result and still returned the admin's own saved result."
}
