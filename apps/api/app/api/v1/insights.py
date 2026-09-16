"""Priorities, radar, agent foundation and executive summary (decisions D30, D32, D33).

All read-only, all tenant-scoped through `CurrentMembership`; the agent context is limited to
roles with `audit.read` because it bundles the activity feed.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import CurrentMembership, DbSession, require
from app.models.membership import Membership
from app.schemas.insights import (
    AgentAnswerOut,
    AgentContextOut,
    AgentQuestionOut,
    ExecutiveSummaryOut,
    PrioritiesOut,
    RadarOut,
    TrendOut,
)
from app.services import agent, executive, priorities, radar

router = APIRouter(tags=["insights"])


@router.get("/orgs/{org_id}/priorities", response_model=PrioritiesOut)
def get_priorities(
    db: DbSession, membership: CurrentMembership, limit: int = Query(10, ge=1, le=50)
) -> PrioritiesOut:
    return PrioritiesOut.model_validate(
        priorities.compute(db, membership.organization_id, limit=limit)
    )


@router.get("/orgs/{org_id}/radar", response_model=RadarOut)
def get_radar(db: DbSession, membership: CurrentMembership) -> RadarOut:
    return RadarOut.model_validate(radar.compute(db, membership.organization_id))


@router.get("/orgs/{org_id}/executive-summary", response_model=ExecutiveSummaryOut)
def get_executive_summary(db: DbSession, membership: CurrentMembership) -> ExecutiveSummaryOut:
    payload = executive.compute(db, membership.organization_id)
    if payload["trend"] is not None:
        payload["trend"] = TrendOut.build(payload["trend"])
    return ExecutiveSummaryOut.model_validate(payload)


@router.get("/orgs/{org_id}/agent/questions", response_model=list[AgentQuestionOut])
def agent_questions(membership: CurrentMembership) -> list[AgentQuestionOut]:
    return [AgentQuestionOut(key=k, question=q) for k, q in agent.QUESTIONS.items()]


@router.get("/orgs/{org_id}/agent/answers/{key}", response_model=AgentAnswerOut)
def agent_answer(key: str, db: DbSession, membership: CurrentMembership) -> AgentAnswerOut:
    payload = agent.answer(db, membership, key)
    if payload is None:
        raise HTTPException(status_code=404, detail="Not Found")
    return AgentAnswerOut.model_validate(payload)


@router.get("/orgs/{org_id}/agent/context", response_model=AgentContextOut)
def agent_context(
    db: DbSession, membership: Annotated[Membership, Depends(require("audit.read"))]
) -> AgentContextOut:
    payload = agent.context(db, membership)
    db.commit()  # get_or_create may have created the profile row
    return AgentContextOut.model_validate(payload)
