#!/usr/bin/env python3
"""Backfill integration: actual legacy drafts, full migrations, Auth/PostgREST.

Run only on a disposable project staged with --before 20261031100000.
Never rerun on an already upgraded database; create a fresh local project.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import time
import unittest
import uuid


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


authority = load("question_http", "test-assessment-question-authority-http.py")
staging = load("prepare", "prepare-supabase-test-project.py")
CUTOFF = "20261031100000"
literal = authority.literal


def check_staging(project):
    """Refuse linked projects, modified SQL, or an already promoted staging tree."""
    target = project / "supabase"
    if (target / ".temp/project-ref").exists():
        raise AssertionError("Requires an unlinked disposable staging project")
    with tempfile.TemporaryDirectory() as directory:
        staging.prepare(Path(directory), CUTOFF)
        expected = Path(directory) / "supabase"
        for name in ("config.toml", "migrations", "deferred-migrations"):
            want, actual = expected / name, target / name
            if want.is_file():
                if not actual.is_file() or actual.read_bytes() != want.read_bytes():
                    raise AssertionError("Requires original disposable staging config")
            else:
                desired = {p.name: p.read_bytes() for p in want.iterdir()}
                found = {p.name: p.read_bytes() for p in actual.iterdir()} if actual.is_dir() else {}
                if found != desired:
                    raise AssertionError("Requires original split repository migrations")


def check_legacy_ledger(db):
    """An empty/minimal schema or already migrated database is not a backfill test."""
    versions = sorted({p.name.split("_")[0] for p in
                       (authority.ROOT / "supabase/migrations").glob("*.sql")
                       if p.name.split("_")[0] < CUTOFF} | {"20260827051515"})
    actual = json.loads(db.sql(
        "SELECT COALESCE(jsonb_agg(version ORDER BY version), '[]') "
        "FROM supabase_migrations.schema_migrations;"))
    if actual != versions:
        raise AssertionError("Requires exactly every migration BEFORE question authority")
    if db.sql("""
        SELECT count(*) FROM information_schema.columns
        WHERE table_schema='public' AND table_name='pre_tests'
          AND column_name='authorized_question_ids';
    """) != "0":
        raise AssertionError("Question authority column already exists")


def apply_remaining(db, project):
    target = project / "supabase"
    for migration in sorted((target / "deferred-migrations").glob("*.sql")):
        migration.rename(target / "migrations" / migration.name)
    # Do not emit CLI diagnostics: local keys/connection strings can appear there.
    result = subprocess.run(
        ["supabase", "--workdir", str(project), "migration", "up", "--local"],
        capture_output=True, text=True, timeout=180,
    )
    if result.returncode:
        raise AssertionError("Supabase CLI failed to apply remaining local migrations")
    expected = sorted({p.name.split("_")[0] for p in
                       (authority.ROOT / "supabase/migrations").glob("*.sql")}
                      | {"20260827051515"})
    actual = json.loads(db.sql(
        "SELECT jsonb_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations;"))
    if actual != expected:
        raise AssertionError("Requires EVERY repository migration after upgrade")
    db.sql("NOTIFY pgrst, 'reload schema';")


class LegacyAuthorityHTTP(authority.QuestionAuthorityHTTP):
    """Reuse exact HTTP denials, whole-row snapshots and Auth fixture cleanup."""

    @classmethod
    def setUpClass(cls):
        cls.db = authority.LocalSupabase()  # URL/key safety before ALL I/O.
        check_staging(cls.project)
        check_legacy_ledger(cls.db)
        cls.users = []
        cls.domain, cls.small_domain = str(uuid.uuid4()), str(uuid.uuid4())
        cls.questions = [str(uuid.uuid4()) for _ in range(5)]
        cls.small_questions = [str(uuid.uuid4()) for _ in range(2)]
        cls.addClassCleanup(cls.cleanup)
        cls.owner, cls.owner_token = cls.create_user("legacy")
        cls.db.sql(f"""
            INSERT INTO public.competency_domains(id,name) VALUES
              ({literal(cls.domain)}, 'Legacy large domain'),
              ({literal(cls.small_domain)}, 'Legacy small domain');
            INSERT INTO public.questions(id,domain_id,question_text,options,correct_answer)
            VALUES {','.join(
                f"({literal(q)}, {literal(domain)}, 'Legacy fixture', '[\"A\",\"B\"]', 1)"
                for domain, questions in ((cls.domain, cls.questions),
                                          (cls.small_domain, cls.small_questions))
                for q in questions)};
        """)
        seeded = json.loads(cls.db.sql(f"""
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'id',id,'options',options,'question_text',question_text)
              ORDER BY domain_id,id), '[]')
            FROM (SELECT q.*, row_number() OVER (PARTITION BY domain_id ORDER BY id) rn
                  FROM public.questions q WHERE domain_id NOT IN
                    ({literal(cls.domain)}, {literal(cls.small_domain)})) ranked
            WHERE rn <= 4;
        """))
        own = [{"id": q, "options": ["A", "B"], "question_text": "Legacy fixture"}
               for q in cls.questions]
        small = [{"id": q, "options": ["A", "B"], "question_text": "Legacy fixture"}
                 for q in cls.small_questions]
        cls.roster = seeded + own[:4] + small
        if not seeded or not 6 <= len(cls.roster) <= 99:
            raise AssertionError("Requires full seeded bank and room for fixture questions")
        # Nonempty history/profile/answers catch hidden destructive writes.
        history, _ = cls.start(cls.owner_token, cls.roster)
        status, body = cls.db.rpc("submit_assessment", cls.owner_token, {
            "_pre_test_id": history, "_answers": cls.answers(cls.roster)})
        if status != 200 or body.get("total") != len(cls.roster):
            raise AssertionError("Pre-upgrade scorer positive control failed")
        if cls.db.sql("SELECT count(*) FROM public.pre_test_answers "
                      f"WHERE pre_test_id={literal(history)};") != str(len(cls.roster)):
            raise AssertionError("Historical answers baseline missing")
        cls.fixtures = {}
        cases = {
            "complete": cls.roster,
            "duplicate": seeded + own[:3] + own[:1] + small,
            "missing draft": cls.roster,
            "large domain omitted": seeded + small,
            "incomplete small domain": seeded + own[:4] + small[:1],
            "balanced wrong quotas": seeded + own + small[:1],
        }
        for label, roster in cases.items():
            test_id, draft = cls.start(cls.owner_token, roster)
            # Authentic versioned draft, including nonempty saved choices.
            draft["answers"] = {q["id"]: 1 for q in own[:4] + small}
            status, saved = cls.db.rpc("save_assessment_draft", cls.owner_token, {
                "_pre_test_id": test_id, "_draft": draft})
            if status != 200 or saved.get("saved") is not True:
                raise AssertionError("Pre-upgrade draft save positive control failed")
            if label == "missing draft":
                cls.db.sql("DELETE FROM public.assessment_drafts "
                           f"WHERE pre_test_id={literal(test_id)};")
            cls.fixtures[label] = (test_id, roster)

    def setUp(self):
        pass  # Do not create a post-upgrade draft before migration is exercised.

    def test_legacy_backfill_and_atomic_rejections(self):
        before_upgrade = json.loads(self.snapshot())
        apply_remaining(self.db, self.project)
        after_upgrade = json.loads(self.snapshot())
        # Migration may ONLY add the authorized IDs, not rewrite legacy state.
        for row in after_upgrade["tests"]:
            row.pop("authorized_question_ids")
        self.assertEqual(after_upgrade, before_upgrade)
        for label, (test_id, roster) in self.fixtures.items():
            with self.subTest(backfill=label):
                ids = json.loads(self.db.sql(
                    "SELECT to_jsonb(authorized_question_ids) FROM public.pre_tests "
                    f"WHERE id={literal(test_id)};") or "null")
                self.assertEqual(ids, [q["id"] for q in roster] if label == "complete" else None)

        # Wait only for the real gateway schema cache; no fixed sleeps or mocks.
        complete = self.fixtures["complete"][0]
        for attempt in range(50):
            response = self.db.request(
                f"/rest/v1/pre_tests?id=eq.{complete}&select=id,authorized_question_ids",
                self.owner_token, method="GET")
            if response == (200, [{"id": complete,
                                  "authorized_question_ids": [q["id"] for q in self.roster]}]):
                break
            time.sleep(0.1)
        else:
            self.fail("PostgREST did not expose the migrated owner roster")

        for expired in (False, True):
            for label, (test_id, roster) in self.fixtures.items():
                if label == "complete":
                    continue
                with self.subTest(rejection=label, expired=expired):
                    if expired:
                        self.db.sql("UPDATE public.pre_tests "
                                    "SET deadline_at=clock_timestamp()-interval '1 second' "
                                    f"WHERE id={literal(test_id)};")
                    # Neither the original corrupted list nor a repaired browser
                    # list may authorize an assessment without server authority.
                    for answers in (self.answers(roster), self.answers(self.roster)):
                        before = self.snapshot()
                        self.assert_rpc_rejection(
                            self.submit(answers, test=test_id),
                            "Invalid assessment questions", before)

        # Same Auth session/RPC must succeed for the complete legacy draft.
        self.pre_test = complete
        before = json.loads(self.snapshot())
        status, result = self.submit(self.answers(self.roster))
        total, correct = len(self.roster), 6
        score = (100 * correct + total // 2) // total
        self.assertEqual((status, result), (200, {
            "score": score, "level": ("Utama" if score >= 85 else "Madya" if score >= 75
                                     else "Muda" if score >= 60 else "Pemula"),
            "correct": correct, "total": total,
        }))
        persisted = json.loads(self.db.sql(f"""
            SELECT jsonb_build_object(
              'status', p.status, 'score', p.score,
              'profile_score', (SELECT total_score FROM public.profiles
                                WHERE user_id=p.user_id),
              'answers', (SELECT jsonb_object_agg(question_id,selected_answer)
                          FROM public.pre_test_answers WHERE pre_test_id=p.id))
            FROM public.pre_tests p WHERE id={literal(complete)};
        """))
        self.assertEqual(persisted, {
            "status": "completed", "score": score, "profile_score": score,
            "answers": {q["id"]: 1 if q["id"] in self.questions[:4] + self.small_questions
                        else -1 for q in self.roster},
        })
        # Completion must not touch invalid drafts or older result/answer rows.
        after = json.loads(self.snapshot())
        for state in (before, after):
            state.pop("profiles")
            state["tests"] = [r for r in state["tests"] if r["id"] != complete]
            state["answers"] = [r for r in state["answers"] if r["pre_test_id"] != complete]
            state["drafts"] = [r for r in state["drafts"] if r["pre_test_id"] != complete]
        self.assertEqual(after, before)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workdir", required=True, type=Path)
    args = parser.parse_args()
    LegacyAuthorityHTTP.project = args.workdir.resolve()
    suite = unittest.TestSuite([LegacyAuthorityHTTP("test_legacy_backfill_and_atomic_rejections")])
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(not result.wasSuccessful())
