"""Score (decision D10): live, explainable maturity indicator + snapshot history."""

import uuid
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.deps import CurrentMembership, DbSession
from app.core.permissions import has_permission
from app.services import score as svc

router = APIRouter(tags=["score"])

ItemKind = Literal["risk", "action", "assessment", "evidence"]


class BandOut(BaseModel):
    key: str
    label: str


class ScoreItemOut(BaseModel):
    kind: ItemKind
    id: uuid.UUID | None
    title: str
    detail: str
    points: float  # score points this item costs today


class FactorOut(BaseModel):
    key: str
    label: str
    weight: float
    value: float  # 0–100
    contribution: float  # weight × value
    summary: str
    items: list[ScoreItemOut]
    item_count: int


class RefOut(BaseModel):
    kind: ItemKind
    id: uuid.UUID | None
    title: str


class ReducerOut(BaseModel):
    """An aggregated reason ("3 riscos críticos em aberto") with the points it costs today."""

    reason: str
    title: str
    points: float
    count: int
    refs: list[RefOut]  # up to three linked records


class NextActionOut(BaseModel):
    kind: ItemKind
    id: uuid.UUID | None
    label: str


class DeltaOut(BaseModel):
    previous_score: int
    previous_at: datetime
    diff: int


class ScoreOut(BaseModel):
    """`available=false` is an empty state ("—"), never a score of 0."""

    available: bool
    reason: Literal["no_assessment", "not_applicable"] | None = None
    message: str | None = None
    score: int | None = None
    score_version: str | None = None
    preliminary: bool | None = None
    assessment_completed: bool | None = None
    band: BandOut | None = None
    factors: list[FactorOut] = Field(default_factory=list)
    top_reducers: list[ReducerOut] = Field(default_factory=list)
    next_actions: list[NextActionOut] = Field(default_factory=list)
    computed_at: datetime | None = None
    delta: DeltaOut | None = None


class SnapshotOut(BaseModel):
    id: uuid.UUID
    score: int
    score_version: str
    preliminary: bool
    trigger: str
    computed_at: datetime


class HistoryOut(BaseModel):
    items: list[SnapshotOut]


def _require_read(membership: CurrentMembership) -> None:
    if not has_permission(membership.role, "score.read"):
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/orgs/{org_id}/score", response_model=ScoreOut)
def current(db: DbSession, membership: CurrentMembership) -> ScoreOut:
    _require_read(membership)
    return ScoreOut.model_validate(svc.current(db, membership.organization_id))


@router.get("/orgs/{org_id}/score/history", response_model=HistoryOut)
def history(
    db: DbSession,
    membership: CurrentMembership,
    limit: Annotated[int, Query(ge=1, le=90)] = 30,
) -> HistoryOut:
    _require_read(membership)
    rows = svc.history(db, membership.organization_id, limit)
    return HistoryOut(items=[SnapshotOut.model_validate(r, from_attributes=True) for r in rows])
