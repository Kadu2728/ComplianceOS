"""Payloads for priorities, radar, agent and the executive summary (D30, D32, D33)."""

import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models.domain import ActionEffort, ActionStatus, RiskCategory, RiskSeverity
from app.schemas.domain import OwnerOut


class PriorityItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    action_id: uuid.UUID
    title: str
    status: ActionStatus
    due_date: date | None
    owner: OwnerOut | None = None
    risk_id: uuid.UUID | None
    risk_title: str | None
    risk_severity: RiskSeverity | None
    control_id: uuid.UUID | None
    effort: ActionEffort | None
    points: float
    score_gain: int | None
    reasons: list[str]


class UnplannedRiskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    risk_id: uuid.UUID
    title: str
    severity: RiskSeverity
    owner: OwnerOut | None = None
    has_control: bool
    score_gain: int | None


class PrioritiesOut(BaseModel):
    computed_at: datetime
    current_score: int | None
    profile_complete: bool
    items: list[PriorityItemOut]
    total_pending: int
    unplanned: list[UnplannedRiskOut]
    due_soon_days: int


class RadarItemOut(BaseModel):
    kind: str
    count: int
    tone: str  # danger | warning | info
    title: str
    reason: str
    route: str  # app-owned route hint, e.g. "risks:critical"


class RadarOut(BaseModel):
    computed_at: date
    items: list[RadarItemOut]
    counts: dict[str, int]
    all_clear: bool


class AgentQuestionOut(BaseModel):
    key: str
    question: str


class AgentRefOut(BaseModel):
    kind: str
    id: str
    title: str


class AgentAnswerOut(BaseModel):
    key: str
    question: str
    answer: str
    basis: list[AgentRefOut]
    caveat: str
    computed_at: str


class AgentContextOut(BaseModel):
    """Free-form by design: the shape evolves with the engines. Managers only."""

    model_config = ConfigDict(extra="allow")
    organization_id: str
    today: str
    caveat: str


class ExposureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    risk_id: uuid.UUID
    title: str
    severity: RiskSeverity
    category: RiskCategory
    owner: OwnerOut | None = None
    planned: bool
    coverage: float
    due_date: date | None


class DecisionOut(BaseModel):
    kind: str
    id: uuid.UUID
    title: str
    why: str


class TrendOut(BaseModel):
    from_: int
    to: int
    diff: int
    since: datetime

    model_config = ConfigDict(populate_by_name=True)

    @classmethod
    def build(cls, raw: dict[str, Any]) -> "TrendOut":
        return cls(from_=raw["from"], to=raw["to"], diff=raw["diff"], since=raw["since"])


class ExecutiveSummaryOut(BaseModel):
    computed_at: datetime
    window_days: int
    score: dict[str, Any]
    trend: TrendOut | None
    exposures: list[ExposureOut]
    improved: dict[str, int]
    worsened: dict[str, int]
    decisions: list[DecisionOut]
    next_30_days: list[PriorityItemOut]
    unplanned: list[UnplannedRiskOut]
    controls: dict[str, int]
    documents: dict[str, int]
    caveat: str
