"""Document-expiry digest (Phase 10): who gets it, what it says, and that it never repeats within
the interval or crosses organizations."""

from datetime import date, timedelta

import pytest
from sqlalchemy.orm import Session

from app.core.email import EmailDeliveryError, EmailMessage, get_email_sender, set_email_sender
from app.db.session import get_engine
from app.services.reminders import send_document_digests
from tests.conftest import invite_and_accept, make_client, signup

TODAY = date(2026, 9, 13)


def _doc(  # noqa: ANN001
    client, org_id: str, name: str, valid_until: date | None, owner: str | None = None
) -> dict:
    body = {"name": name, "category": "contrato", "version": "1.0", "review_state": "vigente"}
    if valid_until:
        body["valid_until"] = valid_until.isoformat()
    if owner:
        body["owner_membership_id"] = owner
    r = client.post(f"/api/v1/orgs/{org_id}/documents", json=body)
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture
def world(emails):  # noqa: ANN001, ANN201
    """Org A: owner, admin, member (owns the expired contract), viewer. Org B: one document
    expiring, unrelated people."""
    owner = make_client()
    a = signup(owner, email="owner@acme.com.br", org="Acme")["org_id"]
    invite_and_accept(owner, a, emails, email="admin@acme.com.br", role="admin")
    invite_and_accept(owner, a, emails, email="member@acme.com.br", role="member")
    invite_and_accept(owner, a, emails, email="viewer@acme.com.br", role="viewer")
    ids = {m["user"]["email"]: m["id"] for m in owner.get(f"/api/v1/orgs/{a}/members").json()}
    _doc(owner, a, "Contrato vencido", TODAY - timedelta(days=20), ids["member@acme.com.br"])
    _doc(owner, a, "Contrato vencendo", TODAY + timedelta(days=12))
    _doc(owner, a, "Política em dia", TODAY + timedelta(days=200))
    _doc(owner, a, "Sem validade", None)
    other = make_client()
    b = signup(other, email="owner@beta.com.br", org="Beta")["org_id"]
    _doc(other, b, "Termo da Beta", TODAY + timedelta(days=3))
    emails.sent.clear()
    return {"a": a, "b": b, "emails": emails}


def test_digest_goes_to_managers_and_document_owners_only(world) -> None:  # noqa: ANN001
    emails = world["emails"]
    with Session(get_engine()) as db:
        summary = send_document_digests(db, TODAY)
    assert (summary.considered, summary.sent, summary.skipped_recent) == (2, 2, 0)
    by_org = {}
    for m in emails.sent:
        by_org.setdefault(m.subject.split(" — ")[-1], []).append(m)
    acme = by_org["Acme"]
    assert sorted(m.to for m in acme) == [
        "admin@acme.com.br",
        "member@acme.com.br",
        "owner@acme.com.br",
    ]  # the viewer neither manages nor owns a document
    text = acme[0].text
    assert acme[0].subject.startswith("2 documentos requerem revisão")
    assert "Vencidos (1):" in text
    assert "Contrato vencido · Bruno · venceu em 24/08/2026 (há 20 dias)" in text
    assert "Vencendo nos próximos 30 dias (1):" in text
    assert "Contrato vencendo · sem responsável · vence em 25/09/2026 (em 12 dias)" in text
    assert "Política em dia" not in text and "Sem validade" not in text
    assert "/documentos?status=vencido" in text
    assert "Termo da Beta" not in text
    beta = by_org["Beta"]
    assert [m.to for m in beta] == ["owner@beta.com.br"]
    assert "1 documento requer revisão" in beta[0].subject and "Termo da Beta" in beta[0].text


def test_digest_respects_the_interval_and_retries_after_failure(world) -> None:  # noqa: ANN001
    emails = world["emails"]
    with Session(get_engine()) as db:
        assert send_document_digests(db, TODAY).sent == 2
        emails.sent.clear()
        again = send_document_digests(db, TODAY + timedelta(days=6))
        assert (again.sent, again.skipped_recent) == (0, 2) and emails.sent == []
        later = send_document_digests(db, TODAY + timedelta(days=7))
        assert later.sent == 2 and len(emails.sent) == 4

    class Failing:
        def send(self, message: EmailMessage) -> None:
            raise EmailDeliveryError

    previous = get_email_sender()
    set_email_sender(Failing())
    try:
        with Session(get_engine()) as db:
            failed = send_document_digests(db, TODAY + timedelta(days=30))
    finally:
        set_email_sender(previous)
    assert (failed.failed, failed.sent) == (2, 0)
    emails.sent.clear()
    with Session(get_engine()) as db:
        retry = send_document_digests(db, TODAY + timedelta(days=30))
    assert retry.sent == 2  # nothing was recorded for the failed run


def test_nothing_to_report_sends_nothing(emails) -> None:  # noqa: ANN001
    owner = make_client()
    org_id = signup(owner, email="owner@acme.com.br")["org_id"]
    _doc(owner, org_id, "Política", TODAY + timedelta(days=90))
    emails.sent.clear()
    with Session(get_engine()) as db:
        summary = send_document_digests(db, TODAY)
    assert summary.considered == 0 and emails.sent == []
