"""Compliance Room payloads (D36): owner management and the public view."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.control import ControlKind, ControlStatus
from app.models.document import DocumentCategory, DocumentStatus
from app.models.domain import RiskCategory
from app.models.room import LINK_DEFAULT_DAYS, LINK_MAX_DAYS


class RoomUpdate(BaseModel):
    enabled: bool | None = None
    title: str | None = Field(default=None, max_length=120)
    intro: str | None = Field(default=None, max_length=1200)
    show_score: bool | None = None
    show_controls: bool | None = None
    contact_email: EmailStr | None = None


class RoomLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    label: str
    expires_at: datetime
    revoked_at: datetime | None
    active: bool
    view_count: int
    last_viewed_at: datetime | None
    created_at: datetime


class RoomOut(BaseModel):
    id: uuid.UUID
    enabled: bool
    title: str | None
    intro: str | None
    show_score: bool
    show_controls: bool
    contact_email: str | None
    shared_documents: int
    shared_controls: int
    links: list[RoomLinkOut]
    updated_at: datetime


class RoomShareIn(BaseModel):
    shared: bool


class RoomShareOut(BaseModel):
    id: uuid.UUID
    shared: bool


class RoomLinkCreate(BaseModel):
    label: str = Field(min_length=2, max_length=80)
    expires_in_days: int = Field(default=LINK_DEFAULT_DAYS, ge=1, le=LINK_MAX_DAYS)


class RoomLinkCreated(BaseModel):
    """The token appears here once; only its hash is stored."""

    link: RoomLinkOut
    token: str


class RoomBandOut(BaseModel):
    key: str
    label: str


class RoomScoreOut(BaseModel):
    score: int
    band: RoomBandOut
    computed_at: datetime


class RoomDocumentOut(BaseModel):
    id: uuid.UUID
    name: str
    category: DocumentCategory
    version: str
    status: DocumentStatus
    valid_until: date | None
    has_file: bool


class RoomControlOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    kind: ControlKind
    category: RiskCategory
    status: ControlStatus


class RoomLinkRefOut(BaseModel):
    label: str
    expires_at: datetime


class RoomPublicOut(BaseModel):
    """What a visitor (or the owner in preview) sees — nothing else exists on this surface."""

    organization_name: str
    title: str
    intro: str | None
    contact_email: str | None
    score: RoomScoreOut | None
    documents: list[RoomDocumentOut]
    controls: list[RoomControlOut]
    link: RoomLinkRefOut | None
    generated_at: datetime
    caveat: str
