"""Evidence: notes, links and files. Files are validated (type allowlist, size cap, sanitized
name), stored under a server-generated key and served only through an authenticated, tenant-scoped
endpoint — never a public URL (Diagnostic §9 item 3)."""

import re
import uuid
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.api.deps import CurrentMembership, DbSession
from app.core.config import get_settings
from app.core.storage import get_storage, new_key
from app.models.domain import Evidence, EvidenceKind
from app.schemas.domain import EvidenceCreate, EvidenceOut
from app.schemas.identity import MessageOut
from app.services import domain, score

router = APIRouter(tags=["evidence"])

# Content-type allowlist → canonical extension. Anything else is rejected before touching storage.
ALLOWED_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
}
_MAGIC: dict[str, bytes] = {
    "pdf": b"%PDF",
    "png": b"\x89PNG",
    "jpg": b"\xff\xd8\xff",
    "docx": b"PK",
    "xlsx": b"PK",
}


def _raise(exc: domain.DomainRuleViolation) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


def validate_upload(file: UploadFile) -> tuple[str, str]:
    """Allowlisted type, matching magic bytes, non-empty, under the size cap → (content_type, ext).
    Shared by evidence files and document files."""
    settings = get_settings()
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    ext = ALLOWED_TYPES.get(content_type)
    if ext is None:
        raise HTTPException(status_code=415, detail="File type not allowed.")
    head = file.file.read(8)
    file.file.seek(0)
    magic = _MAGIC.get(ext)
    if magic and not head.startswith(magic):
        raise HTTPException(status_code=415, detail="File content does not match its type.")
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size == 0:
        raise HTTPException(status_code=422, detail="Empty file.")
    if size > settings.evidence_max_bytes:
        raise HTTPException(status_code=413, detail="File exceeds the size limit.")
    return content_type, ext


def safe_filename(name: str | None) -> str:
    """Keep only a display name: strip directories, control chars and anything exotic."""
    base = (name or "arquivo").replace("\\", "/").split("/")[-1]
    base = re.sub(r"[^\w.\- ()]", "_", base, flags=re.UNICODE).strip(" .") or "arquivo"
    return base[:120]


@router.get("/orgs/{org_id}/evidence", response_model=list[EvidenceOut])
def list_evidence(
    db: DbSession,
    membership: CurrentMembership,
    risk_id: Annotated[uuid.UUID | None, Query()] = None,
    action_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[EvidenceOut]:
    if risk_id is None and action_id is None:
        raise HTTPException(status_code=422, detail="Filter by risk_id or action_id.")
    base = select(Evidence).where(Evidence.organization_id == membership.organization_id)
    if risk_id is not None:
        base = base.where(Evidence.risk_id == risk_id)
    if action_id is not None:
        base = base.where(Evidence.action_id == action_id)
    rows = db.scalars(base.order_by(Evidence.created_at.desc()))
    return [EvidenceOut.model_validate(e) for e in rows]


@router.post("/orgs/{org_id}/evidence", response_model=EvidenceOut, status_code=201)
def add_note_or_link(
    payload: EvidenceCreate, db: DbSession, membership: CurrentMembership
) -> EvidenceOut:
    if payload.kind == EvidenceKind.FILE:
        raise HTTPException(status_code=422, detail="Use the /evidence/files endpoint for files.")
    if payload.kind == EvidenceKind.NOTE and not payload.note:
        raise HTTPException(status_code=422, detail="A note requires text.")
    if payload.kind == EvidenceKind.LINK and payload.url is None:
        raise HTTPException(status_code=422, detail="A link requires a URL.")
    try:
        row = domain.add_evidence(
            db,
            membership,
            kind=payload.kind,
            risk_id=payload.risk_id,
            action_id=payload.action_id,
            note=payload.note,
            url=str(payload.url) if payload.url else None,
            document_id=payload.document_id,
        )
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "evidence.added")
    db.commit()
    return EvidenceOut.model_validate(row)


@router.post("/orgs/{org_id}/evidence/files", response_model=EvidenceOut, status_code=201)
def upload_file(
    db: DbSession,
    membership: CurrentMembership,
    file: Annotated[UploadFile, File()],
    risk_id: Annotated[uuid.UUID | None, Form()] = None,
    action_id: Annotated[uuid.UUID | None, Form()] = None,
    note: Annotated[str | None, Form(max_length=5000)] = None,
) -> EvidenceOut:
    content_type, ext = validate_upload(file)
    try:
        row = domain.add_evidence(
            db,
            membership,
            kind=EvidenceKind.FILE,
            risk_id=risk_id,
            action_id=action_id,
            note=note,
            filename=safe_filename(file.filename),
            content_type=content_type,
        )
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    key = new_key(membership.organization_id, row.id, ext)
    row.size_bytes = get_storage().put(key, file.file)
    row.storage_key = key
    score.recalculate(db, membership.organization_id, "evidence.added")
    db.commit()
    return EvidenceOut.model_validate(row)


@router.get("/orgs/{org_id}/evidence/{evidence_id}/download")
def download(
    evidence_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> StreamingResponse:
    try:
        row = domain.get_evidence(db, membership, evidence_id)
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    if row.kind != EvidenceKind.FILE or not row.storage_key:
        raise HTTPException(status_code=404, detail="Not Found")
    headers = {
        "Content-Disposition": f'attachment; filename="{row.filename or "arquivo"}"',
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
    }
    return StreamingResponse(
        get_storage().open(row.storage_key),
        media_type=row.content_type or "application/octet-stream",
        headers=headers,
    )


@router.delete("/orgs/{org_id}/evidence/{evidence_id}", response_model=MessageOut)
def delete_evidence(
    evidence_id: uuid.UUID, db: DbSession, membership: CurrentMembership
) -> MessageOut:
    try:
        row = domain.delete_evidence(db, membership, evidence_id)
    except domain.DomainRuleViolation as exc:
        raise _raise(exc) from None
    key = row.storage_key
    score.recalculate(db, membership.organization_id, "evidence.deleted")
    db.commit()
    if key:
        get_storage().delete(key)
    return MessageOut(message="Evidence removed.")
