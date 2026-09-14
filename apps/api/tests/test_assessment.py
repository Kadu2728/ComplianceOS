"""Diagnóstico: template seed, start/answer/complete, derivation rules, reopen, permissions."""

import pytest

from tests.conftest import invite_and_accept, make_client, signup

SHORT_CODES = [
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
]


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    return {"id": oid, "owner": owner, "viewer": viewer, "member": member}


def _base(org) -> str:  # noqa: ANN001
    return f"/api/v1/orgs/{org['id']}/assessment"


def _answer_all(client, base: str, codes: list[str], value: str) -> None:  # noqa: ANN001
    for code in codes:
        body = {"value": value, "justification": "n/a" if value == "nao_se_aplica" else None}
        r = client.put(f"{base}/answers/{code}", json=body)
        assert r.status_code == 200, r.text


def test_template_is_seeded_and_state_none(org) -> None:  # noqa: ANN001
    s = org["owner"].get(_base(org)).json()
    assert s["status"] == "none"
    assert s["template"]["code"] == "lgpd-smb" and s["template"]["version"] == 1
    assert s["template"]["verified"] is False  # no legal basis shown until verified
    assert s["short_mode_size"] == 12 and s["full_mode_size"] == 42


def test_start_short_mode_lists_only_short_questions(org) -> None:  # noqa: ANN001
    o = org["owner"]
    r = o.post(f"{_base(org)}/start", json={"mode": "short"})
    assert r.status_code == 201
    assert r.json()["status"] == "in_progress" and r.json()["progress"]["total"] == 12
    q = o.get(f"{_base(org)}/questions").json()
    codes = [x["code"] for s in q["sections"] for x in s["questions"]]
    assert sorted(codes) == sorted(SHORT_CODES)
    assert all(x["answer"] is None for s in q["sections"] for x in s["questions"])
    assert "regulatory_basis" not in str(q)  # never exposed
    # Start again is idempotent (returns the same in-progress assessment).
    assert o.post(f"{_base(org)}/start", json={"mode": "full"}).json()["mode"] == "short"


def test_viewer_cannot_answer_but_can_read(org) -> None:  # noqa: ANN001
    org["owner"].post(f"{_base(org)}/start", json={"mode": "short"})
    v = org["viewer"]
    assert v.get(_base(org)).status_code == 200
    assert v.get(f"{_base(org)}/questions").status_code == 200
    assert v.put(f"{_base(org)}/answers/DF-01", json={"value": "nao"}).status_code == 403
    assert v.post(f"{_base(org)}/complete").status_code == 403


def test_answer_rules(org) -> None:  # noqa: ANN001
    o = org["owner"]
    base = _base(org)
    assert o.put(f"{base}/answers/DF-01", json={"value": "nao"}).status_code == 409  # not started
    o.post(f"{base}/start", json={"mode": "short"})
    assert o.put(f"{base}/answers/XX-99", json={"value": "nao"}).status_code == 404
    assert o.put(f"{base}/answers/DF-01", json={"value": "talvez"}).status_code == 422
    r = o.put(f"{base}/answers/DF-01", json={"value": "nao_se_aplica"})
    assert r.status_code == 422  # justification required
    r = o.put(
        f"{base}/answers/df-01",
        json={
            "value": "nao_se_aplica",
            "justification": "Não tratamos dados pessoais de terceiros",
        },
    )
    assert r.status_code == 200  # code is case-insensitive
    # Overwrite keeps a single response per question; progress counts once.
    assert o.put(f"{base}/answers/DF-01", json={"value": "parcial"}).status_code == 200
    p = o.get(base).json()["progress"]
    assert p["answered"] == 1 and p["not_applicable"] == 0
    # Member may answer too (CONTRIBUTORS).
    assert org["member"].put(f"{base}/answers/AA-01", json={"value": "nao_sei"}).status_code == 200
    assert o.get(base).json()["progress"]["uncertain"] == 1


def test_complete_requires_all_answers_then_derives_risks(org) -> None:  # noqa: ANN001
    o, base = org["owner"], _base(org)
    o.post(f"{base}/start", json={"mode": "short"})
    r = o.post(f"{base}/complete")
    assert r.status_code == 422 and "unanswered" in r.json()["message"]
    # Mixed answers to exercise the matrix. DF-01 (I=4) nao → critico; DF-04 (I=4) parcial → alto;
    # AA-01 (I=4) nao_sei → alto + uncertain; SE-03 (I=3) nao → alto; PE-02 (I=3) parcial → medio;
    # the rest sim / nao_se_aplica → no risk.
    answers = {
        "DF-01": "nao",
        "DF-04": "parcial",
        "AA-01": "nao_sei",
        "SE-03": "nao",
        "PE-02": "parcial",
    }
    for code in SHORT_CODES:
        value = answers.get(code, "sim")
        body = {"value": value}
        if code == "FT-03":
            body = {
                "value": "nao_se_aplica",
                "justification": "Toda a infraestrutura está no Brasil",
            }
        assert o.put(f"{base}/answers/{code}", json=body).status_code == 200
    r = o.post(f"{base}/complete")
    assert r.status_code == 200, r.text
    out = r.json()
    assert out["created"] == 5 and out["updated"] == 0 and out["sent_to_review"] == 0
    assert out["by_severity"] == {"critico": 1, "alto": 3, "medio": 1}
    assert o.get(base).json()["status"] == "completed"
    result = o.get(f"{base}/result").json()
    assert result["open_by_severity"] == {"critico": 1, "alto": 3, "medio": 1}
    assert result["uncertain"] == 1 and result["in_review"] == 0
    risks = {x["origin_question_code"]: x for x in result["risks"]}
    assert risks["DF-01"]["severity"] == "critico" and risks["DF-01"]["source"] == "assessment"
    assert risks["DF-01"]["suggested_action"].startswith("Levantar os dados pessoais")
    assert "sua resposta: Não" in risks["DF-01"]["description"]
    assert (
        risks["AA-01"]["answer_uncertain"] is True and risks["DF-04"]["answer_uncertain"] is False
    )
    # Cannot answer or complete again while completed.
    assert o.put(f"{base}/answers/DF-01", json={"value": "sim"}).status_code == 409
    assert o.post(f"{base}/complete").status_code == 409
    assert o.post(f"{base}/start", json={"mode": "full"}).status_code == 409


def test_reassessment_updates_never_duplicates_and_sim_sends_to_review(org) -> None:  # noqa: ANN001
    o, base = org["owner"], _base(org)
    oid = org["id"]
    o.post(f"{base}/start", json={"mode": "short"})
    _answer_all(o, base, SHORT_CODES, "nao")
    assert o.post(f"{base}/complete").json()["created"] == 12
    before = o.get(f"/api/v1/orgs/{oid}/risks", params={"limit": 50}).json()["total"]
    assert before == 12

    # Reopen, improve two answers, keep the rest, complete again.
    r = o.post(f"{base}/reopen", json={})
    assert r.status_code == 200 and r.json()["status"] == "in_progress"
    assert o.put(f"{base}/answers/DF-01", json={"value": "sim"}).status_code == 200
    assert o.put(f"{base}/answers/DF-04", json={"value": "parcial"}).status_code == 200
    out = o.post(f"{base}/complete").json()
    assert out["created"] == 0 and out["updated"] == 11 and out["sent_to_review"] == 1
    after = o.get(f"/api/v1/orgs/{oid}/risks", params={"limit": 50}).json()
    assert after["total"] == 12  # no duplicates
    by_code = {x["origin_question_code"]: x for x in after["items"]}
    assert by_code["DF-01"]["status"] == "em_revisao"  # "sim" never auto-closes
    assert o.get(f"{base}/result").json()["in_review"] == 1
    assert by_code["DF-04"]["severity"] == "alto" and by_code["DF-04"]["probability"] == 2

    # A manually edited risk keeps its manual probability on re-derivation.
    o.patch(f"/api/v1/orgs/{oid}/risks/{by_code['AA-01']['id']}", json={"probability": 1})
    o.post(f"{base}/reopen", json={})
    o.post(f"{base}/complete")
    again = {
        x["origin_question_code"]: x
        for x in o.get(f"/api/v1/orgs/{oid}/risks", params={"limit": 50}).json()["items"]
    }
    assert again["AA-01"]["probability"] == 1 and again["AA-01"]["severity"] == "medio"


def test_short_to_full_continuation_keeps_answers(org) -> None:  # noqa: ANN001
    o, base = org["owner"], _base(org)
    o.post(f"{base}/start", json={"mode": "short"})
    _answer_all(o, base, SHORT_CODES, "parcial")
    o.post(f"{base}/complete")
    r = o.post(f"{base}/reopen", json={"mode": "full"})
    assert r.json()["mode"] == "full"
    p = r.json()["progress"]
    assert p["total"] == 42 and p["answered"] == 12
    assert len(p["sections"]) == 7 and sum(s["total"] for s in p["sections"]) == 42
    r = o.post(f"{base}/complete")
    assert r.status_code == 422  # 30 still unanswered


def test_audit_trail_for_assessment(org) -> None:  # noqa: ANN001
    o, base = org["owner"], _base(org)
    o.post(f"{base}/start", json={"mode": "short"})
    _answer_all(o, base, SHORT_CODES, "sim")
    o.post(f"{base}/complete")
    actions = [
        e["action"]
        for e in o.get(f"/api/v1/orgs/{org['id']}/audit-log", params={"limit": 50}).json()["items"]
    ]
    assert "assessment.started" in actions and "assessment.completed" in actions
    assert actions.count("assessment.answered") == 12


def test_audit_entries_of_one_request_keep_their_order(org) -> None:  # noqa: ANN001
    """Completing writes many entries in one transaction; the feed must still show the
    completion first and the derived risks in question order (application-side timestamps)."""
    o, base = org["owner"], _base(org)
    o.post(f"{base}/start", json={"mode": "short"})
    _answer_all(o, base, SHORT_CODES, "nao")
    o.post(f"{base}/complete")
    items = o.get(f"/api/v1/orgs/{org['id']}/audit-log", params={"limit": 50}).json()["items"]
    assert items[0]["action"] == "assessment.completed"
    created = [e["data"]["question"] for e in items if e["action"] == "risk.created"]
    assert created == list(reversed(SHORT_CODES))
    stamps = [e["created_at"] for e in items]
    assert stamps == sorted(stamps, reverse=True) and len(set(stamps)) == len(stamps)
