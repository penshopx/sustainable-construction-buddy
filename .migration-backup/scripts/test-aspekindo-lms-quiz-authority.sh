#!/usr/bin/env bash
# Self-contained local PostgreSQL integration test. No hosted database URL is used.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
PORT=$((50000 + $$ % 10000))
started=0
cleanup() {
  if (( started )); then pg_ctl -D "$TMP/db" -m immediate stop >/dev/null; fi
  rm -rf "$TMP"
}
trap cleanup EXIT

initdb -D "$TMP/db" -U postgres -A trust --no-instructions >/dev/null
pg_ctl -D "$TMP/db" -o "-c listen_addresses='' -k $TMP -p $PORT" -l "$TMP/server.log" start >/dev/null
started=1
PSQL=(psql -X -v ON_ERROR_STOP=1 -h "$TMP" -p "$PORT" -d postgres)
"${PSQL[@]}" -f "$ROOT/supabase/tests/aspekindo_lms_quiz_local_schema.sql" >/dev/null

# Load the real migrated RPC bodies instead of maintaining a second copy in
# the test harness. The later migration replaces the lesson completion RPC.
python3 - "$ROOT/supabase/migrations" "$TMP/functions.sql" <<'PY'
from pathlib import Path
import sys

migrations, output = Path(sys.argv[1]), Path(sys.argv[2])
functions = [
    ("20261031110000_weight_aspekindo_lms_quiz_scores.sql", "submit_aspekindo_lms_quiz"),
    ("20260901020000_harden_aspekindo_lms_participant_flows.sql", "complete_aspekindo_lms_lesson"),
]
with output.open("w") as target:
    for filename, name in functions:
        source = (migrations / filename).read_text()
        start = source.index(f"CREATE OR REPLACE FUNCTION public.{name}(")
        end = source.index("\n$$;", start) + len("\n$$;")
        target.write(source[start:end] + "\n")
PY
"${PSQL[@]}" -f "$TMP/functions.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/aspekindo_lms_quiz_authority.sql" >/dev/null
echo "LMS quiz scoring and completion RPC test passed (isolated local PostgreSQL)."