"""Send the document-expiry digest (Phase 10). Schedule daily; it writes at most one e-mail per
organization every REMINDER_INTERVAL_DAYS and only while something is expired or expiring.

    uv run python scripts/send_reminders.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.core.logging import configure_logging  # noqa: E402
from app.db.session import get_engine  # noqa: E402
from app.services.reminders import send_document_digests  # noqa: E402


def main() -> int:
    configure_logging(get_settings().log_level)
    with Session(get_engine()) as db:
        summary = send_document_digests(db)
    print(
        f"organizations considered: {summary.considered}, digests sent: {summary.sent}, "
        f"skipped (recent digest): {summary.skipped_recent}, failed: {summary.failed}"
    )
    return 1 if summary.failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
