#!/usr/bin/env python3
"""No database/network needed: check CI staging and local-only runner guards."""
import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parent


class QuizCI(unittest.TestCase):
    def test_all_migrations_staged_once_in_order(self):
        spec = importlib.util.spec_from_file_location(
            "prepare", SCRIPTS / "prepare-supabase-test-project.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as directory:
            module.prepare(Path(directory))
            target = Path(directory) / "supabase"
            staged = sorted((target / "migrations").glob("*.sql"))
            original = sorted((SCRIPTS.parent / "supabase/migrations").glob("*.sql"))
            contents = "\n".join(file.read_text() for file in staged)
            positions = []
            for file in original:
                marker = f"-- Source: {file.name}\n"
                self.assertEqual(contents.count(marker), 1, file.name)
                self.assertIn(marker + file.read_text(), contents)
                positions.append(contents.index(marker))
            self.assertEqual(positions, sorted(positions))
            self.assertEqual(len(staged), len({f.name.split("_")[0] for f in original}))
            self.assertEqual((target / "config.toml").read_text(), 'project_id = "aspekindo-ci"\n')
            self.assertFalse((target / ".temp").exists())

    def run_runner(self, url):
        with tempfile.TemporaryDirectory() as directory:
            fake = Path(directory) / "psql"
            # A sentinel proves rejected URLs never reach the database client.
            fake.write_text('#!/bin/sh\nprintf "%s\\n" "$@" > "$CALL_LOG"\n')
            fake.chmod(0o755)
            log = Path(directory) / "called"
            env = {**os.environ, "PATH": directory + os.pathsep + os.environ["PATH"],
                   "CALL_LOG": str(log), "DATABASE_URL": "postgresql://production.invalid/postgres"}
            env.pop("TEST_DATABASE_URL", None)
            if url is not None:
                env["TEST_DATABASE_URL"] = url
            result = subprocess.run(
                ["bash", str(SCRIPTS / "test-aspekindo-lms-quiz-authority.sh"), "--supabase"],
                env=env, capture_output=True, text=True,
            )
            return result.returncode, log.read_text() if log.exists() else None

    def test_local_supabase_uses_full_schema_suite(self):
        code, args = self.run_runner("postgresql://postgres:postgres@127.0.0.1:54322/postgres")
        self.assertEqual(code, 0)
        self.assertIn("full_schema=true", args)
        self.assertIn("expected_migrations=", args)
        self.assertIn("aspekindo_lms_quiz_authority.sql", args)
        self.assertNotIn("aspekindo_lms_quiz_local_schema.sql", args)

    def test_reject_missing_hosted_and_connection_overrides(self):
        for url in (
            None,
            "postgresql://postgres:postgres@production.invalid:54322/postgres",
            "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
            "postgresql://postgres:postgres@127.0.0.1:54322/production",
            "postgresql://postgres:postgres@127.0.0.1:54322/postgres?host=production.invalid",
            "postgresql://postgres:postgres@127.0.0.1:54322/postgres#fragment",
        ):
            with self.subTest(url=url):
                code, args = self.run_runner(url)
                self.assertNotEqual(code, 0)
                self.assertIsNone(args)


if __name__ == "__main__":
    unittest.main()
