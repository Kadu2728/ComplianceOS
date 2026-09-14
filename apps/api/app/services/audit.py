"""Audit trail writer. Append-only: this module exposes no update/delete."""

import threading
import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.request_id import get_request_id
from app.core.security import utcnow
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.domain import Action, Risk
from app.models.user import User

# Keys that must never land in the audit payload, whatever the caller passes.
_REDACT = {"password", "password_hash", "token", "token_hash", "refresh_token", "access_token"}


def _redact(data: dict[str, Any] | None) -> dict[str, Any] | None:
    if not data:
        return data
    return {k: ("[redacted]" if k in _REDACT else v) for k, v in data.items()}


_stamp_lock = threading.Lock()
_last_stamp: datetime | None = None


def _stamp() -> datetime:
    """Strictly increasing timestamps within this process, so entries written by one request
    (completing an assessment writes dozens) keep the order in which they happened even when the
    clock ties. PostgreSQL's `now()` cannot do this: it is the transaction start."""
    global _last_stamp
    with _stamp_lock:
        now = utcnow()
        if _last_stamp is not None and now <= _last_stamp:
            now = _last_stamp + timedelta(microseconds=1)
        _last_stamp = now
        return now


def record(
    db: Session,
    *,
    action: str,
    organization_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
    actor_membership_id: uuid.UUID | None = None,
    entity_type: str | None = None,
    entity_id: uuid.UUID | None = None,
    data: dict[str, Any] | None = None,
) -> AuditLog:
    """Add an audit row to the current transaction. The caller owns the commit, so the
    audit entry and the change it describes succeed or fail together."""
    entry = AuditLog(
        action=action,
        organization_id=organization_id,
        actor_user_id=actor_user_id,
        actor_membership_id=actor_membership_id,
        entity_type=entity_type,
        entity_id=entity_id,
        data=_redact(data),
        request_id=get_request_id(),
        created_at=_stamp(),
    )
    db.add(entry)
    return entry


def list_entries(
    db: Session, organization_id: uuid.UUID, *, limit: int, offset: int
) -> tuple[list[dict[str, Any]], int]:
    """Newest first, enriched for display: actor name and the current title of the risk/action
    the entry refers to (titles are looked up now, so a renamed record shows its new name)."""
    base = select(AuditLog).where(AuditLog.organization_id == organization_id)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = list(
        db.scalars(
            base.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .limit(limit)
            .offset(offset)
        )
    )
    user_ids = {r.actor_user_id for r in rows if r.actor_user_id}
    names = (
        dict(db.execute(select(User.id, User.name).where(User.id.in_(user_ids))).all())
        if user_ids
        else {}
    )
    titles: dict[tuple[str, uuid.UUID], str] = {}
    for entity, model in (("risk", Risk), ("action", Action), ("document", Document)):
        ids = {r.entity_id for r in rows if r.entity_type == entity and r.entity_id}
        if ids:
            for id_, title in db.execute(
                select(model.id, model.name if entity == "document" else model.title).where(
                    model.organization_id == organization_id, model.id.in_(ids)
                )
            ):
                titles[(entity, id_)] = title
    items = []
    for r in rows:
        items.append(
            {
                "id": r.id,
                "action": r.action,
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "entity_title": titles.get((r.entity_type or "", r.entity_id)),
                "actor_user_id": r.actor_user_id,
                "actor_membership_id": r.actor_membership_id,
                "actor_name": names.get(r.actor_user_id),
                "data": r.data,
                "request_id": r.request_id,
                "created_at": r.created_at,
            }
        )
    return items, total
