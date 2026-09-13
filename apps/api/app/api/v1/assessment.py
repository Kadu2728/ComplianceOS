"""Diagnóstico routes. Regulatory basis is NOT exposed to clients until the template version has a
`last_verified` date (docs/regulatory/sources-v1.md) — questions only carry `needs_verification`."""

from datetime import date, datetime
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, StringConstraints
from sqlalchemy import select

from app.api.deps import CurrentMembership, DbSession
from app.models.assessment import AnswerValue, AssessmentMode, AssessmentStatus
from app.models.domain import Risk, RiskSource, RiskStatus
from app.schemas.domain import RiskOut
from app.services import assessment as svc
from app.services import score
from app.services.domain import DomainRuleViolation

router = APIRouter(prefix="/orgs/{org_id}/assessment", tags=["assessment"])


class TemplateOut(BaseModel):
    code: str
    version: int
    title: str
    last_verified: date | None
    verified: bool


class SectionProgressOut(BaseModel):
    number: int
    name: str
    total: int
    answered: int


class ProgressOut(BaseModel):
    total: int
    answered: int
    uncertain: int
    not_applicable: int
    sections: list[SectionProgressOut]


class AssessmentStateOut(BaseModel):
    status: str  # none | in_progress | completed
    mode: AssessmentMode | None = None
    template: TemplateOut | None = None
    progress: ProgressOut | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    short_mode_size: int
    full_mode_size: int


class StartRequest(BaseModel):
    mode: AssessmentMode


class ReopenRequest(BaseModel):
    mode: AssessmentMode | None = None


class AnswerRequest(BaseModel):
    value: AnswerValue
    justification: (
        Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] | None
    ) = None


class AnswerOut(BaseModel):
    value: AnswerValue
    justification: str | None
    answered_at: datetime


class QuestionOut(BaseModel):
    code: str
    order: int
    text: str
    help_text: str
    needs_verification: bool
    short_mode: bool
    expected_evidence: str | None
    answer: AnswerOut | None = None


class SectionOut(BaseModel):
    number: int
    name: str
    questions: list[QuestionOut]


class QuestionsOut(BaseModel):
    mode: AssessmentMode
    sections: list[SectionOut]


class CompleteOut(BaseModel):
    created: int
    updated: int
    sent_to_review: int
    by_severity: dict[str, int]


class ResultOut(BaseModel):
    open_by_severity: dict[str, int]  # not resolved/accepted — includes risks in review
    uncertain: int
    in_review: int  # answered "sim" after the risk existed; a human closes it with evidence
    risks: list[RiskOut]


def _raise(exc: DomainRuleViolation) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


def _template_out(version) -> TemplateOut:  # noqa: ANN001
    return TemplateOut(
        code=version.template.code,
        version=version.version,
        title=version.title,
        last_verified=version.last_verified,
        verified=version.last_verified is not None,
    )


@router.get("", response_model=AssessmentStateOut)
def state(db: DbSession, membership: CurrentMembership) -> AssessmentStateOut:
    try:
        version = svc.latest_version(db)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    short_size = sum(1 for q in version.questions if q.short_mode)
    full_size = len(version.questions)
    a = svc.current(db, membership.organization_id)
    if a is None:
        return AssessmentStateOut(
            status="none",
            template=_template_out(version),
            short_mode_size=short_size,
            full_mode_size=full_size,
        )
    return AssessmentStateOut(
        status=a.status.value,
        mode=a.mode,
        template=_template_out(a.template_version),
        progress=ProgressOut(**svc.progress(db, a)),
        started_at=a.created_at,
        completed_at=a.completed_at,
        short_mode_size=short_size,
        full_mode_size=full_size,
    )


@router.post("/start", response_model=AssessmentStateOut, status_code=201)
def start(
    payload: StartRequest, db: DbSession, membership: CurrentMembership
) -> AssessmentStateOut:
    try:
        svc.start(db, membership, payload.mode)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    return state(db, membership)


@router.get("/questions", response_model=QuestionsOut)
def questions(db: DbSession, membership: CurrentMembership) -> QuestionsOut:
    a = svc.current(db, membership.organization_id)
    if a is None:
        raise HTTPException(status_code=404, detail="Not Found")
    answers = svc.responses_by_question(db, a)
    scoped = svc.scoped_questions(a)
    sections: list[SectionOut] = []
    for section in a.template_version.sections:
        qs = [q for q in scoped if q.section_number == section.number]
        if not qs:
            continue
        sections.append(
            SectionOut(
                number=section.number,
                name=section.name,
                questions=[
                    QuestionOut(
                        code=q.code,
                        order=q.order,
                        text=q.text,
                        help_text=q.help_text,
                        needs_verification=q.needs_verification,
                        short_mode=q.short_mode,
                        expected_evidence=q.expected_evidence,
                        answer=(
                            AnswerOut(
                                value=answers[q.id].value,
                                justification=answers[q.id].justification,
                                answered_at=answers[q.id].answered_at,
                            )
                            if q.id in answers
                            else None
                        ),
                    )
                    for q in qs
                ],
            )
        )
    return QuestionsOut(mode=a.mode, sections=sections)


@router.put("/answers/{code}", response_model=AnswerOut)
def put_answer(
    code: str, payload: AnswerRequest, db: DbSession, membership: CurrentMembership
) -> AnswerOut:
    try:
        row = svc.answer(db, membership, code.upper(), payload.value, payload.justification)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    db.commit()
    return AnswerOut(value=row.value, justification=row.justification, answered_at=row.answered_at)


@router.post("/complete", response_model=CompleteOut)
def complete(db: DbSession, membership: CurrentMembership) -> CompleteOut:
    try:
        _, result = svc.complete(db, membership)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "assessment.completed")
    db.commit()
    return CompleteOut(
        created=result.created,
        updated=result.updated,
        sent_to_review=result.sent_to_review,
        by_severity=result.by_severity,
    )


@router.post("/reopen", response_model=AssessmentStateOut)
def reopen(
    payload: ReopenRequest, db: DbSession, membership: CurrentMembership
) -> AssessmentStateOut:
    try:
        svc.reopen(db, membership, payload.mode)
    except DomainRuleViolation as exc:
        raise _raise(exc) from None
    score.recalculate(db, membership.organization_id, "assessment.reopened")
    db.commit()
    return state(db, membership)


@router.get("/result", response_model=ResultOut)
def result(db: DbSession, membership: CurrentMembership) -> ResultOut:
    a = svc.current(db, membership.organization_id)
    if a is None or a.status != AssessmentStatus.COMPLETED:
        raise HTTPException(status_code=404, detail="Not Found")
    data: dict[str, Any] = svc.summary(db, membership.organization_id)
    rows = db.scalars(
        select(Risk)
        .where(
            Risk.organization_id == membership.organization_id,
            Risk.source == RiskSource.ASSESSMENT,
            Risk.status.notin_([RiskStatus.RESOLVIDO, RiskStatus.ACEITO]),
        )
        .order_by(Risk.severity, Risk.created_at)
        .limit(50)
    )
    return ResultOut(
        open_by_severity=data["open_by_severity"],
        uncertain=data["uncertain"],
        in_review=data["in_review"],
        risks=[RiskOut.model_validate(r) for r in rows],
    )
