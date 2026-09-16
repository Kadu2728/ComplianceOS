"""Risk Radar (decision D30): what needs attention today, computed live from the records.

Each item is a *reason* with a count, a tone and a route hint the app turns into a link. No
persistence in v1 (change detection is future work). Wording is operational — never a legal
conclusion.
"""

import uuid
from datetime import timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.assessment import Assessment, AssessmentStatus
from app.models.control import Control, ControlStatus
from app.models.domain import Action, ActionStatus, Evidence, Risk, RiskSeverity, RiskStatus
from app.models.profile import OrganizationProfile
from app.services import documents as documents_svc
from app.services.controls import coverage_by_risk
from app.services.score import CLOSED, HIGH, today_local

STALE_ASSESSMENT_DAYS = 180
DUE_SOON_DAYS = 7


def _item(kind: str, count: int, tone: str, title: str, reason: str, route: str) -> dict[str, Any]:
    return {
        "kind": kind,
        "count": count,
        "tone": tone,
        "title": title,
        "reason": reason,
        "route": route,
    }


def _n(n: int, one: str, many: str) -> str:
    return f"{n} {one if n == 1 else many}"


def compute(db: Session, organization_id: uuid.UUID) -> dict[str, Any]:
    today = today_local()
    items: list[dict[str, Any]] = []
    open_filter = Risk.status.notin_(list(CLOSED))

    # --- risks ------------------------------------------------------------------------------
    critical = (
        db.scalar(
            select(func.count())
            .select_from(Risk)
            .where(
                Risk.organization_id == organization_id,
                open_filter,
                Risk.severity == RiskSeverity.CRITICO,
            )
        )
        or 0
    )
    if critical:
        items.append(
            _item(
                "risk_critical",
                critical,
                "danger",
                _n(critical, "risco crítico em aberto", "riscos críticos em aberto"),
                "Maior impacto potencial; trate ou planeje primeiro.",
                "risks:critical",
            )
        )
    coverage = coverage_by_risk(db, organization_id)
    open_high = list(
        db.scalars(
            select(Risk).where(
                Risk.organization_id == organization_id, open_filter, Risk.severity.in_(list(HIGH))
            )
        )
    )
    uncontrolled = [r for r in open_high if coverage.get(r.id, 0.0) == 0.0]
    if uncontrolled:
        items.append(
            _item(
                "risk_uncontrolled",
                len(uncontrolled),
                "danger",
                _n(
                    len(uncontrolled),
                    "risco crítico/alto sem controle",
                    "riscos críticos/altos sem controle",
                ),
                "Sem um controle implementado, o risco continua aberto mesmo com ações.",
                "risks:high",
            )
        )
    planned = set(
        db.scalars(
            select(Action.risk_id).where(
                Action.organization_id == organization_id,
                Action.risk_id.is_not(None),
                Action.status != ActionStatus.CONCLUIDA,
            )
        )
    )
    unplanned = [r for r in open_high if r.id not in planned]
    if unplanned:
        items.append(
            _item(
                "risk_unplanned",
                len(unplanned),
                "warning",
                _n(len(unplanned), "risco crítico/alto sem ação", "riscos críticos/altos sem ação"),
                "Use “Planejar” no risco para criar controle e ação em um passo.",
                "risks:high",
            )
        )
    unowned = (
        db.scalar(
            select(func.count())
            .select_from(Risk)
            .where(
                Risk.organization_id == organization_id,
                open_filter,
                Risk.owner_membership_id.is_(None),
            )
        )
        or 0
    )
    if unowned:
        items.append(
            _item(
                "risk_unowned",
                unowned,
                "warning",
                _n(unowned, "risco sem responsável", "riscos sem responsável"),
                "Risco sem dono não avança.",
                "risks:open",
            )
        )
    in_review = (
        db.scalar(
            select(func.count())
            .select_from(Risk)
            .where(Risk.organization_id == organization_id, Risk.status == RiskStatus.EM_REVISAO)
        )
        or 0
    )
    if in_review:
        items.append(
            _item(
                "risk_in_review",
                in_review,
                "info",
                _n(in_review, "risco em revisão", "riscos em revisão"),
                "Feche com evidência ou reabra.",
                "risks:review",
            )
        )

    # --- actions ----------------------------------------------------------------------------
    pending = Action.status != ActionStatus.CONCLUIDA
    overdue = (
        db.scalar(
            select(func.count())
            .select_from(Action)
            .where(Action.organization_id == organization_id, pending, Action.due_date < today)
        )
        or 0
    )
    if overdue:
        items.append(
            _item(
                "action_overdue",
                overdue,
                "danger",
                _n(overdue, "ação atrasada", "ações atrasadas"),
                "Atualize o prazo ou conclua.",
                "actions:overdue",
            )
        )
    due_soon = (
        db.scalar(
            select(func.count())
            .select_from(Action)
            .where(
                Action.organization_id == organization_id,
                pending,
                Action.due_date >= today,
                Action.due_date <= today + timedelta(days=DUE_SOON_DAYS),
            )
        )
        or 0
    )
    if due_soon:
        items.append(
            _item(
                "action_due_soon",
                due_soon,
                "warning",
                _n(
                    due_soon,
                    f"ação vence em até {DUE_SOON_DAYS} dias",
                    f"ações vencem em até {DUE_SOON_DAYS} dias",
                ),
                "Confirme com os responsáveis.",
                "actions:pending",
            )
        )
    blocked = (
        db.scalar(
            select(func.count())
            .select_from(Action)
            .where(
                Action.organization_id == organization_id, Action.status == ActionStatus.BLOQUEADA
            )
        )
        or 0
    )
    if blocked:
        items.append(
            _item(
                "action_blocked",
                blocked,
                "warning",
                _n(blocked, "ação bloqueada", "ações bloqueadas"),
                "Precisa de decisão ou recurso.",
                "actions:blocked",
            )
        )

    # --- controls and evidence --------------------------------------------------------------
    evidenced = set(
        db.scalars(
            select(Evidence.control_id).where(
                Evidence.organization_id == organization_id, Evidence.control_id.is_not(None)
            )
        )
    )
    implemented = list(
        db.scalars(
            select(Control).where(
                Control.organization_id == organization_id,
                Control.status.in_([ControlStatus.IMPLEMENTADO, ControlStatus.VERIFICADO]),
            )
        )
    )
    without_evidence = [c for c in implemented if c.id not in evidenced]
    if without_evidence:
        items.append(
            _item(
                "control_without_evidence",
                len(without_evidence),
                "warning",
                _n(
                    len(without_evidence),
                    "controle implementado sem evidência",
                    "controles implementados sem evidência",
                ),
                "Um controle sem prova não sustenta uma auditoria nem um questionário de cliente.",
                "controls:implementado",
            )
        )
    horizon = today + timedelta(days=get_settings().document_expiring_days)
    ev_expired = (
        db.scalar(
            select(func.count())
            .select_from(Evidence)
            .where(Evidence.organization_id == organization_id, Evidence.valid_until < today)
        )
        or 0
    )
    if ev_expired:
        items.append(
            _item(
                "evidence_expired",
                ev_expired,
                "danger",
                _n(ev_expired, "evidência vencida", "evidências vencidas"),
                "A prova perdeu validade; renove.",
                "evidence:expired",
            )
        )
    ev_expiring = (
        db.scalar(
            select(func.count())
            .select_from(Evidence)
            .where(
                Evidence.organization_id == organization_id,
                Evidence.valid_until >= today,
                Evidence.valid_until <= horizon,
            )
        )
        or 0
    )
    if ev_expiring:
        items.append(
            _item(
                "evidence_expiring",
                ev_expiring,
                "warning",
                _n(ev_expiring, "evidência vencendo", "evidências vencendo"),
                "Renove antes de perder validade.",
                "evidence:expiring",
            )
        )

    # --- documents --------------------------------------------------------------------------
    docs = documents_svc.summary(db, organization_id, today)
    if docs["vencido"]:
        items.append(
            _item(
                "document_expired",
                docs["vencido"],
                "danger",
                _n(docs["vencido"], "documento vencido", "documentos vencidos"),
                "Atualize a validade ou a versão.",
                "documents:vencido",
            )
        )
    if docs["faltante"]:
        items.append(
            _item(
                "document_missing",
                docs["faltante"],
                "danger",
                _n(docs["faltante"], "documento faltante", "documentos faltantes"),
                "Esperado, mas ainda não existe.",
                "documents:faltante",
            )
        )
    if docs["vencendo"]:
        items.append(
            _item(
                "document_expiring",
                docs["vencendo"],
                "warning",
                _n(docs["vencendo"], "documento vencendo", "documentos vencendo"),
                "Renove antes do vencimento.",
                "documents:vencendo",
            )
        )

    # --- context and cycle ------------------------------------------------------------------
    profile = db.scalar(
        select(OrganizationProfile).where(OrganizationProfile.organization_id == organization_id)
    )
    if profile is None or not profile.complete:
        items.append(
            _item(
                "profile_incomplete",
                1,
                "info",
                "Perfil da organização incompleto",
                "Com o perfil, a priorização e o radar consideram o seu contexto.",
                "profile",
            )
        )
    assessment = db.scalar(select(Assessment).where(Assessment.organization_id == organization_id))
    if assessment is None:
        items.append(
            _item(
                "assessment_missing",
                1,
                "info",
                "Diagnóstico não iniciado",
                "O ciclo começa pelo diagnóstico.",
                "assessment",
            )
        )
    elif assessment.status == AssessmentStatus.COMPLETED and assessment.completed_at is not None:
        age = (today - assessment.completed_at.date()).days
        if age > STALE_ASSESSMENT_DAYS:
            items.append(
                _item(
                    "assessment_stale",
                    1,
                    "info",
                    f"Diagnóstico concluído há {age} dias",
                    "Reveja as respostas: o ciclo é contínuo.",
                    "assessment",
                )
            )

    tone_rank = {"danger": 0, "warning": 1, "info": 2}
    items.sort(key=lambda it: (tone_rank[it["tone"]], -it["count"]))
    return {
        "computed_at": today,
        "items": items,
        "counts": {t: sum(1 for it in items if it["tone"] == t) for t in tone_rank},
        "all_clear": not any(it["tone"] == "danger" for it in items),
    }
