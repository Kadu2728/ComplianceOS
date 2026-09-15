"""Document-expiry digest (Documents v2, Phase 10).

A scheduled job — not a request — calls `send_document_digests` once a day. For every
organization with documents that are expired or expiring (D26 window), it e-mails one digest to
the managers (owner/admin) and to the responsible people of the listed documents, then records
the delivery so the same organization is not written to again for `REMINDER_INTERVAL_DAYS`. The
wording is operational ("requer revisão"), never a legal conclusion (CLAUDE.md §8).
"""

import logging
import uuid
from dataclasses import dataclass, field
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.email import EmailDeliveryError, EmailMessage, get_email_sender
from app.models.document import Document, DocumentStatus
from app.models.membership import Membership, Role
from app.models.organization import Organization
from app.models.reminder import ReminderDelivery
from app.models.user import User
from app.services.documents import _status_expr, list_query
from app.services.score import today_local

logger = logging.getLogger(__name__)

KIND_DOCUMENTS = "document_expiry"
MANAGER_ROLES = (Role.OWNER, Role.ADMIN)


@dataclass
class Digest:
    organization: Organization
    expired: list[Document] = field(default_factory=list)
    expiring: list[Document] = field(default_factory=list)
    recipients: list[User] = field(default_factory=list)

    @property
    def documents(self) -> list[Document]:
        return self.expired + self.expiring


@dataclass
class RunSummary:
    considered: int = 0
    sent: int = 0
    skipped_recent: int = 0
    failed: int = 0


def organizations_with_expiry(db: Session, today: date) -> list[uuid.UUID]:
    """Organizations that currently have at least one expired or expiring document."""
    status = _status_expr(today)
    rows = db.scalars(
        select(Document.organization_id)
        .where(status.in_([DocumentStatus.VENCIDO.value, DocumentStatus.VENCENDO.value]))
        .group_by(Document.organization_id)
        .order_by(Document.organization_id)
    )
    return list(rows)


def last_delivery(db: Session, organization_id: uuid.UUID, kind: str) -> date | None:
    return db.scalar(
        select(func.max(ReminderDelivery.sent_on)).where(
            ReminderDelivery.organization_id == organization_id, ReminderDelivery.kind == kind
        )
    )


def build_digest(db: Session, organization_id: uuid.UUID, today: date) -> Digest | None:
    organization = db.get(Organization, organization_id)
    if organization is None:
        return None
    docs = list(
        db.scalars(
            list_query(
                organization_id,
                status=[DocumentStatus.VENCIDO, DocumentStatus.VENCENDO],
                category=None,
                owner_membership_id=None,
                today=today,
            )
        )
    )
    if not docs:
        return None
    digest = Digest(organization=organization)
    for d in docs:
        (digest.expired if d.valid_until < today else digest.expiring).append(d)  # type: ignore[operator]
    owner_ids = {d.owner_membership_id for d in docs if d.owner_membership_id}
    who = Membership.role.in_(MANAGER_ROLES)
    if owner_ids:
        who = who | Membership.id.in_(owner_ids)
    memberships = db.scalars(
        select(Membership)
        .join(User, User.id == Membership.user_id)
        .where(Membership.organization_id == organization_id, User.is_active.is_(True), who)
        .order_by(Membership.created_at)
    )
    seen: set[uuid.UUID] = set()
    for m in memberships:
        if m.user_id not in seen:
            seen.add(m.user_id)
            digest.recipients.append(m.user)
    return digest


def _days(n: int) -> str:
    return f"{n} {'dia' if n == 1 else 'dias'}"


def _line(d: Document, today: date) -> str:
    """`- Nome · responsável · venceu em dd/mm/aaaa (há 3 dias)`; listed documents have a date."""
    assert d.valid_until is not None
    when = d.valid_until.strftime("%d/%m/%Y")
    who = d.owner.user.name if d.owner else "sem responsável"
    if d.valid_until < today:
        tail = f"venceu em {when} (há {_days((today - d.valid_until).days)})"
    else:
        left = (d.valid_until - today).days
        tail = f"vence em {when} ({'hoje' if left == 0 else 'em ' + _days(left)})"
    return f"- {d.name} · {who} · {tail}"


def render(digest: Digest, today: date) -> EmailMessage:
    s = get_settings()
    org = digest.organization.name
    parts = [f"Olá.\n\nResumo dos documentos de {org} que requerem revisão:"]
    if digest.expired:
        n = len(digest.expired)
        parts.append(f"\nVencidos ({n}):\n" + "\n".join(_line(d, today) for d in digest.expired))
    if digest.expiring:
        n = len(digest.expiring)
        parts.append(
            f"\nVencendo nos próximos {s.document_expiring_days} dias ({n}):\n"
            + "\n".join(_line(d, today) for d in digest.expiring)
        )
    parts.append(
        f"\nAtualize a validade ou envie a nova versão em {s.app_base_url}/documentos?status="
        f"{'vencido' if digest.expired else 'vencendo'}\n\n"
        "Você recebe este resumo por ser responsável por documentos ou gestor da organização. "
        f"Ele é enviado no máximo uma vez a cada {s.reminder_interval_days} dias enquanto houver "
        "documentos nessa situação."
    )
    total = len(digest.documents)
    subject = (
        f"{total} {'documento requer' if total == 1 else 'documentos requerem'} revisão — {org}"
    )
    return EmailMessage(to="", subject=subject, text="\n".join(parts))


def send_document_digests(db: Session, today: date | None = None) -> RunSummary:
    """One digest per organization with something to report, at most every
    `REMINDER_INTERVAL_DAYS`. Commits per organization; a relay failure skips that organization
    (no delivery row, so the next run retries) and the run continues."""
    today = today or today_local()
    interval = timedelta(days=get_settings().reminder_interval_days)
    summary = RunSummary()
    for org_id in organizations_with_expiry(db, today):
        summary.considered += 1
        last = last_delivery(db, org_id, KIND_DOCUMENTS)
        if last is not None and today - last < interval:
            summary.skipped_recent += 1
            continue
        digest = build_digest(db, org_id, today)
        if digest is None or not digest.recipients:
            continue
        message = render(digest, today)
        try:
            for user in digest.recipients:
                get_email_sender().send(
                    EmailMessage(to=user.email, subject=message.subject, text=message.text)
                )
        except EmailDeliveryError:
            summary.failed += 1
            db.rollback()
            logger.warning("document digest not delivered organization=%s", org_id)
            continue
        db.add(
            ReminderDelivery(
                organization_id=org_id,
                kind=KIND_DOCUMENTS,
                sent_on=today,
                recipients=len(digest.recipients),
            )
        )
        db.commit()
        summary.sent += 1
        logger.info(
            "document digest sent organization=%s recipients=%d documents=%d",
            org_id,
            len(digest.recipients),
            len(digest.documents),
        )
    return summary
