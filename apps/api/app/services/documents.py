"""Documents use cases (decision D26): list with derived status, create, update, replace file,
delete (refused while cited as evidence), and the counts the overview shows."""

import uuid
from datetime import date, timedelta
from typing import Any

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permissions import has_permission
from app.core.security import utcnow
from app.models.document import (
    Document,
    DocumentCategory,
    DocumentReviewState,
    DocumentStatus,
)
from app.models.domain import Evidence
from app.models.membership import Membership
from app.services import audit
from app.services.domain import DomainRuleViolation, _plain
from app.services.score import today_local

# Most urgent first; used for the default list order and for the overview counts.
STATUS_ORDER = [
    DocumentStatus.VENCIDO,
    DocumentStatus.FALTANTE,
    DocumentStatus.VENCENDO,
    DocumentStatus.EM_REVISAO,
    DocumentStatus.ATUALIZADO,
]


def derive_status(
    review_state: DocumentReviewState, valid_until: date | None, today: date
) -> DocumentStatus:
    """Pure rule shared by the API and the tests. Never stored (CLAUDE.md §13: no hidden state)."""
    if review_state == DocumentReviewState.FALTANTE:
        return DocumentStatus.FALTANTE
    if review_state == DocumentReviewState.EM_REVISAO:
        return DocumentStatus.EM_REVISAO
    if valid_until is None:
        return DocumentStatus.ATUALIZADO
    if valid_until < today:
        return DocumentStatus.VENCIDO
    if valid_until <= today + timedelta(days=get_settings().document_expiring_days):
        return DocumentStatus.VENCENDO
    return DocumentStatus.ATUALIZADO


def status_of(document: Document, today: date | None = None) -> DocumentStatus:
    return derive_status(document.review_state, document.valid_until, today or today_local())


def _status_expr(today: date):  # noqa: ANN202
    """The same rule as `derive_status`, as a SQL expression (filters, ordering, counts)."""
    horizon = today + timedelta(days=get_settings().document_expiring_days)
    return case(
        (Document.review_state == DocumentReviewState.FALTANTE, DocumentStatus.FALTANTE.value),
        (Document.review_state == DocumentReviewState.EM_REVISAO, DocumentStatus.EM_REVISAO.value),
        (Document.valid_until.is_(None), DocumentStatus.ATUALIZADO.value),
        (Document.valid_until < today, DocumentStatus.VENCIDO.value),
        (Document.valid_until <= horizon, DocumentStatus.VENCENDO.value),
        else_=DocumentStatus.ATUALIZADO.value,
    )


def _urgency_expr(today: date):  # noqa: ANN202
    status = _status_expr(today)
    return case(
        *[(status == s.value, i) for i, s in enumerate(STATUS_ORDER)], else_=len(STATUS_ORDER)
    )


def list_query(
    organization_id: uuid.UUID,
    *,
    status: list[DocumentStatus] | None,
    category: list[DocumentCategory] | None,
    owner_membership_id: uuid.UUID | None,
    today: date,
) -> Select:
    base = select(Document).where(Document.organization_id == organization_id)
    if status:
        base = base.where(_status_expr(today).in_([s.value for s in status]))
    if category:
        base = base.where(Document.category.in_(category))
    if owner_membership_id:
        base = base.where(Document.owner_membership_id == owner_membership_id)
    return base.order_by(
        _urgency_expr(today), Document.valid_until.asc().nulls_last(), Document.name
    )


def summary(db: Session, organization_id: uuid.UUID, today: date | None = None) -> dict[str, int]:
    today = today or today_local()
    rows = db.execute(
        select(_status_expr(today).label("status"), func.count())
        .select_from(Document)
        .where(Document.organization_id == organization_id)
        .group_by("status")
    ).all()
    counts = {s.value: 0 for s in DocumentStatus}
    for status, count in rows:
        counts[status] = count
    return {"total": sum(counts.values()), **counts}


def get(db: Session, actor: Membership, document_id: uuid.UUID) -> Document:
    row = db.scalar(
        select(Document).where(
            Document.id == document_id, Document.organization_id == actor.organization_id
        )
    )
    if row is None:
        raise DomainRuleViolation("Not Found", 404)
    return row


def _require_edit(actor: Membership, document: Document) -> None:
    if has_permission(actor.role, "document.update_any"):
        return
    if (
        has_permission(actor.role, "document.update_assigned")
        and document.owner_membership_id == actor.id
    ):
        return
    raise DomainRuleViolation("You do not have permission to edit this document.", 403)


def _validate_owner(db: Session, actor: Membership, owner_membership_id: uuid.UUID | None) -> None:
    if owner_membership_id is None:
        return
    exists = db.scalar(
        select(Membership.id).where(
            Membership.id == owner_membership_id,
            Membership.organization_id == actor.organization_id,
        )
    )
    if exists is None:
        raise DomainRuleViolation("Owner must be a member of this organization.", 422)


def _validate_tags(tags: list[str]) -> list[str]:
    cleaned = []
    for tag in tags:
        t = " ".join(str(tag).split()).strip().lower()
        if not t:
            continue
        if len(t) > 32:
            raise DomainRuleViolation("Tags must have at most 32 characters.", 422)
        if t not in cleaned:
            cleaned.append(t)
    if len(cleaned) > 10:
        raise DomainRuleViolation("At most 10 tags per document.", 422)
    return cleaned


def create(
    db: Session,
    actor: Membership,
    *,
    name: str,
    category: DocumentCategory,
    description: str | None = None,
    version: str = "1.0",
    review_state: DocumentReviewState = DocumentReviewState.VIGENTE,
    owner_membership_id: uuid.UUID | None = None,
    valid_until: date | None = None,
    tags: list[str] | None = None,
    url: str | None = None,
) -> Document:
    if not has_permission(actor.role, "document.create"):
        raise DomainRuleViolation("You do not have permission to add documents.", 403)
    _validate_owner(db, actor, owner_membership_id)
    document = Document(
        organization_id=actor.organization_id,
        name=name,
        description=description,
        category=category,
        version=version,
        review_state=review_state,
        owner_membership_id=owner_membership_id,
        created_by_membership_id=actor.id,
        valid_until=valid_until,
        tags=_validate_tags(tags or []),
        url=url,
    )
    db.add(document)
    db.flush()
    _audit(db, actor, "document.created", document.id, {"name": name, "category": category.value})
    return document


def update(
    db: Session, actor: Membership, document_id: uuid.UUID, changes: dict[str, Any]
) -> Document:
    document = get(db, actor, document_id)
    _require_edit(actor, document)
    if "owner_membership_id" in changes:
        if not has_permission(actor.role, "document.update_any"):
            raise DomainRuleViolation("Only managers can reassign a document.", 403)
        _validate_owner(db, actor, changes["owner_membership_id"])
    if "tags" in changes:
        changes["tags"] = _validate_tags(changes["tags"] or [])
    diff: dict[str, Any] = {}
    for field, value in changes.items():
        before = getattr(document, field)
        if before != value:
            diff[field] = {"from": _plain(before), "to": _plain(value)}
            setattr(document, field, value)
    if diff:
        _audit(db, actor, "document.updated", document.id, diff)
    if "owner_membership_id" in diff:
        db.flush()
        db.expire(document, ["owner"])
    return document


def attach_file(
    db: Session,
    actor: Membership,
    document_id: uuid.UUID,
    *,
    filename: str,
    content_type: str,
) -> tuple[Document, str | None]:
    """Prepare the document for a new file; returns the previous storage key so the route can
    delete it after the commit. `storage_key` and `size_bytes` are set by the route."""
    document = get(db, actor, document_id)
    _require_edit(actor, document)
    previous_key = document.storage_key
    document.filename = filename
    document.content_type = content_type
    document.file_updated_at = utcnow()
    document.storage_key = None
    if document.review_state == DocumentReviewState.FALTANTE:
        document.review_state = DocumentReviewState.VIGENTE  # a file is no longer "missing"
    _audit(db, actor, "document.file_uploaded", document.id, {"filename": filename})
    return document, previous_key


def delete(db: Session, actor: Membership, document_id: uuid.UUID) -> Document:
    document = get(db, actor, document_id)
    if not has_permission(actor.role, "document.delete"):
        raise DomainRuleViolation("You do not have permission to delete documents.", 403)
    cited = db.scalar(
        select(func.count())
        .select_from(Evidence)
        .where(
            Evidence.organization_id == actor.organization_id,
            Evidence.document_id == document.id,
        )
    )
    if cited:
        raise DomainRuleViolation(
            "This document is cited as evidence; remove those references first.", 409
        )
    _audit(db, actor, "document.deleted", document.id, {"name": document.name})
    db.delete(document)
    return document


def _audit(
    db: Session, actor: Membership, action: str, document_id: uuid.UUID, data: dict[str, Any]
) -> None:
    audit.record(
        db,
        action=action,
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="document",
        entity_id=document_id,
        data=data,
    )
