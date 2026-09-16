"""Priorities, radar, agent answers and executive summary (D30, D32, D33) — behaviour through the
API on a small, hand-checked scenario."""

from datetime import date, timedelta

import pytest

from tests.conftest import invite_and_accept, make_client, signup

SHORT = (
    "DF-01",
    "DF-04",
    "AA-01",
    "AA-03",
    "SE-01",
    "SE-03",
    "FT-01",
    "FT-03",
    "PR-01",
    "TI-01",
    "TI-04",
    "PE-02",
)


@pytest.fixture
def world(emails):  # noqa: ANN001, ANN201
    """Short diagnostic with two gaps (AA-03 crítico, SE-03 alto). One planned action on the
    crítico (overdue, esforço baixo), the alto unplanned. Profile says sensitive data."""
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    base = f"/api/v1/orgs/{oid}"
    owner.post(f"{base}/assessment/start", json={"mode": "short"})
    for code in SHORT:
        value = "nao" if code in ("AA-03", "SE-03") else "sim"
        owner.put(f"{base}/assessment/answers/{code}", json={"value": value})
    owner.post(f"{base}/assessment/complete")
    risks = {r["origin_question_code"]: r for r in owner.get(f"{base}/risks").json()["items"]}
    ids = {m["role"]: m["id"] for m in owner.get(f"{base}/members").json()}
    action = owner.post(
        f"{base}/actions",
        json={
            "title": "Ativar MFA no e-mail",
            "risk_id": risks["AA-03"]["id"],
            "owner_membership_id": ids["member"],
            "due_date": (date.today() - timedelta(days=3)).isoformat(),
            "effort": "baixo",
        },
    ).json()
    owner.put(f"{base}/profile", json={"data_categories": ["saude"], "sells_to_enterprise": True})
    return {
        "id": oid,
        "owner": owner,
        "member": member,
        "risks": risks,
        "action": action,
        "base": base,
    }


def test_priorities_explain_points_and_score_gain(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    p = o.get(f"{base}/priorities").json()
    assert p["profile_complete"] is False and p["total_pending"] == 1
    item = p["items"][0]
    # crítico 12 × exposure 1.5 (sensitive data on an "acesso" risk) × overdue 1.5 ÷ effort 1.0 = 27
    assert item["points"] == 27.0 and item["effort"] == "baixo"
    assert item["reasons"] == [
        "reduz um risco crítico",
        "trata dados sensíveis ou de crianças/adolescentes",
        "atrasada há 3 dias",
        "esforço baixo",
    ]
    # Resolving the crítico with proof and an implemented control raises the score: the gain is a
    # positive whole number and the item names the risk it serves.
    assert item["score_gain"] > 0 and item["risk_title"] == world["risks"]["AA-03"]["title"]
    # The alto (SE-03) has no action: listed as "planejar", without a control yet.
    assert [u["title"] for u in p["unplanned"]] == [world["risks"]["SE-03"]["title"]]
    assert p["unplanned"][0]["has_control"] is False and p["unplanned"][0]["score_gain"] > 0
    assert p["current_score"] == o.get(f"{base}/score").json()["score"]


def test_radar_lists_attention_items_with_reasons(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    r = o.get(f"{base}/radar").json()
    kinds = {it["kind"]: it for it in r["items"]}
    assert kinds["risk_critical"]["count"] == 1 and kinds["risk_critical"]["tone"] == "danger"
    assert kinds["risk_uncontrolled"]["count"] == 2  # crítico and alto, no controls yet
    assert kinds["risk_unplanned"]["count"] == 1  # SE-03
    assert kinds["risk_unowned"]["count"] == 2  # derived risks have no owner yet
    assert kinds["action_overdue"]["count"] == 1
    assert kinds["profile_incomplete"]["tone"] == "info"
    assert r["all_clear"] is False and r["counts"]["danger"] == 3
    # Danger first, then warning, then info; every item carries a route hint for the app.
    tones = [it["tone"] for it in r["items"]]
    assert tones == sorted(tones, key={"danger": 0, "warning": 1, "info": 2}.get)
    assert all(it["route"] for it in r["items"])

    # Plan the crítico through the engine: a control now exists (planejado → still uncovered).
    risk = world["risks"]["AA-03"]
    o.post(f"{base}/actions/{world['action']['id']}/status", json={"status": "em_andamento"})
    o.post(f"{base}/actions/{world['action']['id']}/status", json={"status": "concluida"})
    plan = o.post(f"{base}/risks/{risk['id']}/plan", json={}).json()
    o.patch(f"{base}/controls/{plan['control']['id']}", json={"status": "implementado"})
    r = o.get(f"{base}/radar").json()
    kinds = {it["kind"]: it for it in r["items"]}
    assert kinds["risk_uncontrolled"]["count"] == 1  # only the alto remains uncovered
    assert kinds["control_without_evidence"]["count"] == 1  # implemented, no proof yet


def test_agent_answers_are_grounded_and_caveated(world) -> None:  # noqa: ANN001
    o, m, base = world["owner"], world["member"], world["base"]
    keys = {q["key"] for q in o.get(f"{base}/agent/questions").json()}
    assert {"biggest_risks", "this_week", "score_change", "risks_without_control"} <= keys
    a = o.get(f"{base}/agent/answers/biggest_risks").json()
    assert "crítico" in a["answer"] and world["risks"]["AA-03"]["title"] in a["answer"]
    assert [b["kind"] for b in a["basis"]] == ["risk", "risk"] and "jurídica" in a["caveat"]
    week = o.get(f"{base}/agent/answers/this_week").json()
    assert week["answer"].startswith("Pela ordem de prioridade: Ativar MFA no e-mail — reduz um")
    assert "planejar" in week["answer"] and week["basis"][0]["kind"] == "action"
    assert "Sem controle" in o.get(f"{base}/agent/answers/risks_without_control").json()["answer"]
    assert o.get(f"{base}/agent/answers/nope").status_code == 404
    # Context: managers only (it carries the activity feed); the member reads answers.
    ctx = o.get(f"{base}/agent/context").json()
    assert ctx["profile"]["data_categories"] == ["saude"] and ctx["score"]["available"] is True
    assert ctx["recent_activity"] and "caveat" in ctx and "email" not in str(ctx).lower()
    assert m.get(f"{base}/agent/context").status_code == 403
    assert m.get(f"{base}/agent/answers/overdue_actions").status_code == 200


def test_executive_summary_reads_the_window(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    s = o.get(f"{base}/executive-summary").json()
    assert s["score"]["available"] is True and s["window_days"] == 30
    assert [e["severity"] for e in s["exposures"]] == ["critico", "alto"]
    assert s["exposures"][0]["planned"] is True and s["exposures"][1]["planned"] is False
    assert s["worsened"]["risks_created"] == 2 and s["worsened"]["actions_overdue"] == 1
    assert s["improved"] == {
        "risks_resolved": 0,
        "actions_done": 0,
        "controls_implemented": 0,
        "evidence_added": 0,
    }
    why = {d["why"] for d in s["decisions"]}
    assert why == {"sem responsável"}  # both high risks lack an owner
    assert s["next_30_days"][0]["title"] == "Ativar MFA no e-mail"
    assert s["controls"]["total"] == 0 and s["caveat"]
    # A viewer can read the executive view.
    v = make_client()
    signup(v, email="v@other.com.br", org="Outra")  # unrelated: still 404 on this org
    assert v.get(f"{base}/executive-summary").status_code == 404
