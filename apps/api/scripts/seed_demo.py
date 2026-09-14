"""Create or remove the "Acme Tecnologia" demo organization (CLAUDE.md §23).

    uv run python scripts/seed_demo.py                       # development: default password
    uv run python scripts/seed_demo.py --password '...'      # required in production
    uv run python scripts/seed_demo.py --also-owner me@x.com # add an existing account as owner
    uv run python scripts/seed_demo.py --remove              # development only

The demo owner signs in as ana@acme.example. Other demo members have random passwords.
"""

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session  # noqa: E402

from app.content import demo_acme  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.session import get_engine  # noqa: E402

DEV_PASSWORD = "acme-demo-2026"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--password", default=os.environ.get("DEMO_PASSWORD"))
    parser.add_argument("--also-owner", metavar="EMAIL", help="existing account to add as owner")
    parser.add_argument("--remove", action="store_true", help="delete the demo organization")
    args = parser.parse_args()
    settings = get_settings()

    with Session(get_engine()) as db:
        if args.remove:
            if settings.app_env == "production":
                print("refusing to remove data in production", file=sys.stderr)
                return 2
            removed = demo_acme.remove(db)
            db.commit()
            print("removed" if removed else "nothing to remove")
            return 0
        password = args.password
        if not password:
            if settings.app_env == "production":
                print("--password (or DEMO_PASSWORD) is required in production", file=sys.stderr)
                return 2
            password = DEV_PASSWORD
        if len(password) < settings.password_min_length:
            print(f"password must have at least {settings.password_min_length} characters")
            return 2
        try:
            summary = demo_acme.build(db, password=password, also_owner_email=args.also_owner)
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 1
        db.commit()
    for key, value in summary.items():
        print(f"{key}: {value}")
    hint = " (default password)" if password == DEV_PASSWORD else ""
    print(f"sign in as {summary['owner_email']}{hint}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
