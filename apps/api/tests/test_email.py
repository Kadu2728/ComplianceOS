"""SMTP sender (decision D11): wire protocol through a fake `smtplib`, failure → 503 + rollback."""

import smtplib

import pytest

from app.core.config import Settings
from app.core.email import (
    EmailDeliveryError,
    EmailMessage,
    SmtpEmailSender,
    get_email_sender,
    set_email_sender,
)
from tests.conftest import make_client, signup

MSG = EmailMessage(to="ana@acme.com.br", subject="Convite — Compliance OS", text="Olá, Ana.\nLink.")


class FakeSmtp:
    instances: list["FakeSmtp"] = []

    def __init__(self, host, port, timeout=None, context=None) -> None:  # noqa: ANN001
        self.host, self.port, self.timeout, self.context = host, port, timeout, context
        self.calls: list[tuple] = []
        FakeSmtp.instances.append(self)

    def __enter__(self) -> "FakeSmtp":
        return self

    def __exit__(self, *exc) -> None:  # noqa: ANN002
        self.calls.append(("quit",))

    def starttls(self, context=None) -> None:  # noqa: ANN001
        self.calls.append(("starttls", context is not None))

    def login(self, username, password) -> None:  # noqa: ANN001
        self.calls.append(("login", username, password))

    def send_message(self, mime) -> None:  # noqa: ANN001
        self.calls.append(("send", mime["From"], mime["To"], mime["Subject"], mime.get_content()))


@pytest.fixture(autouse=True)
def _fake_smtp(monkeypatch):  # noqa: ANN001, ANN202
    FakeSmtp.instances.clear()
    monkeypatch.setattr(smtplib, "SMTP", FakeSmtp)
    monkeypatch.setattr(smtplib, "SMTP_SSL", FakeSmtp)
    yield


def test_starttls_with_login_sends_plain_text() -> None:
    sender = SmtpEmailSender(
        host="smtp.example.com",
        port=587,
        sender="Compliance OS <no-reply@example.com>",
        username="apikey",
        password="s3cret",
    )
    sender.send(MSG)
    (conn,) = FakeSmtp.instances
    assert (conn.host, conn.port, conn.timeout) == ("smtp.example.com", 587, 10.0)
    assert conn.calls == [
        ("starttls", True),
        ("login", "apikey", "s3cret"),
        (
            "send",
            "Compliance OS <no-reply@example.com>",
            "ana@acme.com.br",
            "Convite — Compliance OS",
            "Olá, Ana.\nLink.\n",
        ),
        ("quit",),
    ]


def test_implicit_tls_without_credentials() -> None:
    SmtpEmailSender(host="relay", port=465, sender="a@b.c", security="ssl").send(MSG)
    (conn,) = FakeSmtp.instances
    assert conn.context is not None  # SMTP_SSL received a TLS context
    assert [c[0] for c in conn.calls] == ["send", "quit"]


def test_connection_failure_is_delivery_error(monkeypatch) -> None:  # noqa: ANN001
    def boom(*a, **k):  # noqa: ANN002, ANN003, ANN202
        raise OSError("connection refused")

    monkeypatch.setattr(smtplib, "SMTP", boom)
    with pytest.raises(EmailDeliveryError):
        SmtpEmailSender(host="down", port=587, sender="a@b.c").send(MSG)


def test_invitation_is_rolled_back_when_email_fails() -> None:
    class Failing:
        def send(self, message: EmailMessage) -> None:
            raise EmailDeliveryError

    previous = get_email_sender()
    owner = make_client()
    org_id = signup(owner, email="owner@acme.com.br")["org_id"]
    set_email_sender(Failing())
    try:
        r = owner.post(
            f"/api/v1/orgs/{org_id}/members/invitations",
            json={"email": "bruno@acme.com.br", "role": "member"},
        )
    finally:
        set_email_sender(previous)
    assert r.status_code == 503 and r.json()["code"] == "email_unavailable"
    assert owner.get(f"/api/v1/orgs/{org_id}/members/invitations").json() == []


def test_settings_guard_smtp_and_production(monkeypatch) -> None:  # noqa: ANN001
    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    with pytest.raises(ValueError, match="SMTP_HOST"):
        Settings(_env_file=None)
    monkeypatch.setenv("SMTP_HOST", "relay")
    monkeypatch.setenv("SMTP_FROM", "no-reply@example.com")
    assert Settings(_env_file=None).email_provider == "smtp"

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET", "x" * 40)
    monkeypatch.setenv("COOKIE_SECURE", "true")
    monkeypatch.setenv("EMAIL_PROVIDER", "console")
    with pytest.raises(ValueError, match="EMAIL_PROVIDER"):
        Settings(_env_file=None)
