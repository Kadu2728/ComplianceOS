"""Core domain: Risk → Action → Evidence (decisions D4, D5, D9).

Tenant safety by construction: every relation to another tenant-owned row is a composite foreign key
`(organization_id, <id>)` against `UNIQUE (organization_id, id)` on the target, so PostgreSQL itself
rejects any cross-organization reference (Diagnostic §7).
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import Timestamps, UUIDPrimaryKey


def _enum(cls: type[enum.StrEnum], name: str) -> Enum:
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e])


class RiskCategory(enum.StrEnum):
    DADOS = "dados"
    ACESSO = "acesso"
    SEGURANCA = "seguranca"
    FORNECEDORES = "fornecedores"
    DOCUMENTACAO = "documentacao"
    TITULARES = "titulares"
    INCIDENTES = "incidentes"
    PESSOAS = "pessoas"


class RiskSeverity(enum.StrEnum):
    CRITICO = "critico"
    ALTO = "alto"
    MEDIO = "medio"
    BAIXO = "baixo"


class RiskStatus(enum.StrEnum):
    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    EM_REVISAO = "em_revisao"
    RESOLVIDO = "resolvido"
    ACEITO = "aceito"


class RiskSource(enum.StrEnum):
    MANUAL = "manual"
    ASSESSMENT = "assessment"


class ActionStatus(enum.StrEnum):
    A_FAZER = "a_fazer"
    EM_ANDAMENTO = "em_andamento"
    EM_REVISAO = "em_revisao"
    CONCLUIDA = "concluida"
    BLOQUEADA = "bloqueada"


class EvidenceKind(enum.StrEnum):
    NOTE = "note"
    LINK = "link"
    FILE = "file"
    DOCUMENT = "document"  # cites one of the organization's documents (Phase 7)


def _org_fk() -> Mapped[uuid.UUID]:
    return mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )


class Risk(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "risks"

    organization_id: Mapped[uuid.UUID] = _org_fk()
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[RiskCategory] = mapped_column(
        _enum(RiskCategory, "risk_category"), nullable=False
    )
    probability: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1..3
    impact: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1..4
    severity: Mapped[RiskSeverity] = mapped_column(
        _enum(RiskSeverity, "risk_severity"), nullable=False
    )
    status: Mapped[RiskStatus] = mapped_column(
        _enum(RiskStatus, "risk_status"), nullable=False, server_default=RiskStatus.ABERTO.value
    )
    source: Mapped[RiskSource] = mapped_column(
        _enum(RiskSource, "risk_source"), nullable=False, server_default=RiskSource.MANUAL.value
    )
    origin_question_code: Mapped[str | None] = mapped_column(String(16))
    # Derivation snapshot (assessment risks): what the rule produced before any manual edit.
    derived_probability: Mapped[int | None] = mapped_column(SmallInteger)
    derived_impact: Mapped[int | None] = mapped_column(SmallInteger)
    answer_uncertain: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    suggested_action: Mapped[str | None] = mapped_column(String(200))
    expected_evidence: Mapped[str | None] = mapped_column(Text)
    treatment: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[date | None] = mapped_column(Date)
    owner_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    owner = relationship(
        "Membership",
        primaryjoin="and_(Risk.owner_membership_id==Membership.id, "
        "Risk.organization_id==Membership.organization_id)",
        foreign_keys=[owner_membership_id],
        viewonly=True,
        lazy="joined",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_risks_org_id"),
        ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_risks_owner_membership",
            ondelete="SET NULL",
        ),
        ForeignKeyConstraint(
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_risks_created_by_membership",
            ondelete="SET NULL",
        ),
        CheckConstraint("probability BETWEEN 1 AND 3", name="probability_range"),
        CheckConstraint("impact BETWEEN 1 AND 4", name="impact_range"),
        Index("ix_risks_org_status_severity", "organization_id", "status", "severity"),
        Index("ix_risks_org_owner", "organization_id", "owner_membership_id"),
    )


class Action(Base, UUIDPrimaryKey, Timestamps):
    """Single execution unit (decision D4). `risk_id` is optional but, when set, must belong to the
    same organization — enforced by the composite foreign key."""

    __tablename__ = "actions"

    organization_id: Mapped[uuid.UUID] = _org_fk()
    risk_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ActionStatus] = mapped_column(
        _enum(ActionStatus, "action_status"),
        nullable=False,
        server_default=ActionStatus.A_FAZER.value,
    )
    owner_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    due_date: Mapped[date | None] = mapped_column(Date)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    owner = relationship(
        "Membership",
        primaryjoin="and_(Action.owner_membership_id==Membership.id, "
        "Action.organization_id==Membership.organization_id)",
        foreign_keys=[owner_membership_id],
        viewonly=True,
        lazy="joined",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_actions_org_id"),
        ForeignKeyConstraint(
            ["organization_id", "risk_id"],
            ["risks.organization_id", "risks.id"],
            name="fk_actions_risk",
            ondelete="SET NULL",
        ),
        ForeignKeyConstraint(
            ["organization_id", "owner_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_actions_owner_membership",
            ondelete="SET NULL",
        ),
        ForeignKeyConstraint(
            ["organization_id", "created_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_actions_created_by_membership",
            ondelete="SET NULL",
        ),
        Index("ix_actions_org_status_due", "organization_id", "status", "due_date"),
        Index("ix_actions_org_risk", "organization_id", "risk_id"),
        Index("ix_actions_org_owner", "organization_id", "owner_membership_id"),
    )


class Evidence(Base, UUIDPrimaryKey):
    """Proof attached to a Risk or an Action (decision D9). Files live in the storage backend under
    a server-generated key; the database never stores file bytes or user-controlled paths."""

    __tablename__ = "evidence"

    organization_id: Mapped[uuid.UUID] = _org_fk()
    risk_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    action_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    document_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    kind: Mapped[EvidenceKind] = mapped_column(_enum(EvidenceKind, "evidence_kind"), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    url: Mapped[str | None] = mapped_column(String(2048))
    filename: Mapped[str | None] = mapped_column(String(255))
    content_type: Mapped[str | None] = mapped_column(String(127))
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    storage_key: Mapped[str | None] = mapped_column(String(512), unique=True)
    added_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    document = relationship(
        "Document",
        primaryjoin="and_(Evidence.document_id==Document.id, "
        "Evidence.organization_id==Document.organization_id)",
        foreign_keys=[document_id],
        viewonly=True,
        lazy="joined",
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_evidence_org_id"),
        ForeignKeyConstraint(
            ["organization_id", "risk_id"],
            ["risks.organization_id", "risks.id"],
            name="fk_evidence_risk",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["organization_id", "action_id"],
            ["actions.organization_id", "actions.id"],
            name="fk_evidence_action",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["organization_id", "added_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_evidence_added_by_membership",
            ondelete="SET NULL",
        ),
        # RESTRICT: a document cited as evidence cannot be deleted (the service answers 409).
        ForeignKeyConstraint(
            ["organization_id", "document_id"],
            ["documents.organization_id", "documents.id"],
            name="fk_evidence_document",
            ondelete="RESTRICT",
        ),
        CheckConstraint(
            "risk_id IS NOT NULL OR action_id IS NOT NULL", name="attached_to_something"
        ),
        Index("ix_evidence_org_risk", "organization_id", "risk_id"),
        Index("ix_evidence_org_action", "organization_id", "action_id"),
        Index("ix_evidence_org_document", "organization_id", "document_id"),
    )
