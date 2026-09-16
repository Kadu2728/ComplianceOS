import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.control import ControlKind, ControlStatus
from app.models.domain import RiskCategory, RiskSeverity, RiskStatus
from app.schemas.domain import ActionOut, EvidenceOut, LongText, OwnerOut, Title


class DocumentLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


class ControlCreate(BaseModel):
    title: Title
    description: LongText | None = None
    category: RiskCategory
    kind: ControlKind = ControlKind.PREVENTIVO
    status: ControlStatus = ControlStatus.PLANEJADO
    owner_membership_id: uuid.UUID | None = None
    document_id: uuid.UUID | None = None
    review_date: date | None = None
    risk_id: uuid.UUID | None = None  # link on creation (managers)


class ControlUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Title | None = None
    description: LongText | None = None
    category: RiskCategory | None = None
    kind: ControlKind | None = None
    status: ControlStatus | None = None
    owner_membership_id: uuid.UUID | None = None
    document_id: uuid.UUID | None = None
    review_date: date | None = None


class ControlOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    description: str | None
    category: RiskCategory
    kind: ControlKind
    status: ControlStatus
    template_code: str | None
    owner: OwnerOut | None = None
    document: DocumentLinkOut | None = None
    review_date: date | None
    created_at: datetime
    updated_at: datetime


class RiskRefOut(BaseModel):
    """A risk as seen from a control (no description; the risk page has it)."""

    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    severity: RiskSeverity
    status: RiskStatus
    owner: OwnerOut | None = None


class ControlGraphOut(BaseModel):
    """Everything connected to one control: the Control Graph neighbourhood (D27)."""

    control: ControlOut
    risks: list[RiskRefOut]
    actions: list[ActionOut]
    evidence: list[EvidenceOut]
    evidence_count: int


class ControlLinkOut(BaseModel):
    linked: bool
    control_id: uuid.UUID
    risk_id: uuid.UUID


# --- Risk-to-Action engine (D29) --------------------------------------------------------------


class RecommendedControlOut(BaseModel):
    code: str
    title: str
    description: str
    category: RiskCategory
    kind: ControlKind
    exists: bool
    existing_id: uuid.UUID | None = None
    already_linked: bool


class RecommendationOut(BaseModel):
    risk_id: uuid.UUID
    severity: RiskSeverity
    planned: bool
    existing_action: ActionOut | None = None
    linked_controls: list[ControlOut]
    control: RecommendedControlOut | None = None
    action_title: str | None = None
    default_due_date: date
    default_owner_membership_id: uuid.UUID
    expected_evidence: str | None = None
    basis: str


class PlanRequest(BaseModel):
    owner_membership_id: uuid.UUID | None = None
    due_date: date | None = None
    title: Title | None = None


class PlanOut(BaseModel):
    risk_id: uuid.UUID
    control: ControlOut | None = None
    action: ActionOut
