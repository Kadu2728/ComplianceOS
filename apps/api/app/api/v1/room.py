"""Compliance Room (decision D36).

Two routers on purpose. `router` is the owner's management surface (`room.manage`, session
cookies, CSRF like every other write). `public_router` is the visitor surface: it imports no
session dependency, resolves the organization only through the link token, answers 404 for every
failure mode, is rate-limited per IP and never caches. Threat model:
docs/security/compliance-room-threat-model.md.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse

from app.api.deps import DbSession, require
from app.core.client_ip import client_ip
from app.core.rate_limit import limiter
from app.core.storage import get_storage
from app.models.membership import Membership
from app.schemas.identity import MessageOut
from app.schemas.room import (
    RoomLinkCreate,
    RoomLinkCreated,
    RoomLinkOut,
    RoomOut,
    RoomPublicOut,
    RoomShareIn,
    RoomShareOut,
    RoomUpdate,
)
from app.services import room as svc
from app.services.domain import DomainRuleViolation

router = APIRouter(tags=["room"])
public_router = APIRouter(prefix="/public/rooms", tags=["room-public"])

RoomManager = Annotated[Membership, Depends(require("room.manage"))]

PUBLIC_HEADERS = {
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
}


def _raise(exc: DomainRuleViolation) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


# --- owner management ---------------------------------------------------------------------------


@router.get("/orgs/{org_id}/room", response_model=RoomOut)
def get_room(db: DbSession, membership: RoomManager) -> RoomOut:
    room = svc.get_or_create(db, membership.organization_id)
    payload = svc.manage_payload(db, room)
    db.commit()  # first read creates the row
    return RoomOut.model_validate(payload)


@router.put("/orgs/{org_id}/room", response_model=RoomOut)
def update_room(payload: RoomUpdate, db: DbSession, membership: RoomManager) -> RoomOut:
    room = svc.get_or_create(db, membership.organization_id)
    fields = payload.model_dump(exclude_unset=True)
    if "title" in fields and fields["title"] is not None:
        fields["title"] = fields["title"].strip() or None
    if "intro" in fields and fields["intro"] is not None:
        fields["intro"] = fields["intro"].strip() or None
    svc.update(db, membership, room, **fields)
    db.commit()
    db.refresh(room)
    return RoomOut.model_validate(svc.manage_payload(db, room))


@router.get("/orgs/{org_id}/room/preview", response_model=RoomPublicOut)
def preview_room(db: DbSession, membership: RoomManager) -> RoomPublicOut:
    """Exactly the visitor payload (same function), without a link — for the owner's check."""
    room = svc.get_or_create(db, membership.organization_id)
    payload = svc.public_payload(db, room, link=None)
    db.commit()
    return RoomPublicOut.model_validate(payload)


@router.put("/orgs/{org_id}/room/documents/{document_id}", response_model=RoomShareOut)
def share_document(
    document_id: uuid.UUID, payload: RoomShareIn, db: DbSession, membership: RoomManager
) -> RoomShareOut:
    try:
        document = svc.set_document_shared(db, membership, document_id, payload.shared)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    return RoomShareOut(id=document.id, shared=document.shared_in_room)


@router.put("/orgs/{org_id}/room/controls/{control_id}", response_model=RoomShareOut)
def share_control(
    control_id: uuid.UUID, payload: RoomShareIn, db: DbSession, membership: RoomManager
) -> RoomShareOut:
    try:
        control = svc.set_control_shared(db, membership, control_id, payload.shared)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    return RoomShareOut(id=control.id, shared=control.shared_in_room)


@router.post("/orgs/{org_id}/room/links", response_model=RoomLinkCreated, status_code=201)
def create_link(payload: RoomLinkCreate, db: DbSession, membership: RoomManager) -> RoomLinkCreated:
    room = svc.get_or_create(db, membership.organization_id)
    try:
        link, token = svc.create_link(
            db, membership, room, label=payload.label, expires_in_days=payload.expires_in_days
        )
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    db.refresh(link)
    out = RoomLinkOut.model_validate({**link.__dict__, "active": True})
    return RoomLinkCreated(link=out, token=token)


@router.delete("/orgs/{org_id}/room/links/{link_id}", response_model=MessageOut)
def revoke_link(link_id: uuid.UUID, db: DbSession, membership: RoomManager) -> MessageOut:
    try:
        svc.revoke_link(db, membership, link_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    return MessageOut(message="Link revogado.")


# --- visitor surface ----------------------------------------------------------------------------


def _limit(request: Request, bucket: str, *, limit: int) -> None:
    if not limiter.check(f"room-{bucket}:{client_ip(request)}", limit=limit, window_seconds=60):
        raise HTTPException(status_code=429, detail="Muitas requisições. Tente novamente em breve.")


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Not Found", headers=PUBLIC_HEADERS)


@public_router.get("/{token}", response_model=RoomPublicOut)
def view_room(token: str, request: Request, response: Response, db: DbSession) -> RoomPublicOut:
    _limit(request, "view", limit=60)
    link = svc.resolve_link(db, token)
    if link is None:
        raise _not_found()
    payload = svc.public_payload(db, link.room, link=link)
    svc.record_view(db, link)
    db.commit()
    response.headers.update(PUBLIC_HEADERS)
    return RoomPublicOut.model_validate(payload)


@public_router.get("/{token}/documents/{document_id}/download")
def download_shared_document(
    token: str, document_id: uuid.UUID, request: Request, db: DbSession
) -> StreamingResponse:
    _limit(request, "download", limit=30)
    link = svc.resolve_link(db, token)
    if link is None:
        raise _not_found()
    document = svc.shared_document(db, link.organization_id, document_id)
    if document is None or not document.storage_key:
        raise _not_found()
    svc.record_download(db, link, document)
    db.commit()
    headers = {
        **PUBLIC_HEADERS,
        "Content-Disposition": f'attachment; filename="{document.filename or "documento"}"',
        "X-Content-Type-Options": "nosniff",
    }
    return StreamingResponse(
        get_storage().open(document.storage_key),
        media_type=document.content_type or "application/octet-stream",
        headers=headers,
    )
