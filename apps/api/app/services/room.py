"""Compliance Room (decision D36): what an organization chooses to show, and to whom.

Owner-only management (`room.manage`); anonymous reading through time-boxed links. The public
payload is built by one function (`public_payload`) used by both the visitor endpoint and the
owner's preview, so what the owner sees is exactly what a visitor gets. Boundaries and threats:
docs/security/compliance-room-threat-model.md.
"""

import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_token, new_opaque_token, utcnow
from app.models.control import Control, ControlStatus
from app.models.document import Document, DocumentReviewState
from app.models.membership import Membership
from app.models.organization import Organization
from app.models.room import ACTIVE_LINKS_MAX, LINK_MAX_DAYS, ComplianceRoom, RoomLink
from app.services import audit, documents
from app.services import score as score_svc
from app.services.domain import DomainRuleViolation
from app.services.score import today_local

SHAREABLE_CONTROL_STATUS = frozenset({ControlStatus.IMPLEMENTADO, ControlStatus.VERIFICADO})
LIST_MAX = 50

# Shown on every room. Operational wording only (CLAUDE.md §8); legal review gate in D36.
ROOM_CAVEAT = (
    "Indicadores e registros operacionais mantidos pela organização na plataforma Compliance OS. "
    "Não constituem certificação, auditoria independente nem atestado de conformidade legal."
)


def get_or_create(db: Session, organization_id: uuid.UUID) -> ComplianceRoom:
    room = db.scalar(
        select(ComplianceRoom).where(ComplianceRoom.organization_id == organization_id)
    )
    if room is None:
        room = ComplianceRoom(organization_id=organization_id)
        db.add(room)
        db.flush()
    return room


def update(db: Session, actor: Membership, room: ComplianceRoom, **fields: Any) -> ComplianceRoom:
    changes: dict[str, Any] = {}
    for key, value in fields.items():
        current = getattr(room, key)
        if current != value:
            changes[key] = {"from": current, "to": value}
            setattr(room, key, value)
    if changes:
        audit.record(
            db,
            action="room.updated",
            organization_id=actor.organization_id,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.id,
            entity_type="room",
            entity_id=room.id,
            data=changes,
        )
    return room


# --- shared records -----------------------------------------------------------------------------


def set_document_shared(
    db: Session, actor: Membership, document_id: uuid.UUID, shared: bool
) -> Document:
    document = documents.get(db, actor, document_id)
    if shared and document.review_state == DocumentReviewState.FALTANTE:
        raise DomainRuleViolation("Um documento faltante não pode ser compartilhado.", 409)
    if document.shared_in_room != shared:
        document.shared_in_room = shared
        audit.record(
            db,
            action="room.document_shared" if shared else "room.document_unshared",
            organization_id=actor.organization_id,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.id,
            entity_type="document",
            entity_id=document.id,
            data={"title": document.name},
        )
    return document


def set_control_shared(
    db: Session, actor: Membership, control_id: uuid.UUID, shared: bool
) -> Control:
    from app.services import controls  # noqa: PLC0415 — avoids an import cycle at module load

    control = controls.get(db, actor, control_id)
    if shared and control.status not in SHAREABLE_CONTROL_STATUS:
        raise DomainRuleViolation(
            "Só controles implementados ou verificados podem ser compartilhados.", 409
        )
    if control.shared_in_room != shared:
        control.shared_in_room = shared
        audit.record(
            db,
            action="room.control_shared" if shared else "room.control_unshared",
            organization_id=actor.organization_id,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.id,
            entity_type="control",
            entity_id=control.id,
            data={"title": control.title},
        )
    return control


# --- links --------------------------------------------------------------------------------------


def links_of(db: Session, room: ComplianceRoom) -> list[RoomLink]:
    return list(
        db.scalars(
            select(RoomLink)
            .where(RoomLink.organization_id == room.organization_id, RoomLink.room_id == room.id)
            .order_by(RoomLink.created_at.desc())
        )
    )


def create_link(
    db: Session, actor: Membership, room: ComplianceRoom, *, label: str, expires_in_days: int
) -> tuple[RoomLink, str]:
    """Returns the link and the plain token — the only time the token exists in clear."""
    if not 1 <= expires_in_days <= LINK_MAX_DAYS:
        raise DomainRuleViolation(f"A validade deve ficar entre 1 e {LINK_MAX_DAYS} dias.", 422)
    now = utcnow()
    active = sum(1 for link in links_of(db, room) if link.active(now))
    if active >= ACTIVE_LINKS_MAX:
        raise DomainRuleViolation(
            f"Limite de {ACTIVE_LINKS_MAX} links ativos. Revogue um link antes de criar outro.", 409
        )
    token = new_opaque_token()
    link = RoomLink(
        organization_id=room.organization_id,
        room_id=room.id,
        label=label.strip(),
        token_hash=hash_token(token),
        expires_at=now + timedelta(days=expires_in_days),
        created_by_membership_id=actor.id,
    )
    db.add(link)
    db.flush()
    audit.record(
        db,
        action="room.link_created",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="room_link",
        entity_id=link.id,
        data={"label": link.label, "expires_at": link.expires_at.isoformat()},
    )
    return link, token


def revoke_link(db: Session, actor: Membership, link_id: uuid.UUID) -> RoomLink:
    link = db.scalar(
        select(RoomLink).where(
            RoomLink.id == link_id, RoomLink.organization_id == actor.organization_id
        )
    )
    if link is None:
        raise DomainRuleViolation("Not Found", 404)
    if link.revoked_at is None:
        link.revoked_at = utcnow()
        audit.record(
            db,
            action="room.link_revoked",
            organization_id=actor.organization_id,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.id,
            entity_type="room_link",
            entity_id=link.id,
            data={"label": link.label},
        )
    return link


def resolve_link(db: Session, token: str) -> RoomLink | None:
    """The only way in for a visitor: an active link of an enabled room, or nothing. Every
    failure mode looks the same to the caller (the endpoint answers 404)."""
    link = db.scalar(select(RoomLink).where(RoomLink.token_hash == hash_token(token)))
    if link is None or not link.active(utcnow()) or not link.room.enabled:
        return None
    return link


def record_view(db: Session, link: RoomLink) -> None:
    link.view_count += 1
    link.last_viewed_at = utcnow()
    audit.record(
        db,
        action="room.viewed",
        organization_id=link.organization_id,
        entity_type="room_link",
        entity_id=link.id,
        data={"label": link.label},
    )


def record_download(db: Session, link: RoomLink, document: Document) -> None:
    audit.record(
        db,
        action="room.document_downloaded",
        organization_id=link.organization_id,
        entity_type="document",
        entity_id=document.id,
        data={"label": link.label, "title": document.name},
    )


# --- payloads -----------------------------------------------------------------------------------


def shared_documents(db: Session, organization_id: uuid.UUID) -> list[Document]:
    return list(
        db.scalars(
            select(Document)
            .where(
                Document.organization_id == organization_id,
                Document.shared_in_room.is_(True),
                Document.review_state != DocumentReviewState.FALTANTE,
            )
            .order_by(Document.category, Document.name)
            .limit(LIST_MAX)
        )
    )


def shared_document(
    db: Session, organization_id: uuid.UUID, document_id: uuid.UUID
) -> Document | None:
    return db.scalar(
        select(Document).where(
            Document.id == document_id,
            Document.organization_id == organization_id,
            Document.shared_in_room.is_(True),
            Document.review_state != DocumentReviewState.FALTANTE,
        )
    )


def shared_controls(db: Session, organization_id: uuid.UUID) -> list[Control]:
    return list(
        db.scalars(
            select(Control)
            .where(
                Control.organization_id == organization_id,
                Control.shared_in_room.is_(True),
                Control.status.in_(list(SHAREABLE_CONTROL_STATUS)),
            )
            .order_by(Control.category, Control.title)
            .limit(LIST_MAX)
        )
    )


def public_payload(
    db: Session, room: ComplianceRoom, *, link: RoomLink | None, now: datetime | None = None
) -> dict[str, Any]:
    """Exactly what a visitor sees. `link` is None for the owner's preview."""
    now = now or utcnow()
    today = today_local(now)
    organization = db.get(Organization, room.organization_id)
    score = score_svc.current(db, room.organization_id) if room.show_score else None
    score_out = (
        {
            "score": score["score"],
            "band": score["band"],
            "computed_at": score.get("computed_at") or now.isoformat(),
        }
        if score and score.get("available") and not score.get("preliminary")
        else None
    )
    docs = shared_documents(db, room.organization_id)
    ctrls = shared_controls(db, room.organization_id) if room.show_controls else []
    return {
        "organization_name": organization.name if organization else "",
        "title": room.title or (organization.name if organization else ""),
        "intro": room.intro,
        "contact_email": room.contact_email,
        "score": score_out,
        "documents": [
            {
                "id": d.id,
                "name": d.name,
                "category": d.category,
                "version": d.version,
                "status": documents.status_of(d, today),
                "valid_until": d.valid_until,
                "has_file": bool(d.storage_key),
            }
            for d in docs
        ],
        "controls": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "kind": c.kind,
                "category": c.category,
                "status": c.status,
            }
            for c in ctrls
        ],
        "link": {"label": link.label, "expires_at": link.expires_at} if link else None,
        "generated_at": now,
        "caveat": ROOM_CAVEAT,
    }


def manage_payload(db: Session, room: ComplianceRoom) -> dict[str, Any]:
    """The owner's view: settings, what is shared, the links (never the tokens)."""
    now = utcnow()
    shared_doc_count = db.scalar(
        select(func.count())
        .select_from(Document)
        .where(Document.organization_id == room.organization_id, Document.shared_in_room.is_(True))
    )
    shared_ctrl_count = db.scalar(
        select(func.count())
        .select_from(Control)
        .where(Control.organization_id == room.organization_id, Control.shared_in_room.is_(True))
    )
    return {
        "id": room.id,
        "enabled": room.enabled,
        "title": room.title,
        "intro": room.intro,
        "show_score": room.show_score,
        "show_controls": room.show_controls,
        "contact_email": room.contact_email,
        "shared_documents": shared_doc_count or 0,
        "shared_controls": shared_ctrl_count or 0,
        "links": [
            {
                "id": link.id,
                "label": link.label,
                "expires_at": link.expires_at,
                "revoked_at": link.revoked_at,
                "active": link.active(now),
                "view_count": link.view_count,
                "last_viewed_at": link.last_viewed_at,
                "created_at": link.created_at,
            }
            for link in links_of(db, room)
        ],
        "updated_at": room.updated_at,
    }
