"""Diagnóstico use cases: start, answer (autosave), complete (derive risks), reopen.

Derivation rules (docs/product/assessment-v1-scope.md §7): answers `nao` / `parcial` / `nao_sei`
create or update one risk per question (`origin_question_code`); `sim` and `nao_se_aplica` never
close a risk — an existing open derived risk moves to `em_revisao` for a human to close with
evidence.
"""

import uuid
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.core.security import utcnow
from app.models.assessment import (
    AnswerValue,
    Assessment,
    AssessmentMode,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentStatus,
    AssessmentTemplateVersion,
)
from app.models.domain import Risk, RiskSource, RiskStatus
from app.models.membership import Membership
from app.services import audit
from app.services.domain import DomainRuleViolation, derive_severity

ANSWER_LABEL = {
    AnswerValue.SIM: "Sim",
    AnswerValue.PARCIAL: "Parcialmente",
    AnswerValue.NAO: "Não",
    AnswerValue.NAO_SE_APLICA: "Não se aplica",
    AnswerValue.NAO_SEI: "Não sei",
}
PROBABILITY_BY_ANSWER: dict[AnswerValue, int | None] = {
    AnswerValue.NAO: 3,
    AnswerValue.PARCIAL: 2,
    AnswerValue.NAO_SEI: 2,
    AnswerValue.SIM: None,
    AnswerValue.NAO_SE_APLICA: None,
}


@dataclass
class DerivationResult:
    created: int = 0
    updated: int = 0
    sent_to_review: int = 0
    by_severity: dict[str, int] = field(default_factory=dict)


def latest_version(db: Session) -> AssessmentTemplateVersion:
    version = db.scalar(
        select(AssessmentTemplateVersion)
        .order_by(AssessmentTemplateVersion.published_at.desc())
        .limit(1)
    )
    if version is None:
        raise DomainRuleViolation("No assessment template is published.", 503)
    return version


def current(db: Session, organization_id: uuid.UUID) -> Assessment | None:
    return db.scalar(
        select(Assessment)
        .where(Assessment.organization_id == organization_id)
        .order_by(Assessment.created_at.desc())
        .limit(1)
    )


def _require_answer_permission(actor: Membership) -> None:
    if not has_permission(actor.role, "assessment.answer"):
        raise DomainRuleViolation("You do not have permission to answer the assessment.", 403)


def start(db: Session, actor: Membership, mode: AssessmentMode) -> Assessment:
    _require_answer_permission(actor)
    existing = current(db, actor.organization_id)
    if existing is not None:
        if existing.status == AssessmentStatus.COMPLETED:
            raise DomainRuleViolation("Assessment already completed. Reopen it to review answers.")
        return existing
    assessment = Assessment(
        organization_id=actor.organization_id,
        template_version_id=latest_version(db).id,
        mode=mode,
        started_by_membership_id=actor.id,
    )
    db.add(assessment)
    db.flush()
    audit.record(
        db,
        action="assessment.started",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="assessment",
        entity_id=assessment.id,
        data={"mode": mode.value},
    )
    return assessment


def scoped_questions(assessment: Assessment) -> list[AssessmentQuestion]:
    qs = assessment.template_version.questions
    return [q for q in qs if q.short_mode] if assessment.mode == AssessmentMode.SHORT else list(qs)


def responses_by_question(
    db: Session, assessment: Assessment
) -> dict[uuid.UUID, AssessmentResponse]:
    rows = db.scalars(
        select(AssessmentResponse).where(
            AssessmentResponse.organization_id == assessment.organization_id,
            AssessmentResponse.assessment_id == assessment.id,
        )
    )
    return {r.question_id: r for r in rows}


def answer(
    db: Session, actor: Membership, code: str, value: AnswerValue, justification: str | None
) -> AssessmentResponse:
    _require_answer_permission(actor)
    assessment = current(db, actor.organization_id)
    if assessment is None:
        raise DomainRuleViolation("Start the assessment first.", 409)
    if assessment.status == AssessmentStatus.COMPLETED:
        raise DomainRuleViolation("Assessment is completed. Reopen it to change answers.")
    question = next((q for q in assessment.template_version.questions if q.code == code), None)
    if question is None:
        raise DomainRuleViolation("Not Found", 404)
    if value == AnswerValue.NAO_SE_APLICA and not (justification or "").strip():
        raise DomainRuleViolation('"Não se aplica" requires a short justification.', 422)
    existing = db.scalar(
        select(AssessmentResponse).where(
            AssessmentResponse.assessment_id == assessment.id,
            AssessmentResponse.question_id == question.id,
        )
    )
    if existing is None:
        existing = AssessmentResponse(
            organization_id=actor.organization_id,
            assessment_id=assessment.id,
            question_id=question.id,
            value=value,
            justification=justification,
            answered_by_membership_id=actor.id,
        )
        db.add(existing)
    else:
        existing.value = value
        existing.justification = justification
        existing.answered_by_membership_id = actor.id
        existing.answered_at = utcnow()
    db.flush()
    audit.record(
        db,
        action="assessment.answered",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="assessment_response",
        entity_id=existing.id,
        data={"question": code, "value": value.value},
    )
    return existing


def progress(db: Session, assessment: Assessment) -> dict[str, Any]:
    scoped = scoped_questions(assessment)
    answers = responses_by_question(db, assessment)
    per_section: list[dict[str, Any]] = []
    for section in assessment.template_version.sections:
        qs = [q for q in scoped if q.section_number == section.number]
        if not qs:
            continue
        answered = sum(1 for q in qs if q.id in answers)
        per_section.append(
            {"number": section.number, "name": section.name, "total": len(qs), "answered": answered}
        )
    answered_total = sum(1 for q in scoped if q.id in answers)
    return {
        "total": len(scoped),
        "answered": answered_total,
        "uncertain": sum(
            1 for q in scoped if q.id in answers and answers[q.id].value == AnswerValue.NAO_SEI
        ),
        "not_applicable": sum(
            1
            for q in scoped
            if q.id in answers and answers[q.id].value == AnswerValue.NAO_SE_APLICA
        ),
        "sections": per_section,
    }


def complete(db: Session, actor: Membership) -> tuple[Assessment, DerivationResult]:
    _require_answer_permission(actor)
    assessment = current(db, actor.organization_id)
    if assessment is None:
        raise DomainRuleViolation("Start the assessment first.", 409)
    if assessment.status == AssessmentStatus.COMPLETED:
        raise DomainRuleViolation("Assessment is already completed.")
    scoped = scoped_questions(assessment)
    answers = responses_by_question(db, assessment)
    missing = [q.code for q in scoped if q.id not in answers]
    if missing:
        raise DomainRuleViolation(
            f"{len(missing)} question(s) still unanswered: {', '.join(missing[:5])}"
            + ("…" if len(missing) > 5 else ""),
            422,
        )
    result = derive_risks(db, actor, assessment, scoped, answers)
    assessment.status = AssessmentStatus.COMPLETED
    assessment.completed_at = utcnow()
    if assessment.first_completed_at is None:
        assessment.first_completed_at = assessment.completed_at
    assessment.completed_by_membership_id = actor.id
    audit.record(
        db,
        action="assessment.completed",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="assessment",
        entity_id=assessment.id,
        data={
            "mode": assessment.mode.value,
            "created": result.created,
            "updated": result.updated,
            "sent_to_review": result.sent_to_review,
        },
    )
    return assessment, result


def reopen(db: Session, actor: Membership, mode: AssessmentMode | None) -> Assessment:
    _require_answer_permission(actor)
    assessment = current(db, actor.organization_id)
    if assessment is None:
        raise DomainRuleViolation("Start the assessment first.", 409)
    if assessment.status != AssessmentStatus.COMPLETED:
        raise DomainRuleViolation("Assessment is not completed.")
    previous_mode = assessment.mode
    assessment.status = AssessmentStatus.IN_PROGRESS
    assessment.completed_at = None
    if mode is not None:
        assessment.mode = mode
    audit.record(
        db,
        action="assessment.reopened",
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="assessment",
        entity_id=assessment.id,
        data={"from_mode": previous_mode.value, "to_mode": assessment.mode.value},
    )
    return assessment


def derive_risks(
    db: Session,
    actor: Membership,
    assessment: Assessment,
    scoped: list[AssessmentQuestion],
    answers: dict[uuid.UUID, AssessmentResponse],
) -> DerivationResult:
    result = DerivationResult()
    existing_rows = db.scalars(
        select(Risk).where(
            Risk.organization_id == actor.organization_id, Risk.source == RiskSource.ASSESSMENT
        )
    )
    existing = {r.origin_question_code: r for r in existing_rows}
    for q in scoped:
        response = answers[q.id]
        probability = PROBABILITY_BY_ANSWER[response.value]
        risk = existing.get(q.code)
        description = f'"{q.text}" — sua resposta: {ANSWER_LABEL[response.value]}.\n\n{q.help_text}'
        if probability is None:
            if risk is not None and risk.status in (RiskStatus.ABERTO, RiskStatus.EM_ANDAMENTO):
                previous = risk.status
                risk.status = RiskStatus.EM_REVISAO
                risk.answer_uncertain = False
                _audit_risk(
                    db,
                    actor,
                    "risk.status_changed",
                    risk.id,
                    {
                        "from": previous.value,
                        "to": RiskStatus.EM_REVISAO.value,
                        "reason": f"assessment:{q.code}:{response.value.value}",
                    },
                )
                result.sent_to_review += 1
            continue
        severity = derive_severity(probability, q.impact)
        if risk is None:
            risk = Risk(
                organization_id=actor.organization_id,
                title=q.derived_risk_title,
                description=description,
                category=q.derived_risk_category,
                probability=probability,
                impact=q.impact,
                severity=severity,
                source=RiskSource.ASSESSMENT,
                origin_question_code=q.code,
                derived_probability=probability,
                derived_impact=q.impact,
                answer_uncertain=response.value == AnswerValue.NAO_SEI,
                suggested_action=q.remediation_action_title,
                expected_evidence=q.expected_evidence,
                created_by_membership_id=actor.id,
            )
            db.add(risk)
            db.flush()
            existing[q.code] = risk
            _audit_risk(
                db,
                actor,
                "risk.created",
                risk.id,
                {
                    "title": risk.title,
                    "severity": severity.value,
                    "source": "assessment",
                    "question": q.code,
                },
            )
            result.created += 1
        else:
            diff: dict[str, Any] = {}
            manual_edit = (risk.probability, risk.impact) != (
                risk.derived_probability,
                risk.derived_impact,
            )
            if not manual_edit and (risk.probability != probability or risk.severity != severity):
                diff["probability"] = {"from": risk.probability, "to": probability}
                diff["severity"] = {"from": risk.severity.value, "to": severity.value}
                risk.probability = probability
                risk.severity = severity
            risk.derived_probability = probability
            risk.derived_impact = q.impact
            risk.answer_uncertain = response.value == AnswerValue.NAO_SEI
            risk.description = description
            if risk.status in (RiskStatus.RESOLVIDO, RiskStatus.ACEITO, RiskStatus.EM_REVISAO):
                diff["status"] = {"from": risk.status.value, "to": RiskStatus.ABERTO.value}
                risk.status = RiskStatus.ABERTO
                risk.resolved_at = None
            if diff:
                diff["reason"] = f"assessment:{q.code}:{response.value.value}"
                _audit_risk(db, actor, "risk.updated", risk.id, diff)
            result.updated += 1
        result.by_severity[risk.severity.value] = result.by_severity.get(risk.severity.value, 0) + 1
    return result


def summary(db: Session, organization_id: uuid.UUID) -> dict[str, Any]:
    rows = db.execute(
        select(Risk.severity, func.count())
        .where(
            Risk.organization_id == organization_id,
            Risk.source == RiskSource.ASSESSMENT,
            Risk.status.notin_([RiskStatus.RESOLVIDO, RiskStatus.ACEITO]),
        )
        .group_by(Risk.severity)
    ).all()
    uncertain = (
        db.scalar(
            select(func.count())
            .select_from(Risk)
            .where(
                Risk.organization_id == organization_id,
                Risk.source == RiskSource.ASSESSMENT,
                Risk.answer_uncertain.is_(True),
                Risk.status.notin_([RiskStatus.RESOLVIDO, RiskStatus.ACEITO]),
            )
        )
        or 0
    )
    in_review = (
        db.scalar(
            select(func.count())
            .select_from(Risk)
            .where(
                Risk.organization_id == organization_id,
                Risk.source == RiskSource.ASSESSMENT,
                Risk.status == RiskStatus.EM_REVISAO,
            )
        )
        or 0
    )
    return {
        "open_by_severity": {s.value: c for s, c in rows},
        "uncertain": uncertain,
        "in_review": in_review,
    }


def _audit_risk(
    db: Session, actor: Membership, action: str, risk_id: uuid.UUID, data: dict[str, Any]
) -> None:
    audit.record(
        db,
        action=action,
        organization_id=actor.organization_id,
        actor_user_id=actor.user_id,
        actor_membership_id=actor.id,
        entity_type="risk",
        entity_id=risk_id,
        data=data,
    )
