"""Schema and content bootstrap for hosts without a container entrypoint (decision D17).

`migrate_and_seed()` applies migrations and seeds the versioned content exactly like
`docker-entrypoint.sh` does, but from inside the process: serverless hosts (Vercel) start the app
per instance and offer no place to run a command first. A PostgreSQL advisory lock serializes
instances that cold-start at the same time; a second instance simply finds the schema at head.
Opt-in through `MIGRATE_ON_STARTUP=true`; never on in development or tests.
"""

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.content.seed import seed_assessment_templates
from app.db.session import get_engine

logger = logging.getLogger(__name__)

# Arbitrary, stable key for pg_advisory_lock — shared by every instance of this application.
BOOTSTRAP_LOCK_KEY = 727_001
API_ROOT = Path(__file__).resolve().parents[2]


def migrate_and_seed() -> None:
    engine = get_engine()
    # The lock lives on its own connection for the whole bootstrap; Alembic and the seed use
    # their own connections. Session-level advisory locks release when this connection closes.
    with engine.connect() as lock_conn:
        lock_conn.execute(text("SELECT pg_advisory_lock(:key)"), {"key": BOOTSTRAP_LOCK_KEY})
        try:
            logger.info("bootstrap: applying migrations")
            command.upgrade(Config(str(API_ROOT / "alembic.ini")), "head")
            logger.info("bootstrap: seeding versioned content")
            with Session(engine) as db:
                inserted = seed_assessment_templates(db)
                db.commit()
            logger.info("bootstrap: done, seeded %s", ", ".join(inserted) or "nothing new")
        finally:
            lock_conn.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": BOOTSTRAP_LOCK_KEY})
            lock_conn.commit()
