"""One-command local API: embedded PostgreSQL (apps/api/.pgdata) → migrations → content seed
→ uvicorn --reload.

Usage: uv run python scripts/dev_api.py [--port 8000]
Production never uses this; it reads DATABASE_URL from the environment instead.
"""

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

import pgserver
from pgserver.utils import PostmasterInfo, find_suitable_port

ROOT = Path(__file__).resolve().parents[1]
PG_BIN = Path(pgserver.__file__).resolve().parent / "pginstall" / "bin"


def _accepting(port: int | None) -> bool:
    if not port:
        return False
    try:
        with socket.create_connection(("127.0.0.1", int(port)), timeout=2):
            return True
    except OSError:
        return False


def ensure_postgres(pgdata: Path) -> str:
    """Return the connection URI of a running embedded server.

    On Windows the server is started without any console: uvicorn's reloader sends a
    console-wide Ctrl+C on every restart (`basereload.restart`), and `pg_ctl start` would give
    postgres a console of its own through `cmd.exe` (Ctrl+C/close events reach it there too).
    So `postgres.exe` is spawned directly, detached and outside this process tree, logging to
    `.pgdata/log`; it keeps running after this script exits (see README).
    """
    if os.name != "nt":
        return pgserver.get_server(pgdata, cleanup_mode=None).get_uri()
    if not (pgdata / "PG_VERSION").exists():
        pgserver.get_server(pgdata).cleanup()  # initdb + first start, then a clean stop
    info = PostmasterInfo.read_from_pgdata(pgdata)
    if info is not None and info.is_running() and not _accepting(info.port):
        # The pid in postmaster.pid was reused by another process after postgres died (seen
        # after a Ctrl+C reached it): the file lies, the port does not. Start fresh.
        (pgdata / "postmaster.pid").unlink(missing_ok=True)
        info = None
    if info is None or not info.is_running():
        port = find_suitable_port("127.0.0.1")
        # Spawned through a short-lived helper so postgres is not a child of this process: a
        # tree kill of the API (`taskkill /T`, the preview "stop" button) must not take the
        # database down with it.
        helper = (
            "import subprocess, sys; "
            "log = open(sys.argv[1], 'ab'); "
            "subprocess.Popen(sys.argv[2:], stdin=subprocess.DEVNULL, stdout=log, "
            "stderr=subprocess.STDOUT, close_fds=False, "
            "creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)"
        )
        subprocess.run(
            [
                sys.executable,
                "-c",
                helper,
                str(pgdata / "log"),
                str(PG_BIN / "postgres.exe"),
                "-D",
                str(pgdata),
                "-h",
                "127.0.0.1",
                "-p",
                str(port),
            ],
            check=True,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
        )
        deadline = time.monotonic() + 180  # recovery after an unclean stop can take a while
        while time.monotonic() < deadline:
            try:
                info = PostmasterInfo.read_from_pgdata(pgdata)
            except (AssertionError, ValueError, OSError):
                info = None  # postmaster.pid is written progressively while starting
            if info is not None and info.is_running() and info.status == "ready":
                break
            time.sleep(0.5)
        else:
            raise RuntimeError(f"embedded PostgreSQL did not become ready; see {pgdata / 'log'}")
    return pgserver.get_server(pgdata, cleanup_mode=None).get_uri()


def main() -> int:
    port = sys.argv[sys.argv.index("--port") + 1] if "--port" in sys.argv else "8000"
    url = ensure_postgres(ROOT / ".pgdata").replace("postgresql://", "postgresql+psycopg://", 1)
    env = {**os.environ, "DATABASE_URL": url}
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"], cwd=ROOT, env=env, check=True
    )
    subprocess.run([sys.executable, "scripts/seed_content.py"], cwd=ROOT, env=env, check=True)
    print(f"embedded PostgreSQL ready; API on http://127.0.0.1:{port}")
    return subprocess.call(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", port, "--reload"],
        cwd=ROOT,
        env=env,
    )


if __name__ == "__main__":
    raise SystemExit(main())
