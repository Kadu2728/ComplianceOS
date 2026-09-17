"""Test harness: real PostgreSQL (embedded, per session), migrations applied via Alembic,
tables truncated between tests, captured e-mails, reset rate limiter.

Environment is configured at import time because settings and the engine are cached.
"""

import os
import shutil
import subprocess
import sys
import tempfile
from collections.abc import Iterator
from pathlib import Path

import pgserver
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

_PG_DIR = Path(tempfile.mkdtemp(prefix="cos-test-pg-"))
_STORAGE_DIR = Path(tempfile.mkdtemp(prefix="cos-test-storage-"))
_PG = pgserver.get_server(_PG_DIR)
_DB_URL = _PG.get_uri().replace("postgresql://", "postgresql+psycopg://", 1)

os.environ.update(
    {
        "APP_ENV": "test",
        "DATABASE_URL": _DB_URL,
        "EMAIL_PROVIDER": "capture",
        "JWT_SECRET": "test-secret-not-for-production-0123456789",
        "CORS_ORIGINS": '["http://localhost:3000"]',
        "LOG_LEVEL": "WARNING",
        "STORAGE_LOCAL_ROOT": str(_STORAGE_DIR),
        "EVIDENCE_MAX_BYTES": str(64 * 1024),
    }
)

API_ROOT = Path(__file__).resolve().parents[1]
subprocess.run(
    [sys.executable, "-m", "alembic", "upgrade", "head"],
    cwd=API_ROOT,
    check=True,
    capture_output=True,
    env=os.environ.copy(),
)

from app.content.seed import seed_assessment_templates  # noqa: E402
from app.core.email import CapturingEmailSender, get_email_sender  # noqa: E402
from app.core.llm import set_llm_provider  # noqa: E402
from app.core.rate_limit import limiter  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_engine  # noqa: E402
from app.main import create_app  # noqa: E402

app = create_app()

with Session(get_engine()) as _seed_session:
    seed_assessment_templates(_seed_session)

CONTENT_TABLES = {
    "assessment_templates",
    "assessment_template_versions",
    "assessment_sections",
    "assessment_questions",
}


def pytest_sessionfinish(session, exitstatus):  # noqa: ANN001, ARG001
    get_engine().dispose()
    _PG.cleanup()
    shutil.rmtree(_PG_DIR, ignore_errors=True)
    shutil.rmtree(_STORAGE_DIR, ignore_errors=True)


@pytest.fixture(autouse=True)
def _clean_state() -> Iterator[None]:
    yield
    tables = ", ".join(f'"{t}"' for t in Base.metadata.tables if t not in CONTENT_TABLES)
    with get_engine().begin() as conn:
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    limiter.reset()
    set_llm_provider(None)
    sender = get_email_sender()
    if isinstance(sender, CapturingEmailSender):
        sender.sent.clear()


@pytest.fixture
def emails() -> CapturingEmailSender:
    sender = get_email_sender()
    assert isinstance(sender, CapturingEmailSender)
    return sender


def make_client() -> TestClient:
    # base_url gives cookies a host so path-scoped refresh cookies behave like a browser.
    return TestClient(app, base_url="http://localhost:3000", raise_server_exceptions=False)


@pytest.fixture
def client() -> TestClient:
    return make_client()


def signup(
    client: TestClient, *, email: str, org: str = "Acme Tecnologia", name: str = "Ana"
) -> dict:
    r = client.post(
        "/api/v1/auth/signup",
        json={
            "name": name,
            "email": email,
            "password": "correct-horse-battery",
            "organization_name": org,
        },
    )
    assert r.status_code == 201, r.text
    me = client.get("/api/v1/me").json()
    return {"user": me["user"], "org_id": me["memberships"][0]["organization"]["id"]}


def extract_token(text_body: str) -> str:
    return text_body.split("token=")[1].split()[0]


def invite_and_accept(
    owner: TestClient, org_id: str, emails: CapturingEmailSender, *, email: str, role: str
) -> TestClient:
    """Owner invites `email` with `role`; a fresh client accepts and is returned logged in."""
    r = owner.post(
        f"/api/v1/orgs/{org_id}/members/invitations", json={"email": email, "role": role}
    )
    assert r.status_code == 201, r.text
    token = extract_token(emails.sent[-1].text)
    member = make_client()
    r = member.post(
        "/api/v1/auth/invitations/accept",
        json={"token": token, "name": "Bruno", "password": "another-good-password"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["organization_id"] == org_id  # the app opens the organization just joined
    return member
