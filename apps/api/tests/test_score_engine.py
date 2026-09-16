"""Score engine v2 — pure `compute()` against the proposal's worked examples re-derived under D31
(A 0.10 · B 0.40 · K 0.20 · C 0.15 · D 0.15). No database: same inputs must give the same payload.
Every expected number below is computed by hand in the comments, not copied from the engine."""

import uuid
from datetime import date, timedelta

from app.models.domain import ActionStatus, RiskSeverity, RiskStatus
from app.services.score import ActionInput, RiskInput, ScoreInputs, band_for, compute, simulate

TODAY = date(2026, 9, 12)
FULL_MAX = 250  # the proposal's illustrative template-v1 worst case
SHORT_MAX = 120


def risk(
    severity: RiskSeverity,
    status: RiskStatus = RiskStatus.ABERTO,
    *,
    planned: bool = False,
    evidence: bool = False,
    title: str | None = None,
    coverage: float = 0.0,
) -> RiskInput:
    return RiskInput(
        id=uuid.uuid4(),
        title=title or f"{severity.value} {uuid.uuid4().hex[:4]}",
        severity=severity,
        status=status,
        planned=planned,
        evidence=evidence,
        coverage=coverage,
    )


def action(
    status: ActionStatus = ActionStatus.A_FAZER,
    *,
    due: date | None = None,
    evidence: bool = False,
    title: str | None = None,
) -> ActionInput:
    return ActionInput(
        id=uuid.uuid4(),
        title=title or f"acao {uuid.uuid4().hex[:4]}",
        status=status,
        due_date=due,
        evidence=evidence,
    )


def inputs(
    *,
    risks: tuple[RiskInput, ...] = (),
    actions: tuple[ActionInput, ...] = (),
    answered: int = 42,
    total: int = 42,
    uncertain: int = 0,
    max_penalty: int = FULL_MAX,
    preliminary: bool = False,
    completed: bool = True,
) -> ScoreInputs:
    return ScoreInputs(
        preliminary=preliminary,
        assessment_completed=completed,
        answered=answered,
        total=total,
        uncertain=uncertain,
        max_penalty=max_penalty,
        risks=risks,
        actions=actions,
        today=TODAY,
    )


def factors(payload: dict) -> dict[str, dict]:
    return {f["key"]: f for f in payload["factors"]}


def test_example_1_short_mode_just_completed() -> None:
    risks = tuple(risk(RiskSeverity.CRITICO) for _ in range(4)) + tuple(
        risk(RiskSeverity.MEDIO) for _ in range(3)
    )
    out = compute(
        inputs(risks=risks, answered=12, total=12, max_penalty=SHORT_MAX, preliminary=True)
    )
    f = factors(out)
    assert (
        f["A"]["value"],
        f["B"]["value"],
        f["K"]["value"],
        f["C"]["value"],
        f["D"]["value"],
    ) == (
        100,
        52.5,
        0,
        0,
        0,
    )
    # 0.10×100 + 0.40×52.5 + 0 + 0 + 0 = 31.0 → 31
    assert out["score"] == 31 and out["preliminary"] is True
    assert out["band"] == {"key": "inicial", "label": "Inicial"}
    # Reducers: 4 uncovered criticals cost the whole K (20); the 4 open criticals cost
    # 4 × 40 × 12/120 = 16 in B; 4 unplanned criticals cost the whole C (15); no evidence costs
    # the whole D (15) — the tie at 15 falls back to the declared priority (unplanned first).
    assert [(r["title"], r["points"]) for r in out["top_reducers"]] == [
        ("4 riscos críticos/altos sem controle", 20.0),
        ("4 riscos críticos em aberto", 16.0),
        ("4 riscos críticos/altos sem ação planejada", 15.0),
    ]
    assert out["top_reducers"][0]["count"] == 4 and len(out["top_reducers"][0]["refs"]) == 3
    labels = [a["label"] for a in out["next_actions"]]
    assert labels[0].startswith("Associar e implementar um controle para “")
    assert labels[1].startswith("Tratar “") and labels[2].startswith("Planejar ação para “")
    # The same risk is never suggested twice.
    assert len({(a["kind"], a["id"]) for a in out["next_actions"]}) == 3


def test_example_2_full_assessment_first_action_plan() -> None:
    high = tuple(risk(RiskSeverity.CRITICO, planned=True) for _ in range(2)) + tuple(
        risk(RiskSeverity.ALTO, planned=True) for _ in range(4)
    )
    others = tuple(risk(RiskSeverity.MEDIO) for _ in range(6)) + tuple(
        risk(RiskSeverity.BAIXO) for _ in range(2)
    )
    acts = tuple(action(due=TODAY + timedelta(days=7)) for _ in range(8)) + tuple(
        action(due=TODAY - timedelta(days=1)) for _ in range(2)
    )
    out = compute(inputs(risks=high + others, actions=acts))
    f = factors(out)
    assert (
        f["A"]["value"],
        f["B"]["value"],
        f["K"]["value"],
        f["C"]["value"],
        f["D"]["value"],
    ) == (
        100,
        72.8,
        0,
        90,
        0,
    )
    # 10 + 0.40×72.8 (29.12) + 0 + 0.15×90 (13.5) + 0 = 52.62 → 53
    assert out["score"] == 53 and out["band"]["key"] == "estruturando"
    assert f["C"]["summary"] == "cobertura 100% dos riscos críticos/altos · 2 ações atrasadas de 10"
    assert f["K"]["summary"] == "0 de 6 riscos críticos/altos com controle implementado"
    assert f["D"]["items"][0]["title"] == "Nenhuma evidência registrada ainda"
    # Six uncovered high risks cost the whole K (20); D = 0 costs 15; the two open criticals cost
    # 2 × 40 × 12/250 = 3.84, the same as the four altos (4 × 0.96) — ties keep severity order.
    assert [(r["reason"], r["points"]) for r in out["top_reducers"]] == [
        ("uncontrolled", 20.0),
        ("no_evidence", 15.0),
        ("open_critico", 3.84),
    ]
    assert [a["label"][:8] for a in out["next_actions"]] == ["Associar", "Registra", "Tratar “"]


def test_example_3_one_month_later() -> None:
    closed = (
        risk(RiskSeverity.CRITICO, RiskStatus.RESOLVIDO, evidence=True),
        risk(RiskSeverity.ALTO, RiskStatus.RESOLVIDO, evidence=True),
        risk(RiskSeverity.ALTO, RiskStatus.RESOLVIDO, evidence=False, title="Alto sem prova"),
    )
    open_ = (
        (risk(RiskSeverity.CRITICO, planned=True),)
        + tuple(risk(RiskSeverity.ALTO, planned=True) for _ in range(2))
        + tuple(risk(RiskSeverity.MEDIO) for _ in range(6))
        + tuple(risk(RiskSeverity.BAIXO) for _ in range(2))
    )
    acts = (
        tuple(action(ActionStatus.CONCLUIDA, evidence=True) for _ in range(4))
        + (action(ActionStatus.CONCLUIDA, evidence=False, title="Concluída sem prova"),)
        + tuple(action(due=TODAY + timedelta(days=3)) for _ in range(5))
    )
    out = compute(inputs(risks=closed + open_, actions=acts))
    f = factors(out)
    assert (
        f["A"]["value"],
        f["B"]["value"],
        f["K"]["value"],
        f["C"]["value"],
        f["D"]["value"],
    ) == (
        100,
        82.4,
        0,
        100,
        75,
    )
    # 10 + 32.96 + 0 + 15 + 11.25 = 69.21 → 69: without controls the ceiling is "Organizado".
    assert out["score"] == 69 and out["band"]["key"] == "organizado"
    assert f["D"]["summary"] == "6 de 8 itens fechados com evidência"
    titles = {i["title"] for i in f["D"]["items"]}
    assert titles == {"Alto sem prova", "Concluída sem prova"}
    labels = [a["label"] for a in out["next_actions"]]
    assert labels[0].startswith("Associar e implementar um controle para “")  # 3 × 6.67 = 20 pts
    assert labels[1] == "Anexar evidência a “Alto sem prova”"  # 2 × 1.875 = 3.75 pts
    # Implementing controls on the three open high risks lifts the same records to "Maduro".
    covered = tuple(
        RiskInput(r.id, r.title, r.severity, r.status, r.planned, r.evidence, 1.0)
        if r.status == RiskStatus.ABERTO and r.severity in (RiskSeverity.CRITICO, RiskSeverity.ALTO)
        else r
        for r in closed + open_
    )
    out2 = compute(inputs(risks=covered, actions=acts))
    assert factors(out2)["K"]["value"] == 100 and out2["score"] == 89  # 69.21 + 20 → 89


def test_all_sim_gives_the_honest_ceiling_85() -> None:
    out = compute(inputs())
    f = factors(out)
    assert (
        f["A"]["value"],
        f["B"]["value"],
        f["K"]["value"],
        f["C"]["value"],
        f["D"]["value"],
    ) == (
        100,
        100,
        100,
        100,
        0,
    )
    assert out["score"] == 85  # 10 + 40 + 20 + 15: the honest ceiling without proof is unchanged
    assert f["C"]["summary"] == "Nada a executar no momento"
    assert [r["reason"] for r in out["top_reducers"]] == ["no_evidence"]


def test_all_nao_gives_b_zero_and_manual_overload_is_clamped() -> None:
    # Exactly the worst case: penalty == max_penalty → B = 0.
    worst = tuple(risk(RiskSeverity.CRITICO) for _ in range(20)) + tuple(
        risk(RiskSeverity.ALTO) for _ in range(1)
    )
    assert sum({"critico": 12, "alto": 6}[r.severity.value] for r in worst) == 246
    out = compute(inputs(risks=worst, max_penalty=246))
    assert factors(out)["B"]["value"] == 0
    # Manual risks push the numerator past the worst case → still 0, never negative.
    out = compute(inputs(risks=worst + (risk(RiskSeverity.CRITICO),), max_penalty=246))
    assert factors(out)["B"]["value"] == 0 and out["score"] == 10  # only A survives


def test_all_not_applicable_is_undefined_not_zero() -> None:
    out = compute(inputs(max_penalty=0))
    assert out == {
        "available": False,
        "reason": "not_applicable",
        "message": (
            "Todas as perguntas respondidas foram marcadas como não aplicáveis; "
            "não há base para calcular o score."
        ),
    }


def test_one_critical_without_action_zeroes_execution() -> None:
    out = compute(inputs(risks=(risk(RiskSeverity.CRITICO, title="MFA"),)))
    f = factors(out)
    assert f["C"]["value"] == 0 and f["C"]["items"][0]["detail"] == "Sem ação planejada"
    assert f["C"]["items"][0]["points"] == 15
    # The missing control (20 pts) outranks the missing plan (15 pts); one next step per record.
    assert [r["title"] for r in out["top_reducers"][:2]] == [
        "1 risco crítico/alto sem controle implementado",
        "1 risco crítico/alto sem ação planejada",
    ]
    assert out["next_actions"][0]["label"] == "Associar e implementar um controle para “MFA”"
    # With an unrelated action in the system, coverage still fails but on-time is 100.
    out = compute(inputs(risks=(risk(RiskSeverity.CRITICO),), actions=(action(),)))
    assert factors(out)["C"]["value"] == 50


def test_overdue_boundary_is_the_local_calendar_day() -> None:
    due_today = action(due=TODAY)
    due_yesterday = action(due=TODAY - timedelta(days=1))
    out = compute(inputs(actions=(due_today, due_yesterday)))
    c = factors(out)["C"]
    assert c["value"] == 75  # coverage 100 (no high risks), on-time 1/2
    assert [i["id"] for i in c["items"]] == [str(due_yesterday.id)]
    assert c["items"][0]["detail"] == "Atrasada desde 11/09/2026"
    # A done action is never overdue.
    out = compute(inputs(actions=(action(ActionStatus.CONCLUIDA, due=TODAY - timedelta(days=30)),)))
    assert factors(out)["C"]["value"] == 100


def test_evidence_factor_counts_closed_high_risks_and_done_actions_only() -> None:
    risks = (
        risk(RiskSeverity.CRITICO, RiskStatus.RESOLVIDO, evidence=True),
        risk(RiskSeverity.MEDIO, RiskStatus.RESOLVIDO, evidence=False),  # not counted (medium)
        risk(RiskSeverity.ALTO, RiskStatus.ACEITO, evidence=False),  # accepted ≠ resolved
    )
    acts = (action(ActionStatus.CONCLUIDA, evidence=False),)
    d = factors(compute(inputs(risks=risks, actions=acts)))["D"]
    assert d["value"] == 50 and d["summary"] == "1 de 2 itens fechados com evidência"


def test_unanswered_and_uncertain_are_explained() -> None:
    out = compute(inputs(answered=12, total=42, uncertain=2, completed=False))
    a = factors(out)["A"]
    assert (
        a["value"] == 28.6
        and a["summary"] == "12 de 42 perguntas respondidas · 2 respostas “não sei”"
    )
    assert a["items"][0]["title"] == "30 perguntas sem resposta" and a["items"][0]["points"] == 7.14
    assert a["items"][1]["points"] == 0  # uncertainty is shown, never scored
    assert out["assessment_completed"] is False
    assert {n["label"] for n in out["next_actions"]} >= {"Concluir o diagnóstico"}
    unanswered = next(r for r in out["top_reducers"] if r["reason"] == "unanswered")
    assert unanswered["title"] == "30 perguntas sem resposta" and unanswered["points"] == 7.14


def test_determinism_and_rounding() -> None:
    risks = (risk(RiskSeverity.ALTO, planned=True), risk(RiskSeverity.MEDIO))
    acts = (action(due=TODAY + timedelta(days=1)),)
    a, b = compute(inputs(risks=risks, actions=acts)), compute(inputs(risks=risks, actions=acts))
    assert a == b
    # 0.10×100 + 0.40×96.4 + 0 (alto uncovered) + 0.15×100 + 0 = 63.56 → 64.
    assert a["score"] == 63 + 1
    # Half-up rounding, not banker's: A 100, B 100 × (1 − 6/250) = 97.6 with an uncovered alto
    # → 10 + 39.04 + 0 + 15 + 0 = 64.04 → 64; with an Alto at coverage 0.5 → 74.04 → 74.
    half = compute(
        inputs(
            risks=(risk(RiskSeverity.ALTO, planned=True, coverage=0.5),),
            actions=(action(due=TODAY + timedelta(days=1)),),
        )
    )
    assert half["score"] == 74
    assert band_for(39)["key"] == "inicial" and band_for(40)["key"] == "estruturando"
    assert band_for(59)["key"] == "estruturando" and band_for(60)["key"] == "organizado"
    assert band_for(79)["key"] == "organizado" and band_for(80)["key"] == "maduro"
    assert band_for(100)["key"] == "maduro"


def test_items_are_capped_but_reducers_rank_over_all() -> None:
    risks = tuple(risk(RiskSeverity.BAIXO, title=f"baixo {n:02d}") for n in range(11)) + (
        risk(RiskSeverity.CRITICO, title="zzz critico"),
    )
    out = compute(inputs(risks=risks, actions=(action(),)))
    b = factors(out)["B"]
    assert len(b["items"]) == 10 and b["item_count"] == 12
    assert [r["title"] for r in out["top_reducers"]] == [
        "1 risco crítico/alto sem controle implementado",  # 20
        "Nenhuma evidência registrada ainda",  # 15
        "1 risco crítico/alto sem ação planejada",  # 7.5 (half of C)
    ]
    assert out["top_reducers"][0]["refs"][0]["title"] == "zzz critico"


def test_controls_factor_and_simulation() -> None:
    covered = risk(RiskSeverity.CRITICO, planned=True, coverage=1.0, title="Coberto")
    partial = risk(RiskSeverity.ALTO, planned=True, coverage=0.5, title="Parcial")
    bare = risk(RiskSeverity.ALTO, planned=True, title="Descoberto")
    acts = (action(due=TODAY + timedelta(days=5)),)
    base = inputs(risks=(covered, partial, bare), actions=acts)
    out = compute(base)
    k = factors(out)["K"]
    # (1 + 0.5 + 0) / 3 = 50 %; items only for what is not fully covered, cheapest first in list.
    assert k["value"] == 50.0
    assert (
        k["summary"]
        == "1 de 3 riscos críticos/altos com controle implementado · 1 com controle parcial"
    )
    assert {(i["title"], i["detail"], i["points"]) for i in k["items"]} == {
        ("Parcial", "Controle apenas parcial", 3.33),
        ("Descoberto", "Sem controle implementado", 6.67),
    }
    # B = 100 × (1 − 24/250) = 90.4 → 10 + 36.16 + 10 + 15 + 0 = 71.16 → 71
    assert out["score"] == 71
    # Simulation: resolving "Descoberto" with proof removes 6 of penalty (B 92.8), covers it
    # (K 75) and adds a closed high risk with evidence (D 100) → 10 + 37.12 + 15 + 15 + 15 = 92.
    assert simulate(base, resolve_risk=bare.id) == 92
    # Doing the (unrelated) action with evidence only adds D = 100 → 71.16 + 15 → 86.
    assert simulate(base, done_action=acts[0].id) == 86
    # Simulation never mutates the inputs.
    assert compute(base) == out
