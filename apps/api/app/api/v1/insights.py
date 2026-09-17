"""Priorities, radar, agent foundation and executive summary (decisions D30, D32, D33).

All read-only, all tenant-scoped through `CurrentMembership`; the agent context is limited to
roles with `audit.read` because it bundles the activity feed.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import CurrentMembership, DbSession, require
from app.core.config import get_settings
from app.core.llm import get_llm_provider
from app.core.rate_limit import limiter
from app.models.membership import Membership
from app.schemas.insights import (
    AgentAnswerOut,
    AgentAskIn,
    AgentAskOut,
    AgentContextOut,
    AgentQuestionOut,
    AgentStatusOut,
    ExecutiveSummaryOut,
    PrioritiesOut,
    RadarOut,
    TrendOut,
)
from app.services import agent, agent_llm, executive, priorities, radar
from app.services.domain import DomainRuleViolation

router = APIRouter(tags=["insights"])

UNAVAILABLE = {
    True: "O agente não está habilitado nesta instalação.",
    False: "O agente não conseguiu responder agora. As perguntas prontas continuam disponíveis.",
}


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


@router.get("/orgs/{org_id}/agent/status", response_model=AgentStatusOut)
def agent_status(membership: CurrentMembership) -> AgentStatusOut:
    provider = get_llm_provider()
    return AgentStatusOut(
        free_text=provider.enabled,
        model=provider.model,
        question_max_length=agent_llm.QUESTION_MAX_LENGTH,
    )


@router.post("/orgs/{org_id}/agent/ask", response_model=AgentAskOut)
def agent_ask(payload: AgentAskIn, db: DbSession, membership: CurrentMembership) -> AgentAskOut:
    """One grounded answer (D35). Every role may ask: the bundle is built inside the caller's
    membership, so it never shows more than the pages already do. Rate limits are per user and
    per organization — the model costs money and the limiter is the abuse ceiling."""
    s = get_settings()
    if not limiter.check(
        f"agent-ask:user:{membership.id}", limit=s.llm_user_minute_limit, window_seconds=60
    ) or not limiter.check(
        f"agent-ask:org:{membership.organization_id}",
        limit=s.llm_org_hourly_limit,
        window_seconds=3600,
    ):
        raise HTTPException(
            status_code=429, detail="Muitas perguntas em sequência. Aguarde um pouco."
        )
    focus = (payload.focus.kind, payload.focus.id) if payload.focus else None
    try:
        result = agent_llm.ask(db, membership, question=payload.question, focus=focus)
    except DomainRuleViolation as exc:  # the focused record is not in this organization
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    db.commit()  # the audit row (and a profile created on first read) belong to this request
    if not result["ok"]:
        raise HTTPException(status_code=503, detail=UNAVAILABLE[result["outcome"] == "disabled"])
    return AgentAskOut.model_validate(result)


@router.get("/orgs/{org_id}/agent/context", response_model=AgentContextOut)
def agent_context(
    db: DbSession, membership: Annotated[Membership, Depends(require("audit.read"))]
) -> AgentContextOut:
    payload = agent.context(db, membership)
    db.commit()  # get_or_create may have created the profile row
    return AgentContextOut.model_validate(payload)
