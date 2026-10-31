#!/usr/bin/env python3
"""Stage every repository migration for disposable local Supabase CI only."""
from pathlib import Path
import sys


def prepare(destination: Path) -> None:
    source = Path(__file__).resolve().parents[1] / "supabase"
    target = destination / "supabase"
    target.mkdir(parents=True, exist_ok=False)
    # Do not copy linked-project metadata or the production project identifier.
    (target / "config.toml").write_text('project_id = "aspekindo-ci"\n')
    migrations = target / "migrations"
    migrations.mkdir()
    grouped: dict[str, list[Path]] = {}
    for migration in sorted((source / "migrations").glob("*.sql")):
        grouped.setdefault(migration.name.split("_", 1)[0], []).append(migration)
    for version, files in grouped.items():
        # Legacy migrations share a timestamp. Supabase's migration ledger has
        # a unique version key, so concatenate those files in filename order
        # in this disposable copy only; never rename deployed migrations.
        (migrations / f"{version}_ci.sql").write_text(
            "\n".join(f"-- Source: {file.name}\n{file.read_text()}\n" for file in files)
        )


if __name__ == "__main__":
    prepare(Path(sys.argv[1]))
