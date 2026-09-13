"""Assessment (Diagnóstico).

Template content is global and immutable once published (a new version is a new row set);
an organization's Assessment references one template version and owns its responses.
Regulatory fields on questions stay NULL until verified (docs/regulatory/sources-v1.md).
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.domain import RiskCategory
from app.models.mixins import Timestamps, UUIDPrimaryKey


def _enum(cls: type[enum.StrEnum], name: str, **kw) -> Enum:  # noqa: ANN003
    return Enum(cls, name=name, values_callable=lambda e: [m.value for m in e], **kw)


class AnswerValue(enum.StrEnum):
    SIM = "sim"
    PARCIAL = "parcial"
    NAO = "nao"
    NAO_SE_APLICA = "nao_se_aplica"
    NAO_SEI = "nao_sei"


class AssessmentMode(enum.StrEnum):
    SHORT = "short"
    FULL = "full"


class AssessmentStatus(enum.StrEnum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# --- global content -------------------------------------------------------------------------


class AssessmentTemplate(Base, UUIDPrimaryKey):
    __tablename__ = "assessment_templates"

    code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)


class AssessmentTemplateVersion(Base, UUIDPrimaryKey):
    __tablename__ = "assessment_template_versions"

    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assessment_templates.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    changelog: Mapped[str | None] = mapped_column(Text)
    content_source: Mapped[str | None] = mapped_column(String(255))
    last_verified: Mapped[date | None] = mapped_column(Date)
    published_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    template = relationship("AssessmentTemplate", lazy="joined")
    sections = relationship(
        "AssessmentSection", order_by="AssessmentSection.number", lazy="selectin"
    )
    questions = relationship(
        "AssessmentQuestion",
        order_by="(AssessmentQuestion.section_number, AssessmentQuestion.order)",
        lazy="selectin",
    )

    __table_args__ = (
        UniqueConstraint("template_id", "version", name="uq_template_versions_version"),
    )


class AssessmentSection(Base, UUIDPrimaryKey):
    __tablename__ = "assessment_sections"

    template_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assessment_template_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    __table_args__ = (
        UniqueConstraint("template_version_id", "number", name="uq_sections_version_number"),
    )


class AssessmentQuestion(Base, UUIDPrimaryKey):
    __tablename__ = "assessment_questions"

    template_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assessment_template_versions.id", ondelete="CASCADE"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(16), nullable=False)
    section_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    order: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    help_text: Mapped[str] = mapped_column(Text, nullable=False)
    needs_verification: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    answer_type: Mapped[str] = mapped_column(String(32), nullable=False, server_default="scale_v1")
    short_mode: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    impact: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    weight: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default="1")
    expected_evidence: Mapped[str | None] = mapped_column(Text)
    derived_risk_title: Mapped[str] = mapped_column(String(200), nullable=False)
    derived_risk_category: Mapped[RiskCategory] = mapped_column(
        _enum(RiskCategory, "risk_category", create_type=False), nullable=False
    )
    remediation_action_title: Mapped[str] = mapped_column(String(200), nullable=False)
    regulatory_basis: Mapped[str | None] = mapped_column(Text)
    classification: Mapped[str | None] = mapped_column(String(32))

    __table_args__ = (
        UniqueConstraint("template_version_id", "code", name="uq_questions_version_code"),
        Index("ix_questions_version_section", "template_version_id", "section_number", "order"),
    )


# --- organization-owned ------------------------------------------------------------------------


class Assessment(Base, UUIDPrimaryKey, Timestamps):
    __tablename__ = "assessments"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    template_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_template_versions.id"), nullable=False
    )
    mode: Mapped[AssessmentMode] = mapped_column(
        _enum(AssessmentMode, "assessment_mode"), nullable=False
    )
    status: Mapped[AssessmentStatus] = mapped_column(
        _enum(AssessmentStatus, "assessment_status"),
        nullable=False,
        server_default=AssessmentStatus.IN_PROGRESS.value,
    )
    started_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    completed_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Kept across reopen: the score exists from the first completion onwards (D10).
    first_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    template_version = relationship("AssessmentTemplateVersion", lazy="joined")

    __table_args__ = (
        UniqueConstraint("organization_id", "id", name="uq_assessments_org_id"),
        # One assessment per organization per template version (re-answering updates it).
        UniqueConstraint(
            "organization_id", "template_version_id", name="uq_assessments_org_version"
        ),
        ForeignKeyConstraint(
            ["organization_id", "started_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_assessments_started_by",
            ondelete="SET NULL",
        ),
        ForeignKeyConstraint(
            ["organization_id", "completed_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_assessments_completed_by",
            ondelete="SET NULL",
        ),
    )


class AssessmentResponse(Base, UUIDPrimaryKey):
    __tablename__ = "assessment_responses"

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    assessment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assessment_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    value: Mapped[AnswerValue] = mapped_column(_enum(AnswerValue, "answer_value"), nullable=False)
    justification: Mapped[str | None] = mapped_column(Text)
    answered_by_membership_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    question = relationship("AssessmentQuestion", lazy="joined")

    __table_args__ = (
        UniqueConstraint("assessment_id", "question_id", name="uq_responses_assessment_question"),
        ForeignKeyConstraint(
            ["organization_id", "assessment_id"],
            ["assessments.organization_id", "assessments.id"],
            name="fk_responses_assessment",
            ondelete="CASCADE",
        ),
        ForeignKeyConstraint(
            ["organization_id", "answered_by_membership_id"],
            ["memberships.organization_id", "memberships.id"],
            name="fk_responses_answered_by",
            ondelete="SET NULL",
        ),
        Index("ix_responses_org_assessment", "organization_id", "assessment_id"),
    )
