"""Score engine v2 (decisions D10 and D31, docs/product/score-v1-proposal.md + D31).

A maturity indicator computed from the organization's own records — never a legal claim. The
pipeline is split so it stays testable and deterministic: `gather()` reads records, `compute()` is a
pure function of those inputs (same records → same score, same explanation), `recalculate()`
persists a snapshot for trends. Every number in the payload traces to a record the UI can link to.

Factors (weights sum to 1): A Diagnóstico 0.10 · B Riscos 0.40 · K Controles 0.20 ·
C Execução 0.15 · D Evidências 0.15. v1 snapshots (four factors) keep their version and are
never recomputed; `simulate()` answers "what would I gain by doing X" with the same function.
"""

import math
import uuid
from dataclasses import dataclass, replace
from datetime import date, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import utcnow
from app.models.assessment import AnswerValue
from app.models.domain import Action, ActionStatus, Evidence, Risk, RiskSeverity, RiskStatus
from app.models.score import ScoreSnapshot
from app.services.assessment import current as current_assessment
from app.services.assessment import responses_by_question, scoped_questions
from app.services.domain import derive_severity

SCORE_VERSION = "v2"
WEIGHTS = {"A": 0.10, "B": 0.40, "K": 0.20, "C": 0.15, "D": 0.15}
LABELS = {
    "A": "Diagnóstico",
    "B": "Riscos",
    "K": "Controles",
    "C": "Execução",
    "D": "Evidências",
}
# Same P×I scale as the assessment derivation: a Crítico is worth two Altos, four Médios.
SEVERITY_WEIGHT = {
    RiskSeverity.CRITICO: 12,
    RiskSeverity.ALTO: 6,
    RiskSeverity.MEDIO: 3,
    RiskSeverity.BAIXO: 1,
}
HIGH = frozenset({RiskSeverity.CRITICO, RiskSeverity.ALTO})
CLOSED = frozenset({RiskStatus.RESOLVIDO, RiskStatus.ACEITO})
# Upper bound (exclusive) → band. Labels are maturity language, never compliance claims
# (docs/regulatory/sources-v1.md §G); pending human legal review (F5).
BANDS = (
    (40, "inicial", "Inicial"),
    (60, "estruturando", "Em estruturação"),
    (80, "organizado", "Organizado"),
    (101, "maduro", "Maduro"),
)
ITEMS_PER_FACTOR = 10
DELTA_WINDOW_DAYS = 30
NO_EVIDENCE_HINT = "Nenhuma evidência registrada ainda"


@dataclass(frozen=True)
class RiskInput:
    id: uuid.UUID
    title: str
    severity: RiskSeverity
    status: RiskStatus
    planned: bool  # at least one action with an owner and a due date
    evidence: bool
    coverage: float = 0.0  # best control credit: 1 implementado/verificado · 0.5 parcial · 0 (D31)


@dataclass(frozen=True)
class ActionInput:
    id: uuid.UUID
    title: str
    status: ActionStatus
    due_date: date | None
    evidence: bool


@dataclass(frozen=True)
class ScoreInputs:
    preliminary: bool  # short mode
    assessment_completed: bool
    answered: int
    total: int
    uncertain: int
    max_penalty: int  # Σ w(severity(P=3, I_q)) over answered questions that apply
    risks: tuple[RiskInput, ...]
    actions: tuple[ActionInput, ...]
    today: date


def _tz() -> ZoneInfo:
    return ZoneInfo(get_settings().default_timezone)


def now_local() -> datetime:
    return datetime.now(tz=_tz())


def today_local(now: datetime | None = None) -> date:
    return (now or utcnow()).astimezone(_tz()).date()


def band_for(score: int) -> dict[str, str]:
    for upper, key, label in BANDS:
        if score < upper:
            return {"key": key, "label": label}
    return {"key": BANDS[-1][1], "label": BANDS[-1][2]}


def _round_half_up(value: float) -> int:
    return int(math.floor(value + 0.5))


def _item(
    kind: str, id_: uuid.UUID | None, title: str, detail: str, points: float
) -> dict[str, Any]:
    return {
        "kind": kind,
        "id": str(id_) if id_ else None,
        "title": title,
        "detail": detail,
        "points": round(points, 2),
        "_raw": points,  # exact value for group sums; stripped from the payload by _factor()
    }


def _factor(key: str, value: float, summary: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    value = round(value, 1)
    return {
        "key": key,
        "label": LABELS[key],
        "weight": WEIGHTS[key],
        "value": value,
        "contribution": round(WEIGHTS[key] * value, 1),
        "summary": summary,
        "items": [{k: v for k, v in it.items() if k != "_raw"} for it in items[:ITEMS_PER_FACTOR]],
        "item_count": len(items),
    }


def _plural(n: int, one: str, many: str) -> str:
    return f"{n} {one if n == 1 else many}"


def compute(i: ScoreInputs) -> dict[str, Any]:
    """Pure: the explanation payload for these inputs (no clock, no database)."""
    if i.max_penalty <= 0:
        return {
            "available": False,
            "reason": "not_applicable",
            "message": (
                "Todas as perguntas respondidas foram marcadas como não aplicáveis; "
                "não há base para calcular o score."
            ),
        }
    open_risks = sorted(
        (r for r in i.risks if r.status not in CLOSED),
        key=lambda r: (-SEVERITY_WEIGHT[r.severity], r.title),
    )
    open_high = [r for r in open_risks if r.severity in HIGH]
    closed_high = [r for r in i.risks if r.status == RiskStatus.RESOLVIDO and r.severity in HIGH]
    done = [a for a in i.actions if a.status == ActionStatus.CONCLUIDA]
    pending = [a for a in i.actions if a.status != ActionStatus.CONCLUIDA]
    overdue = sorted(
        (a for a in pending if a.due_date is not None and a.due_date < i.today),
        key=lambda a: (a.due_date, a.title),  # type: ignore[return-value]
    )

    # A — Diagnóstico: completeness of the current scope.
    a_value = 100.0 * i.answered / i.total if i.total else 0.0
    a_items: list[dict[str, Any]] = []
    unanswered = i.total - i.answered
    if unanswered > 0:
        a_items.append(
            _item(
                "assessment",
                None,
                _plural(unanswered, "pergunta sem resposta", "perguntas sem resposta"),
                "Conclua o diagnóstico para consolidar o score",
                WEIGHTS["A"] * 100 * unanswered / i.total,
            )
        )
    a_summary = f"{i.answered} de {i.total} perguntas respondidas"
    if i.uncertain:
        a_summary += f" · {_plural(i.uncertain, 'resposta', 'respostas')} “não sei”"
        a_items.append(
            _item(
                "assessment",
                None,
                _plural(i.uncertain, "resposta “não sei”", "respostas “não sei”"),
                "Confirme para reduzir a incerteza (não altera o score)",
                0,
            )
        )

    # B — Riscos: open-risk weight vs. the worst case for what was answered.
    penalty = sum(SEVERITY_WEIGHT[r.severity] for r in open_risks)
    b_value = max(0.0, 100.0 * (1 - penalty / i.max_penalty))
    b_items = [
        _item(
            "risk",
            r.id,
            r.title,
            f"{_severity_label(r.severity)} em aberto · peso {SEVERITY_WEIGHT[r.severity]}",
            WEIGHTS["B"] * 100 * SEVERITY_WEIGHT[r.severity] / i.max_penalty,
        )
        for r in open_risks
    ]
    b_summary = (
        f"{_plural(len(open_risks), 'risco aberto', 'riscos abertos')} · peso {penalty} de "
        f"{i.max_penalty}"
        if open_risks
        else "Nenhum risco aberto"
    )

    # C — Execução: critical/high risks with a planned action, and actions on time.
    c_items: list[dict[str, Any]] = []
    unplanned = [r for r in open_high if not r.planned]
    if not open_high and not i.actions:
        c_value = 100.0
        c_summary = "Nada a executar no momento"
    elif open_high and not i.actions:
        c_value = 0.0
        c_summary = _plural(
            len(unplanned),
            "risco crítico/alto sem ação planejada",
            "riscos críticos/altos sem ação planejada",
        )
        c_items += [
            _item("risk", r.id, r.title, "Sem ação planejada", WEIGHTS["C"] * 100 / len(open_high))
            for r in unplanned
        ]
    else:
        coverage = (
            100.0 * (len(open_high) - len(unplanned)) / len(open_high) if open_high else 100.0
        )
        on_time = 100.0 * (len(i.actions) - len(overdue)) / len(i.actions)
        c_value = 0.5 * coverage + 0.5 * on_time
        parts = []
        if open_high:
            parts.append(f"cobertura {coverage:.0f}% dos riscos críticos/altos")
        parts.append(
            f"{_plural(len(overdue), 'ação atrasada', 'ações atrasadas')} de {len(i.actions)}"
            if overdue
            else f"{_plural(len(i.actions), 'ação em dia', 'ações em dia')}"
        )
        c_summary = " · ".join(parts)
        c_items += [
            _item(
                "risk",
                r.id,
                r.title,
                "Sem ação planejada (responsável e prazo)",
                WEIGHTS["C"] * 50 / len(open_high),
            )
            for r in unplanned
        ]
        c_items += [
            _item(
                "action",
                a.id,
                a.title,
                f"Atrasada desde {a.due_date.strftime('%d/%m/%Y')}",  # type: ignore[union-attr]
                WEIGHTS["C"] * 50 / len(i.actions),
            )
            for a in overdue
        ]

    # K — Controles: are open critical/high risks covered by a control that exists in practice?
    k_items: list[dict[str, Any]] = []
    if not open_high:
        k_value = 100.0
        k_summary = "Nenhum risco crítico/alto em aberto"
    else:
        covered = sum(r.coverage for r in open_high)
        k_value = 100.0 * covered / len(open_high)
        full = sum(1 for r in open_high if r.coverage >= 1.0)
        partial = sum(1 for r in open_high if 0 < r.coverage < 1.0)
        k_summary = (
            f"{full} de {len(open_high)} riscos críticos/altos com controle implementado"
            + (f" · {partial} com controle parcial" if partial else "")
        )
        per_risk = WEIGHTS["K"] * 100 / len(open_high)
        k_items += [
            _item(
                "risk",
                r.id,
                r.title,
                "Sem controle implementado" if r.coverage == 0 else "Controle apenas parcial",
                per_risk * (1 - r.coverage),
            )
            for r in open_high
            if r.coverage < 1.0
        ]

    # D — Evidências: closed critical/high risks and done actions that carry proof.
    d_items: list[dict[str, Any]] = []
    denominator = len(closed_high) + len(done)
    if denominator == 0:
        d_value = 0.0
        d_summary = NO_EVIDENCE_HINT
        d_items.append(
            _item(
                "evidence",
                None,
                NO_EVIDENCE_HINT,
                "Anexe evidências ao resolver riscos e concluir ações",
                WEIGHTS["D"] * 100,
            )
        )
    else:
        with_evidence = sum(1 for r in closed_high if r.evidence) + sum(
            1 for a in done if a.evidence
        )
        d_value = 100.0 * with_evidence / denominator
        d_summary = f"{with_evidence} de {denominator} itens fechados com evidência"
        per_item = WEIGHTS["D"] * 100 / denominator
        d_items += [
            _item("risk", r.id, r.title, "Resolvido sem evidência", per_item)
            for r in closed_high
            if not r.evidence
        ]
        d_items += [
            _item("action", a.id, a.title, "Concluída sem evidência", per_item)
            for a in done
            if not a.evidence
        ]

    factors = [
        _factor("B", b_value, b_summary, b_items),
        _factor("K", k_value, k_summary, k_items),
        _factor("C", c_value, c_summary, c_items),
        _factor("A", a_value, a_summary, a_items),
        _factor("D", d_value, d_summary, d_items),
    ]
    score = _round_half_up(sum(f["contribution"] for f in factors))
    score = max(0, min(100, score))

    # Reducers are aggregated reasons ranked by the points they cost today (UX §13: "3 critical
    # risks · 1 overdue action"), built from the full item lists — never the capped payload lists.
    groups: list[dict[str, Any]] = []
    _group(
        groups,
        "unplanned",
        [it for it in c_items if it["kind"] == "risk"],
        lambda n: _plural(
            n, "risco crítico/alto sem ação planejada", "riscos críticos/altos sem ação planejada"
        ),
    )
    for severity, one, many in (
        (RiskSeverity.CRITICO, "risco crítico em aberto", "riscos críticos em aberto"),
        (RiskSeverity.ALTO, "risco alto em aberto", "riscos altos em aberto"),
        (RiskSeverity.MEDIO, "risco médio em aberto", "riscos médios em aberto"),
        (RiskSeverity.BAIXO, "risco baixo em aberto", "riscos baixos em aberto"),
    ):
        label = _severity_label(severity)
        _group(
            groups,
            f"open_{severity.value}",
            [it for it in b_items if it["detail"].startswith(label)],
            lambda n, one=one, many=many: _plural(n, one, many),
        )
    _group(
        groups,
        "uncontrolled",
        [it for it in k_items if it["detail"] == "Sem controle implementado"],
        lambda n: _plural(
            n, "risco crítico/alto sem controle implementado", "riscos críticos/altos sem controle"
        ),
    )
    _group(
        groups,
        "overdue",
        [it for it in c_items if it["kind"] == "action"],
        lambda n: _plural(n, "ação atrasada", "ações atrasadas"),
    )
    if denominator == 0:
        _group(groups, "no_evidence", d_items, lambda n: NO_EVIDENCE_HINT)
    else:
        _group(
            groups,
            "missing_evidence",
            d_items,
            lambda n: _plural(n, "item fechado sem evidência", "itens fechados sem evidência"),
        )
    # One item that already carries its own count ("30 perguntas sem resposta").
    _group(groups, "unanswered", [it for it in a_items if it["points"] > 0], None)
    groups.sort(key=lambda g: (-g["points"], PRIORITY.index(g["reason"])))
    return {
        "available": True,
        "score": score,
        "score_version": SCORE_VERSION,
        "preliminary": i.preliminary,
        "assessment_completed": i.assessment_completed,
        "band": band_for(score),
        "factors": factors,
        "top_reducers": groups[:3],
        "next_actions": _next_actions(groups),
    }


PRIORITY = [
    "unplanned",
    "open_critico",
    "open_alto",
    "open_medio",
    "open_baixo",
    "uncontrolled",
    "overdue",
    "no_evidence",
    "missing_evidence",
    "unanswered",
]


def _group(groups: list[dict[str, Any]], reason: str, items: list[dict[str, Any]], title) -> None:  # noqa: ANN001
    """`title` builds the label from the item count; None uses the single item's own title."""
    points = round(sum(it.get("_raw", it["points"]) for it in items), 2)
    if points <= 0:
        return
    groups.append(
        {
            "reason": reason,
            "title": title(len(items)) if title else items[0]["title"],
            "points": points,
            "count": len(items),
            "refs": [
                {"kind": it["kind"], "id": it["id"], "title": it["title"]} for it in items[:3]
            ],
        }
    )


def _severity_label(severity: RiskSeverity) -> str:
    return {"critico": "Crítico", "alto": "Alto", "medio": "Médio", "baixo": "Baixo"}[
        severity.value
    ]


def _next_actions(groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """One concrete step per reducer, in reducer order, without repeating a record."""
    out: list[dict[str, Any]] = []
    seen: set[tuple[str, str | None]] = set()

    def push(step: dict[str, Any]) -> None:
        key = (step["kind"], step["id"])
        if key not in seen:
            seen.add(key)
            out.append(step)

    for g in groups:
        reason = g["reason"]
        if reason == "unanswered":
            push({"kind": "assessment", "id": None, "label": "Concluir o diagnóstico"})
        elif reason == "no_evidence":
            push(
                {
                    "kind": "evidence",
                    "id": None,
                    "label": "Registrar evidências ao resolver riscos e concluir ações",
                }
            )
        else:
            # First record of the group not already suggested by a higher-ranked reducer.
            ref = next((r for r in g["refs"] if (r["kind"], r["id"]) not in seen), None)
            if ref is None:
                continue
            if reason == "unplanned":
                label = f"Planejar ação para “{ref['title']}”"
            elif reason == "uncontrolled":
                label = f"Associar e implementar um controle para “{ref['title']}”"
            elif reason == "overdue":
                label = f"Atualizar prazo ou concluir “{ref['title']}”"
            elif reason == "missing_evidence":
                label = f"Anexar evidência a “{ref['title']}”"
            else:
                label = f"Tratar “{ref['title']}”"
            push({**_ref(ref), "label": label})
        if len(out) == 3:
            break
    return out


def _ref(ref: dict[str, Any]) -> dict[str, Any]:
    return {"kind": ref["kind"], "id": ref["id"]}


def simulate(
    i: ScoreInputs,
    *,
    resolve_risk: uuid.UUID | None = None,
    done_action: uuid.UUID | None = None,
) -> int:
    """Score if the given risk were resolved with evidence (and its control implemented) and/or
    the given action were done with evidence. Pure; used for "what do I gain" (D30, D31)."""
    risks = tuple(
        replace(
            r,
            status=RiskStatus.RESOLVIDO,
            evidence=True,
            coverage=max(r.coverage, 1.0),
            planned=True,
        )
        if r.id == resolve_risk
        else r
        for r in i.risks
    )
    actions = tuple(
        replace(a, status=ActionStatus.CONCLUIDA, evidence=True) if a.id == done_action else a
        for a in i.actions
    )
    payload = compute(replace(i, risks=risks, actions=actions))
    return int(payload["score"]) if payload["available"] else 0


# --- database side ------------------------------------------------------------------------------


def gather(db: Session, organization_id: uuid.UUID) -> ScoreInputs | None:
    """None until the assessment has been completed at least once (empty state, not 0)."""
    assessment = current_assessment(db, organization_id)
    if assessment is None or assessment.first_completed_at is None:
        return None
    scoped = scoped_questions(assessment)
    answers = responses_by_question(db, assessment)
    answered = [q for q in scoped if q.id in answers]
    max_penalty = sum(
        SEVERITY_WEIGHT[derive_severity(3, q.impact)]
        for q in answered
        if answers[q.id].value != AnswerValue.NAO_SE_APLICA
    )
    uncertain = sum(1 for q in answered if answers[q.id].value == AnswerValue.NAO_SEI)

    planned_risk_ids = set(
        db.scalars(
            select(Action.risk_id).where(
                Action.organization_id == organization_id,
                Action.risk_id.is_not(None),
                Action.owner_membership_id.is_not(None),
                Action.due_date.is_not(None),
            )
        )
    )
    evidenced_risks = set(
        db.scalars(
            select(Evidence.risk_id).where(
                Evidence.organization_id == organization_id, Evidence.risk_id.is_not(None)
            )
        )
    )
    evidenced_actions = set(
        db.scalars(
            select(Evidence.action_id).where(
                Evidence.organization_id == organization_id, Evidence.action_id.is_not(None)
            )
        )
    )
    from app.services.controls import coverage_by_risk  # noqa: PLC0415 — avoids an import cycle

    coverage = coverage_by_risk(db, organization_id)
    risks = tuple(
        RiskInput(
            id=r.id,
            title=r.title,
            severity=r.severity,
            status=r.status,
            planned=r.id in planned_risk_ids,
            evidence=r.id in evidenced_risks,
            coverage=coverage.get(r.id, 0.0),
        )
        for r in db.execute(
            select(Risk.id, Risk.title, Risk.severity, Risk.status)
            .where(Risk.organization_id == organization_id)
            .order_by(Risk.created_at, Risk.id)
        )
    )
    actions = tuple(
        ActionInput(
            id=a.id,
            title=a.title,
            status=a.status,
            due_date=a.due_date,
            evidence=a.id in evidenced_actions,
        )
        for a in db.execute(
            select(Action.id, Action.title, Action.status, Action.due_date)
            .where(Action.organization_id == organization_id)
            .order_by(Action.created_at, Action.id)
        )
    )
    return ScoreInputs(
        preliminary=assessment.mode.value == "short",
        assessment_completed=assessment.status.value == "completed",
        answered=len(answered),
        total=len(scoped),
        uncertain=uncertain,
        max_penalty=max_penalty,
        risks=risks,
        actions=actions,
        today=today_local(),
    )


def _latest(db: Session, organization_id: uuid.UUID) -> ScoreSnapshot | None:
    return db.scalar(
        select(ScoreSnapshot)
        .where(ScoreSnapshot.organization_id == organization_id)
        .order_by(ScoreSnapshot.computed_at.desc())
        .limit(1)
    )


def _signature(payload: dict[str, Any]) -> tuple:
    return (
        payload["score"],
        payload["preliminary"],
        payload["score_version"],
        tuple((f["key"], f["value"]) for f in payload["factors"]),
    )


def _is_first_of_day(db: Session, snapshot: ScoreSnapshot) -> bool:
    local = snapshot.computed_at.astimezone(_tz())
    day_start = datetime.combine(local.date(), datetime.min.time(), tzinfo=local.tzinfo)
    earlier = db.scalar(
        select(func.count())
        .select_from(ScoreSnapshot)
        .where(
            ScoreSnapshot.organization_id == snapshot.organization_id,
            ScoreSnapshot.computed_at >= day_start,
            ScoreSnapshot.computed_at < snapshot.computed_at,
        )
    )
    return not earlier


def recalculate(db: Session, organization_id: uuid.UUID, trigger: str) -> ScoreSnapshot | None:
    """Persist the current score in the caller's transaction. Cadence (proposal §7): the latest
    snapshot of the hour is overwritten unless it is the first of its day; an unchanged score
    writes nothing."""
    inputs = gather(db, organization_id)
    if inputs is None:
        return None
    payload = compute(inputs)
    if not payload["available"]:
        return None
    latest = _latest(db, organization_id)
    if latest is not None and _signature(latest.breakdown) == _signature(payload):
        return latest
    now = utcnow()
    same_hour = latest is not None and latest.computed_at.astimezone(_tz()).replace(
        minute=0, second=0, microsecond=0
    ) == now.astimezone(_tz()).replace(minute=0, second=0, microsecond=0)
    if latest is not None and same_hour and not _is_first_of_day(db, latest):
        snapshot = latest
    else:
        snapshot = ScoreSnapshot(organization_id=organization_id)
        db.add(snapshot)
    snapshot.score = payload["score"]
    snapshot.score_version = payload["score_version"]
    snapshot.preliminary = payload["preliminary"]
    snapshot.trigger = trigger
    snapshot.breakdown = payload
    snapshot.computed_at = now
    db.flush()
    return snapshot


def _delta(db: Session, organization_id: uuid.UUID, payload: dict[str, Any], now: datetime):
    """Earliest comparable snapshot (same version and preliminary flag) taken before today and
    within the trailing window; None when there is nothing older to compare with."""
    local_today = now.astimezone(_tz()).date()
    day_start = datetime.combine(local_today, datetime.min.time(), tzinfo=_tz())
    previous = db.scalar(
        select(ScoreSnapshot)
        .where(
            ScoreSnapshot.organization_id == organization_id,
            ScoreSnapshot.score_version == payload["score_version"],
            ScoreSnapshot.preliminary.is_(payload["preliminary"]),
            ScoreSnapshot.computed_at < day_start,
            ScoreSnapshot.computed_at >= now - timedelta(days=DELTA_WINDOW_DAYS),
        )
        .order_by(ScoreSnapshot.computed_at.asc())
        .limit(1)
    )
    if previous is None:
        return None
    return {
        "previous_score": previous.score,
        "previous_at": previous.computed_at,
        "diff": payload["score"] - previous.score,
    }


def current(db: Session, organization_id: uuid.UUID) -> dict[str, Any]:
    inputs = gather(db, organization_id)
    if inputs is None:
        return {
            "available": False,
            "reason": "no_assessment",
            "message": "Score disponível após o diagnóstico.",
        }
    payload = compute(inputs)
    now = utcnow()
    payload["computed_at"] = now
    if payload["available"]:
        payload["delta"] = _delta(db, organization_id, payload, now)
    return payload


def history(db: Session, organization_id: uuid.UUID, limit: int) -> list[ScoreSnapshot]:
    return list(
        db.scalars(
            select(ScoreSnapshot)
            .where(ScoreSnapshot.organization_id == organization_id)
            .order_by(ScoreSnapshot.computed_at.desc())
            .limit(limit)
        )
    )
