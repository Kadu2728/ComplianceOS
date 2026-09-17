"""Documents (CLAUDE.md §4 Document Management, decision D26).

A document is the organization's own artifact — a policy, a procedure, a contract, a record — with a
responsible person, a version label and a validity date. Its display status is derived from
`review_state` and `valid_until` (see `services/documents.derive_status`), never stored, so it can
never go stale. At most one current file (or a link) is kept; a new upload replaces it and the audit
log keeps the history. A document can be cited as evidence on a risk or an action.
"""

import enum
import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamps, UUIDPrimaryKey


def _enum(cls: type[enum.StrEnum], name: str) -> Enum:
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e])


class DocumentCategory(enum.StrEnum):
    POLITICA = "politica"
    PROCEDIMENTO = "procedimento"
    CONTRATO = "contrato"
    REGISTRO = "registro"
    TREINAMENTO = "treinamento"
    CERTIFICACAO = "certificacao"
    OUTRO = "outro"


class DocumentReviewState(enum.StrEnum):
    """What a person asserts about the document; validity is checked against the calendar."""

    VIGENTE = "vigente"
    EM_REVISAO = "em_revisao"
    FALTANTE = "faltante"  # expected but not produced yet (placeholder)


class DocumentStatus(enum.StrEnum):
    """Derived (CLAUDE.md §4: Updated · Expiring · Expired · Missing · In review)."""

    ATUALIZADO = "atualizado"
    VENCENDO = "vencendo"
    VENCIDO = "vencido"
    FALTANTE = "faltante"
    EM_REVISAO = "em_revisao"


class Document(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "documents"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[DocumentCategory] = mapped_column(
        _enum(DocumentCategory, "document_category"), nullable=False
    )
    version: Mapped[str] = mapped_column(String(32), nullable=False, server_default="1.0")
    review_state: Mapped[DocumentReviewState] = mapped_column(
        _enum(DocumentReviewState, "document_review_state"),
        nullable=False,
        server_default=DocumentReviewState.VIGENTE.value,
    )
    owner_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    valid_until: Mapped[date | None] = mapped_column(Date)
    tags: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, server_default="[]")
    url: Mapped[str | None] = mapped_column(String(2048))
    # Current file (storage backend, decision D12); replaced as a whole on each upload.
    filename: Mapped[str | None] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(127))
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    storage_key: Mapped[str | None] = mapped_column(String(512), unique=True)
    file_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Compliance Room (D36): shown to link holders only when the owner flags it explicitly.
    shared_in_room: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    owner = relationship(
        "Membership",
        primaryjoin="and_(Document.owner_membership_id==Membership.id, "
        "Document.organization_id==Membership.organization_id)",
        foreign_keys=[owner_membership_id],
        viewonly=True,
        lazy="joined",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_documents_org_id"),
        ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_documents_owner_membership",
            ondelete="SET NULL (owner_membership_id)",
        ),
        ForeignKeyConstraint(
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_documents_created_by_membership",
            ondelete="SET NULL (created_by_membership_id)",
        ),
        Index("ix_documents_org_category", "organization_id", "category"),
        Index("ix_documents_org_valid_until", "organization_id", "valid_until"),
        Index("ix_documents_org_owner", "organization_id", "owner_membership_id"),
    )
