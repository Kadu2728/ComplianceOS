"""Compliance Agent foundation (decision D32): context bundle + deterministic answers.

No language model is involved. The bundle is the tenant-scoped, minimized context a future LLM
layer would receive (no e-mails, no file contents, no secrets); the answers are computed from the
same records the pages show, each with the record refs it rests on and an operational caveat.
Guardrails for the LLM layer live in docs/ai.md; the provider decision is D35.
"""

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import has_permission
from app.models.control import Control
from app.models.document import DocumentStatus
from app.models.domain import Action, ActionStatus, Evidence, Risk, RiskSeverity
from app.models.membership import Membership
from app.services import audit, controls, documents, priorities, profile, radar
from app.services import score as score_svc
from app.services.score import CLOSED, HIGH, today_local
from app.services.security_copy import CAVEAT

QUESTIONS: dict[str, str] = {
    "biggest_risks": "Quais são meus maiores riscos?",
    "this_week": "O que devo corrigir esta semana?",
    "score_change": "Por que meu score mudou?",
    "missing_documents": "Quais documentos estão faltando ou vencidos?",
    "risks_without_action": "Quais riscos estão sem ação?",
    "risks_without_control": "Quais riscos estão sem controle?",
    "overdue_actions": "Quais ações estão atrasadas?",
    "expiring_evidence": "Quais evidências estão vencendo ou vencidas?",
}


def _ref(kind: str, id_: uuid.UUID, title: str) -> dict[str, Any]:
    return {"kind": kind, "id": str(id_), "title": title}


def _plain_priority(it: dict[str, Any]) -> dict[str, Any]:
    """Priority rows carry ORM objects (owner); the bundle must be plain, serializable data."""
    out = {k: v for k, v in it.items() if k != "owner"}
    out["owner"] = it["owner"].user.name if it.get("owner") is not None else None
    for k in ("action_id", "risk_id", "control_id"):
        if out.get(k) is not None:
            out[k] = str(out[k])
    for k in ("status", "risk_severity", "severity", "effort"):
        if out.get(k) is not None and hasattr(out[k], "value"):
            out[k] = out[k].value
    if out.get("due_date") is not None:
        out["due_date"] = out["due_date"].isoformat()
    return out


OPEN_ACTIONS = frozenset(set(ActionStatus) - {ActionStatus.CONCLUIDA})
RECORDS_LIMIT = 15


def owner_name(row: Any) -> str | None:
    return row.owner.user.name if getattr(row, "owner", None) is not None else None


def _records(db: Session, org_id: uuid.UUID) -> dict[str, list[dict[str, Any]]]:
    """The records a question is most likely about, with ids so an answer can cite them: open
    crítico/alto risks, documents needing attention, controls and their proof. Capped lists —
    the bundle is a summary, never a table dump (docs/ai.md §2)."""
    coverage = controls.coverage_by_risk(db, org_id)
    with_action = set(
        db.scalars(
            select(Action.risk_id)
            .where(
                Action.organization_id == org_id,
                Action.risk_id.is_not(None),
                Action.status.in_(list(OPEN_ACTIONS)),
            )
            .distinct()
        )
    )
    risks = [
        {
            "id": str(r.id),
            "title": r.title,
            "category": r.category.value,
            "severity": r.severity.value,
            "status": r.status.value,
            "owner": owner_name(r),
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "control_coverage": coverage.get(r.id, 0.0),
            "has_open_action": r.id in with_action,
        }
        for r in db.scalars(
            select(Risk)
            .where(
                Risk.organization_id == org_id,
                Risk.status.notin_(list(CLOSED)),
                Risk.severity.in_(list(HIGH)),
            )
            .order_by(Risk.severity, Risk.due_date.nulls_last(), Risk.title)
            .limit(RECORDS_LIMIT)
        )
    ]
    today = today_local()
    docs = [
        {
            "id": str(d.id),
            "name": d.name,
            "category": d.category.value,
            "status": documents.status_of(d, today).value,
            "valid_until": d.valid_until.isoformat() if d.valid_until else None,
            "owner": owner_name(d),
        }
        for d in db.scalars(
            documents.list_query(
                org_id,
                status=[DocumentStatus.FALTANTE, DocumentStatus.VENCIDO, DocumentStatus.VENCENDO],
                category=None,
                owner_membership_id=None,
                today=today,
            ).limit(RECORDS_LIMIT)
        )
    ]
    proof = dict(
        db.execute(
            select(Evidence.control_id, func.count())
            .where(Evidence.organization_id == org_id, Evidence.control_id.is_not(None))
            .group_by(Evidence.control_id)
        ).all()
    )
    ctrls = [
        {
            "id": str(c.id),
            "title": c.title,
            "status": c.status.value,
            "kind": c.kind.value,
            "owner": owner_name(c),
            "evidence_count": proof.get(c.id, 0),
        }
        for c in db.scalars(
            select(Control)
            .where(Control.organization_id == org_id)
            .order_by(Control.status, Control.title)
            .limit(RECORDS_LIMIT)
        )
    ]
    return {"risks": risks, "documents": docs, "controls": ctrls}


def context(db: Session, actor: Membership) -> dict[str, Any]:
    """Structured, minimized context for one organization (managers only for the audit part)."""
    org_id = actor.organization_id
    prof = profile.get_or_create(db, org_id)
    score_payload = score_svc.current(db, org_id)
    prio = priorities.compute(db, org_id, limit=5)
    return {
        "organization_id": str(org_id),
        "today": today_local().isoformat(),
        "profile": {
            "segment": prof.segment.value if prof.segment else None,
            "headcount_band": prof.headcount_band.value if prof.headcount_band else None,
            "customer_type": prof.customer_type.value if prof.customer_type else None,
            "data_categories": list(prof.data_categories),
            "sells_to_enterprise": prof.sells_to_enterprise,
            "international_transfers": (
                prof.international_transfers.value if prof.international_transfers else None
            ),
            "systems": list(prof.systems),
            "processes": list(prof.processes),
            "complete": prof.complete,
        },
        "score": {
            k: score_payload.get(k)
            for k in ("available", "score", "band", "preliminary", "delta", "top_reducers")
        },
        "radar": radar.compute(db, org_id)["items"],
        "priorities": [_plain_priority(it) for it in prio["items"]],
        "unplanned": [_plain_priority(it) for it in prio["unplanned"]],
        "controls": controls.summary(db, org_id),
        "documents": documents.summary(db, org_id),
        "records": _records(db, org_id),
        "recent_activity": (
            [
                {"action": e["action"], "actor": e["actor_name"], "at": e["created_at"]}
                for e in audit.list_entries(db, org_id, limit=10, offset=0)[0]
            ]
            if has_permission(actor.role, "audit.read")
            else None
        ),
        "caveat": CAVEAT,
    }


def answer(db: Session, actor: Membership, key: str) -> dict[str, Any] | None:
    if key not in QUESTIONS:
        return None
    org_id = actor.organization_id
    handler = _HANDLERS[key]
    text, refs = handler(db, org_id)
    return {
        "key": key,
        "question": QUESTIONS[key],
        "answer": text,
        "basis": refs,
        "caveat": CAVEAT,
        "computed_at": today_local().isoformat(),
    }


# --- handlers: (db, org_id) -> (answer text, refs) ---------------------------------------------


def _biggest_risks(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    rows = list(
        db.scalars(
            select(Risk)
            .where(Risk.organization_id == org_id, Risk.status.notin_(list(CLOSED)))
            .order_by(Risk.severity, Risk.due_date.nulls_last(), Risk.title)
            .limit(5)
        )
    )
    if not rows:
        return "Nenhum risco em aberto no momento.", []
    crit = sum(1 for r in rows if r.severity == RiskSeverity.CRITICO)
    lead = (
        f"{crit} crítico(s) entre os {len(rows)} riscos abertos mais graves: "
        if crit
        else (f"Os {len(rows)} riscos abertos mais graves: ")
    )

    def describe(r: Risk) -> str:
        unowned = ", sem responsável" if r.owner_membership_id is None else ""
        return f"{r.title} ({r.severity.value}{unowned})"

    return lead + "; ".join(describe(r) for r in rows) + ".", [
        _ref("risk", r.id, r.title) for r in rows
    ]


def _this_week(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    prio = priorities.compute(db, org_id, limit=5)
    parts = []
    refs = []
    for it in prio["items"][:3]:
        gain = f" (+{it['score_gain']} no score)" if it["score_gain"] else ""
        parts.append(f"{it['title']} — {', '.join(it['reasons'])}{gain}")
        refs.append(_ref("action", it["action_id"], it["title"]))
    for r in prio["unplanned"][:2]:
        parts.append(f"planejar “{r['title']}” ({r['severity'].value}, sem ação)")
        refs.append(_ref("risk", r["risk_id"], r["title"]))
    if not parts:
        return "Nada pendente com prioridade: mantenha as evidências em dia.", []
    return "Pela ordem de prioridade: " + "; ".join(parts) + ".", refs


def _score_change(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    payload = score_svc.current(db, org_id)
    if not payload.get("available"):
        return "Ainda não há score: conclua o diagnóstico.", []
    delta = payload.get("delta")
    reducers = payload.get("top_reducers", [])
    refs = [r for g in reducers for r in g["refs"][:1]]
    what = "; ".join(f"{g['title']} ({g['points']} pts)" for g in reducers)
    if delta is None:
        return (
            f"Score {payload['score']} ({payload['band']['label']}); ainda não há registro "
            f"anterior para comparar. O que mais reduz hoje: {what}.",
            refs,
        )
    direction = "subiu" if delta["diff"] > 0 else "caiu" if delta["diff"] < 0 else "não mudou"
    return (
        f"O score {direction} de {delta['previous_score']} para {payload['score']} "
        f"({delta['diff']:+d}). O que mais reduz hoje: {what}.",
        refs,
    )


def _missing_documents(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    from app.models.document import DocumentStatus  # noqa: PLC0415

    rows = list(
        db.scalars(
            documents.list_query(
                org_id,
                status=[DocumentStatus.FALTANTE, DocumentStatus.VENCIDO],
                category=None,
                owner_membership_id=None,
                today=today_local(),
            ).limit(10)
        )
    )
    if not rows:
        return "Nenhum documento faltante ou vencido.", []
    return "Requerem atenção: " + "; ".join(
        f"{d.name} ({documents.status_of(d).value})" for d in rows
    ) + ".", [_ref("document", d.id, d.name) for d in rows]


def _risks_without_action(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    unplanned = priorities.compute(db, org_id, limit=10)["unplanned"]
    if not unplanned:
        return "Todos os riscos críticos e altos em aberto têm ação.", []
    return "Sem ação planejada: " + "; ".join(
        f"{r['title']} ({r['severity'].value})" for r in unplanned
    ) + ".", [_ref("risk", r["risk_id"], r["title"]) for r in unplanned]


def _risks_without_control(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    coverage = controls.coverage_by_risk(db, org_id)
    rows = [
        r
        for r in db.scalars(
            select(Risk)
            .where(
                Risk.organization_id == org_id,
                Risk.status.notin_(list(CLOSED)),
                Risk.severity.in_(list(HIGH)),
            )
            .order_by(Risk.severity, Risk.title)
        )
        if coverage.get(r.id, 0.0) < 1.0
    ]
    if not rows:
        return "Todos os riscos críticos e altos em aberto têm controle implementado.", []
    return "Sem controle implementado: " + "; ".join(
        f"{r.title}" + (" (controle parcial)" if coverage.get(r.id) else "") for r in rows
    ) + ".", [_ref("risk", r.id, r.title) for r in rows]


def _overdue_actions(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    items = [
        it
        for it in priorities.compute(db, org_id, limit=50)["items"]
        if it["due_date"] is not None and it["due_date"] < today_local()
    ]
    if not items:
        return "Nenhuma ação atrasada.", []
    return "Atrasadas: " + "; ".join(
        f"{it['title']} ({it['owner'].user.name if it['owner'] else 'sem responsável'}, "
        f"{it['due_date'].strftime('%d/%m/%Y')})"
        for it in items
    ) + ".", [_ref("action", it["action_id"], it["title"]) for it in items]


def _expiring_evidence(db: Session, org_id: uuid.UUID) -> tuple[str, list[dict[str, Any]]]:
    from datetime import timedelta  # noqa: PLC0415

    from app.core.config import get_settings  # noqa: PLC0415

    today = today_local()
    horizon = today + timedelta(days=get_settings().document_expiring_days)
    rows = list(
        db.scalars(
            select(Evidence)
            .where(Evidence.organization_id == org_id, Evidence.valid_until <= horizon)
            .order_by(Evidence.valid_until)
            .limit(10)
        )
    )
    if not rows:
        return "Nenhuma evidência vencida ou vencendo.", []
    controls_by_id = {
        c.id: c for c in db.scalars(select(Control).where(Control.organization_id == org_id))
    }
    parts = []
    for e in rows:
        state = "vencida" if e.valid_until < today else "vence em breve"
        where = (
            controls_by_id[e.control_id].title
            if e.control_id in controls_by_id
            else (e.note or e.filename or e.url or "evidência")[:60]
        )
        parts.append(f"{where} ({state}, {e.valid_until.strftime('%d/%m/%Y')})")
    return "Evidências a renovar: " + "; ".join(parts) + ".", [
        _ref("evidence", e.id, (e.filename or e.note or e.url or "evidência")[:60]) for e in rows
    ]


_HANDLERS = {
    "biggest_risks": _biggest_risks,
    "this_week": _this_week,
    "score_change": _score_change,
    "missing_documents": _missing_documents,
    "risks_without_action": _risks_without_action,
    "risks_without_control": _risks_without_control,
    "overdue_actions": _overdue_actions,
    "expiring_evidence": _expiring_evidence,
}

__all__ = ["OPEN_ACTIONS", "QUESTIONS", "answer", "context", "owner_name"]
