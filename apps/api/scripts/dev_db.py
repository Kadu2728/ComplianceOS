"""Start (or reuse) an embedded PostgreSQL for local development and print its URL.

Data lives in apps/api/.pgdata (git-ignored). Usage:
    uv run python scripts/dev_db.py            # prints DATABASE_URL and keeps running
    uv run python scripts/dev_db.py --url      # prints the URL and exits (server stays up)
"""

import sys
import time
from pathlib import Path

import pgserver

DATA_DIR = Path(__file__).resolve().parents[1] / ".pgdata"


def main() -> int:
    server = pgserver.get_server(DATA_DIR)
    url = server.get_uri().replace("postgresql://", "postgresql+psycopg://", 1)
    print(f"DATABASE_URL={url}")
    if "--url" in sys.argv:
        return 0
    print("embedded PostgreSQL running; Ctrl+C to stop")
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
