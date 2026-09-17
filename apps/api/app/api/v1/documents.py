"""Documents (decision D26): CRUD with derived status, one current file per document (same
validation and private storage as evidence files), authenticated download."""

import uuid
from datetime import date, datetime
from typing import Annotated, Any

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator
from sqlalchemy import func, select

from app.api.deps import CurrentMembership, DbSession
from app.api.v1.evidence import safe_filename, validate_upload
from app.core.storage import get_storage, new_key
from app.models.document import Document, DocumentCategory, DocumentReviewState, DocumentStatus
from app.schemas.domain import OwnerOut
from app.schemas.identity import MessageOut, Page
from app.services import documents as svc
from app.services.domain import DomainRuleViolation
from app.services.score import today_local

router = APIRouter(tags=["documents"])

Name = Annotated[str, Field(min_length=2, max_length=200)]
Version = Annotated[str, Field(min_length=1, max_length=32)]
Tags = Annotated[list[Annotated[str, Field(max_length=32)]], Field(max_length=10)]


class DocumentCreate(BaseModel):
    name: Name
    category: DocumentCategory
    description: Annotated[str, Field(max_length=5000)] | None = None
    version: Version = "1.0"
    review_state: DocumentReviewState = DocumentReviewState.VIGENTE
    owner_membership_id: uuid.UUID | None = None
    valid_until: date | None = None
    tags: Tags = Field(default_factory=list)
    url: HttpUrl | None = None

    @field_validator("name", "version")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()


class DocumentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Name | None = None
    category: DocumentCategory | None = None
    description: Annotated[str, Field(max_length=5000)] | None = None
    version: Version | None = None
    review_state: DocumentReviewState | None = None
    owner_membership_id: uuid.UUID | None = None
    valid_until: date | None = None
    tags: Tags | None = None
    url: HttpUrl | None = None


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: str | None
    category: DocumentCategory
    version: str
    review_state: DocumentReviewState
    status: DocumentStatus  # derived — see services/documents.derive_status
    owner: OwnerOut | None
    valid_until: date | None
    tags: list[str]
    url: str | None
    filename: str | None
    content_type: str | None
    size_bytes: int | None
    file_updated_at: datetime | None
    shared_in_room: bool  # Compliance Room (D36)
    created_at: datetime
    updated_at: datetime


def _out(document: Document, today: date) -> DocumentOut:
    return DocumentOut.model_validate(
        {**_attrs(document), "status": svc.status_of(document, today)}
    )


def _attrs(document: Document) -> dict[str, Any]:
    return {
        "id": document.id,
        "name": document.name,
        "description": document.description,
        "category": document.category,
        "version": document.version,
        "review_state": document.review_state,
        "owner": document.owner,
        "valid_until": document.valid_until,
        "tags": document.tags,
        "url": document.url,
        "filename": document.filename,
        "content_type": document.content_type,
        "size_bytes": document.size_bytes,
        "file_updated_at": document.file_updated_at,
        "shared_in_room": document.shared_in_room,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
    }


def _raise(exc: DomainRuleViolation) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/orgs/{org_id}/documents", response_model=Page[DocumentOut])
def list_documents(
    db: DbSession,
    membership: CurrentMembership,
    status: Annotated[list[DocumentStatus] | None, Query()] = None,
    category: Annotated[list[DocumentCategory] | None, Query()] = None,
    owner_membership_id: uuid.UUID | None = None,
    limit: int = Query(25, ge=1, le=50),
    offset: int = Query(0, ge=0),
) -> Page[DocumentOut]:
    today = today_local()
    query = svc.list_query(
        membership.organization_id,
        status=status,
        category=category,
        owner_membership_id=owner_membership_id,
        today=today,
    )
    total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
    rows = db.scalars(query.limit(limit).offset(offset))
    return Page[DocumentOut](
        items=[_out(d, today) for d in rows], total=total, limit=limit, offset=offset
    )


@router.post("/orgs/{org_id}/documents", response_model=DocumentOut, status_code=201)
def create_document(
    payload: DocumentCreate, db: DbSession, membership: CurrentMembership
) -> DocumentOut:
    data = payload.model_dump()
    data["url"] = str(payload.url) if payload.url else None
    try:
        document = svc.create(db, membership, **data)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    return _out(document, today_local())


@router.get("/orgs/{org_id}/documents/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> DocumentOut:
    try:
        return _out(svc.get(db, membership, document_id), today_local())
    except DomainRuleViolation as exc:
        raise _raise(exc) from None


@router.patch("/orgs/{org_id}/documents/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: uuid.UUID,
    payload: DocumentUpdate,
    db: DbSession,
    membership: CurrentMembership,
) -> DocumentOut:
    changes = payload.model_dump(exclude_unset=True)
    if "url" in changes:
        changes["url"] = str(payload.url) if payload.url else None
    try:
        document = svc.update(db, membership, document_id, changes)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    return _out(document, today_local())


@router.post("/orgs/{org_id}/documents/{document_id}/file", response_model=DocumentOut)
def upload_document_file(
    document_id: uuid.UUID,
    db: DbSession,
    membership: CurrentMembership,
    file: Annotated[UploadFile, File()],
) -> DocumentOut:
    """Replace the document's current file. The previous object is deleted after the commit."""
    content_type, ext = validate_upload(file)
    try:
        document, previous_key = svc.attach_file(
            db,
            membership,
            document_id,
            filename=safe_filename(file.filename),
            content_type=content_type,
        )
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    key = new_key(membership.organization_id, uuid.uuid4(), ext)
    document.size_bytes = get_storage().put(key, file.file)
    document.storage_key = key
    db.commit()
    if previous_key and previous_key != key:
        get_storage().delete(previous_key)
    return _out(document, today_local())


@router.get("/orgs/{org_id}/documents/{document_id}/download")
def download_document(
    document_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> StreamingResponse:
    try:
        document = svc.get(db, membership, document_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    if not document.storage_key:
        raise HTTPException(status_code=404, detail="Not Found")
    headers = {
        "Content-Disposition": f'attachment; filename="{document.filename or "documento"}"',
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
    }
    return StreamingResponse(
        get_storage().open(document.storage_key),
        media_type=document.content_type or "application/octet-stream",
        headers=headers,
    )


@router.delete("/orgs/{org_id}/documents/{document_id}", response_model=MessageOut)
def delete_document(
    document_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> MessageOut:
    try:
        document = svc.delete(db, membership, document_id)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    key = document.storage_key
    db.commit()
    if key:
        get_storage().delete(key)
    return MessageOut(message="Document removed.")
