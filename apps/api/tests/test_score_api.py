"""Score API on a real database: empty state, live computation over the seeded template,
recalculation triggers, snapshot cadence, delta, permissions."""

from datetime import date, timedelta

import pytest
from sqlalchemy import text

from app.db.session import get_engine
from tests.conftest import invite_and_accept, make_client, signup
from tests.test_assessment import SHORT_CODES

# Answers of test_assessment's completion case. Over the seeded content (short mode: nine impact-4
# and three impact-3 questions; FT-03 is impact-3 and answered N/A) the worst case for what was
# answered is 9×12 + 2×6 = 120 and the open penalty 12 + 6 + 6 + 6 + 3 = 33 → B = 72.5.
ANSWERS = {
    "DF-01": "nao",
    "DF-04": "parcial",
    "AA-01": "nao_sei",
    "SE-03": "nao",
    "PE-02": "parcial",
}


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    members = owner.get(f"/api/v1/orgs/{oid}/members").json()
    owner_membership = next(m["id"] for m in members if m["role"] == "owner")
    return {"id": oid, "owner": owner, "viewer": viewer, "owner_membership": owner_membership}


def _complete_short(org, answers: dict[str, str] | None = None) -> None:  # noqa: ANN001
    o, base = org["owner"], f"/api/v1/orgs/{org['id']}/assessment"
    assert o.post(f"{base}/start", json={"mode": "short"}).status_code in (200, 201)
    answers = ANSWERS if answers is None else answers
    for code in SHORT_CODES:
        value = (
            "nao_se_aplica" if code == "FT-03" and answers is ANSWERS else answers.get(code, "sim")
        )
        body: dict = {"value": value}
        if value == "nao_se_aplica":
            body["justification"] = "Não se aplica ao nosso caso"
        assert o.put(f"{base}/answers/{code}", json=body).status_code == 200, code
    assert o.post(f"{base}/complete").status_code == 200


def _score(org) -> dict:  # noqa: ANN001
    r = org["owner"].get(f"/api/v1/orgs/{org['id']}/score")
    assert r.status_code == 200, r.text
    return r.json()


def _history(org) -> list[dict]:  # noqa: ANN001
    return org["owner"].get(f"/api/v1/orgs/{org['id']}/score/history").json()["items"]


def test_no_assessment_is_an_empty_state_not_zero(org) -> None:  # noqa: ANN001
    out = _score(org)
    assert out["available"] is False and out["reason"] == "no_assessment"
    assert out["score"] is None and out["factors"] == []
    assert _history(org) == []
    # Risks alone never produce a score or a snapshot.
    org["owner"].post(
        f"/api/v1/orgs/{org['id']}/risks",
        json={"title": "Manual", "category": "dados", "probability": 3, "impact": 4},
    )
    assert _score(org)["available"] is False and _history(org) == []


def test_short_completion_scores_and_snapshots(org) -> None:  # noqa: ANN001
    _complete_short(org)
    out = _score(org)
    assert out["available"] is True and out["preliminary"] is True
    assert out["assessment_completed"] is True and out["score_version"] == "v1"
    f = {x["key"]: x for x in out["factors"]}
    assert (f["A"]["value"], f["B"]["value"], f["C"]["value"], f["D"]["value"]) == (
        100,
        72.5,
        0,
        0,
    )
    assert out["score"] == 51 and out["band"]["key"] == "estruturando"
    assert f["A"]["summary"] == "12 de 12 perguntas respondidas · 1 resposta “não sei”"
    assert f["B"]["summary"] == "5 riscos abertos · peso 33 de 120"
    assert f["C"]["summary"] == "4 riscos críticos/altos sem ação planejada"
    assert [r["reason"] for r in out["top_reducers"]] == ["unplanned", "no_evidence", "open_alto"]
    assert out["top_reducers"][0]["refs"][0]["title"] == "Dados pessoais tratados sem inventário"
    assert out["delta"] is None  # nothing older than today to compare with
    history = _history(org)
    assert len(history) == 1 and history[0]["trigger"] == "assessment.completed"
    assert history[0]["score"] == 51 and history[0]["preliminary"] is True


def test_actions_evidence_and_resolution_move_the_score(org) -> None:  # noqa: ANN001
    _complete_short(org)
    o, oid = org["owner"], org["id"]
    risks = o.get(f"/api/v1/orgs/{oid}/risks", params={"limit": 50}).json()["items"]
    high = [r for r in risks if r["severity"] in ("critico", "alto")]
    assert len(high) == 4
    due = (date.today() + timedelta(days=7)).isoformat()
    for r in high:
        a = o.post(
            f"/api/v1/orgs/{oid}/actions",
            json={
                "title": f"Tratar {r['title'][:20]}",
                "risk_id": r["id"],
                "owner_membership_id": org["owner_membership"],
                "due_date": due,
            },
        )
        assert a.status_code == 201, a.text
    out = _score(org)
    f = {x["key"]: x for x in out["factors"]}
    assert f["C"]["value"] == 100 and out["score"] == 71 and out["band"]["key"] == "organizado"
    # Cadence: the completion snapshot is the first of its day and is kept; the four action
    # triggers within the same hour collapse into one snapshot (latest wins).
    history = _history(org)
    assert [h["score"] for h in history] == [71, 51]
    assert history[0]["trigger"] == "action.created"

    # Resolve the critical risk through the state machine, then attach evidence.
    crit = next(r for r in high if r["severity"] == "critico")
    for status in ("em_andamento", "em_revisao", "resolvido"):
        r = o.post(f"/api/v1/orgs/{oid}/risks/{crit['id']}/status", json={"status": status})
        assert r.status_code == 200, r.text
    out = _score(org)
    f = {x["key"]: x for x in out["factors"]}
    assert f["B"]["value"] == 82.5 and f["D"]["value"] == 0  # resolved without proof
    assert f["D"]["items"][0]["detail"] == "Resolvido sem evidência"
    assert out["next_actions"][0]["label"] == f"Anexar evidência a “{crit['title']}”"
    r = o.post(
        f"/api/v1/orgs/{oid}/evidence",
        json={"kind": "note", "risk_id": crit["id"], "note": "Inventário anexado"},
    )
    assert r.status_code == 201
    out = _score(org)
    f = {x["key"]: x for x in out["factors"]}
    assert f["D"]["value"] == 100 and out["score"] == 91 and out["band"]["key"] == "maduro"
    assert _history(org)[0]["trigger"] == "evidence.added"
    # A manual risk lowers B; deleting the evidence lowers D again.
    o.post(
        f"/api/v1/orgs/{oid}/risks",
        json={"title": "Manual crítico", "category": "acesso", "probability": 3, "impact": 4},
    )
    assert {x["key"]: x for x in _score(org)["factors"]}["B"]["value"] == 72.5
    ev = r.json()["id"]
    assert o.delete(f"/api/v1/orgs/{oid}/evidence/{ev}").status_code == 200
    assert {x["key"]: x for x in _score(org)["factors"]}["D"]["value"] == 0


def test_unchanged_score_writes_no_snapshot_and_reopen_is_explained(org) -> None:  # noqa: ANN001
    _complete_short(org)
    o, oid = org["owner"], org["id"]
    risk = o.get(f"/api/v1/orgs/{oid}/risks").json()["items"][0]
    o.patch(f"/api/v1/orgs/{oid}/risks/{risk['id']}", json={"description": "Só texto"})
    assert len(_history(org)) == 1  # nothing score-relevant changed
    # Reopen into full mode: 12 of 42 answered → A drops, the score stays available.
    o.post(f"/api/v1/orgs/{oid}/assessment/reopen", json={"mode": "full"})
    out = _score(org)
    assert out["available"] is True and out["assessment_completed"] is False
    assert out["preliminary"] is False
    a = next(x for x in out["factors"] if x["key"] == "A")
    assert a["value"] == 28.6 and a["items"][0]["title"] == "30 perguntas sem resposta"
    assert "Concluir o diagnóstico" in [n["label"] for n in out["next_actions"]]


def test_delta_compares_with_the_earliest_snapshot_before_today(org) -> None:  # noqa: ANN001
    _complete_short(org)
    with get_engine().begin() as conn:
        conn.execute(text("UPDATE score_snapshots SET computed_at = now() - interval '2 days'"))
    o, oid = org["owner"], org["id"]
    o.post(
        f"/api/v1/orgs/{oid}/actions",
        json={
            "title": "Plano",
            "risk_id": o.get(f"/api/v1/orgs/{oid}/risks").json()["items"][0]["id"],
            "owner_membership_id": org["owner_membership"],
            "due_date": (date.today() + timedelta(days=3)).isoformat(),
        },
    )
    out = _score(org)
    assert out["delta"]["previous_score"] == 51 and out["delta"]["diff"] == out["score"] - 51
    assert len(_history(org)) == 2  # a new day → a new snapshot, the old one untouched


def test_all_not_applicable_has_no_score_and_no_snapshot(org) -> None:  # noqa: ANN001
    _complete_short(org, answers={c: "nao_se_aplica" for c in SHORT_CODES})
    out = _score(org)
    assert out["available"] is False and out["reason"] == "not_applicable"
    assert _history(org) == []


def test_viewer_reads_score_and_history(org) -> None:  # noqa: ANN001
    _complete_short(org)
    v = org["viewer"]
    assert v.get(f"/api/v1/orgs/{org['id']}/score").json()["score"] == 51
    assert len(v.get(f"/api/v1/orgs/{org['id']}/score/history").json()["items"]) == 1
    assert v.get(f"/api/v1/orgs/{org['id']}/score/history?limit=0").status_code == 422
