import uuid
from datetime import date, datetime
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, model_validator

from app.models.domain import (
    ActionEffort,
    ActionStatus,
    EvidenceKind,
    RiskCategory,
    RiskSeverity,
    RiskSource,
    RiskStatus,
)

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=200)]
LongText = Annotated[str, StringConstraints(max_length=5000)]
Probability = Annotated[int, Field(ge=1, le=3)]
Impact = Annotated[int, Field(ge=1, le=4)]


class OwnerOut(BaseModel):
    """Serialized from a Membership ORM object (membership id + user name); never the e-mail."""

    model_config = ConfigDict(from_attributes=True)
    membership_id: uuid.UUID
    name: str

    @model_validator(mode="before")
    @classmethod
    def _from_membership(cls, value: Any) -> Any:
        if hasattr(value, "user") and hasattr(value, "id"):
            return {"membership_id": value.id, "name": value.user.name}
        return value


# --- risks ---


class RiskCreate(BaseModel):
    title: Title
    description: LongText | None = None
    category: RiskCategory
    probability: Probability
    impact: Impact
    owner_membership_id: uuid.UUID | None = None
    due_date: date | None = None
    treatment: LongText | None = None


class RiskUpdate(BaseModel):
    """Partial update. Severity is never accepted: it is derived from probability × impact."""

    model_config = ConfigDict(extra="forbid")
    title: Title | None = None
    description: LongText | None = None
    category: RiskCategory | None = None
    probability: Probability | None = None
    impact: Impact | None = None
    owner_membership_id: uuid.UUID | None = None
    due_date: date | None = None
    treatment: LongText | None = None


class RiskStatusChange(BaseModel):
    status: RiskStatus


class RiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str | None
    category: RiskCategory
    probability: int
    impact: int
    severity: RiskSeverity
    status: RiskStatus
    source: RiskSource
    origin_question_code: str | None
    answer_uncertain: bool
    suggested_action: str | None
    expected_evidence: str | None
    treatment: str | None
    due_date: date | None
    owner: OwnerOut | None = None
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


# --- actions ---


class ActionCreate(BaseModel):
    title: Title
    description: LongText | None = None
    risk_id: uuid.UUID | None = None
    control_id: uuid.UUID | None = None  # the control this action implements (D27)
    owner_membership_id: uuid.UUID | None = None
    due_date: date | None = None
    effort: ActionEffort | None = None  # prioritization input (D30)


class ActionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Title | None = None
    description: LongText | None = None
    risk_id: uuid.UUID | None = None
    control_id: uuid.UUID | None = None
    owner_membership_id: uuid.UUID | None = None
    due_date: date | None = None
    effort: ActionEffort | None = None


class ActionStatusChange(BaseModel):
    status: ActionStatus


class ActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    risk_id: uuid.UUID | None
    control_id: uuid.UUID | None = None
    title: str
    description: str | None
    status: ActionStatus
    effort: ActionEffort | None = None
    owner: OwnerOut | None = None
    due_date: date | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


# --- evidence ---


class EvidenceCreate(BaseModel):
    """Note or link. Files use the multipart endpoint."""

    kind: EvidenceKind = Field(description="note, link or document")
    risk_id: uuid.UUID | None = None
    action_id: uuid.UUID | None = None
    control_id: uuid.UUID | None = None  # the control this proves (D34)
    document_id: uuid.UUID | None = None  # required for kind=document
    note: LongText | None = None
    url: HttpUrl | None = None
    valid_until: date | None = None  # until when the proof is current (D34)


class DocumentRefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    risk_id: uuid.UUID | None
    action_id: uuid.UUID | None
    control_id: uuid.UUID | None = None
    document_id: uuid.UUID | None = None
    document: DocumentRefOut | None = None
    kind: EvidenceKind
    valid_until: date | None = None
    validity: str = "vigente"  # vigente | vencendo | vencida — derived (D34)
    note: str | None
    url: str | None
    filename: str | None
    content_type: str | None
    size_bytes: int | None
    added_by_membership_id: uuid.UUID | None
    created_at: datetime
