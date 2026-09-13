"""Seed assessment content into the configured database (idempotent). Release step in production."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session  # noqa: E402

from app.content.seed import seed_assessment_templates  # noqa: E402
from app.db.session import get_engine  # noqa: E402


def main() -> int:
    with Session(get_engine()) as db:
        inserted = seed_assessment_templates(db)
    print("seeded:", ", ".join(inserted) if inserted else "nothing new")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
