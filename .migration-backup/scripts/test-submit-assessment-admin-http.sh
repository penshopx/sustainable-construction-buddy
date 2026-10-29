#!/usr/bin/env bash
# Sourced by test-submit-assessment-concurrency.sh after the owner has completed
# the fixture. Never use the service role for member-data HTTP requests.
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

  status="$(curl --silent --show-error --max-time 15 \
    --output "$TMP_DIR/admin-session.json" --write-out '%{http_code}' \
    --request POST "${TEST_SUPABASE_URL%/}/auth/v1/token?grant_type=password" \
    --header "apikey: $TEST_SUPABASE_ANON_KEY" \
    --header 'Content-Type: application/json' \
    --data "$(jq -nc --arg password "$ADMIN_PASSWORD" \
      '{email:"assessment-admin@example.invalid",password:$password}')")"
  unset ADMIN_PASSWORD
  if [[ "$status" != "200" ]] ||
     ! jq -e --arg admin "$TEST_ADMIN_USER_ID" --arg owner "$TEST_USER_ID" \
       --arg other "$TEST_OTHER_USER_ID" \
       '.user.id == $admin and .user.id != $owner and .user.id != $other and
        (.access_token | type) == "string" and (.access_token | length) > 0' \
       "$TMP_DIR/admin-session.json" >/dev/null; then
    echo "Could not obtain the local assessment admin's distinct Auth session (HTTP $status)" >&2
    exit 1
  fi
  admin_token="$(jq -r '.access_token' "$TMP_DIR/admin-session.json")"
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
