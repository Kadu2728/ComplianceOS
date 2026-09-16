"""Risk-to-Action engine (D29): recommendation, one-click plan, idempotency, catalogue integrity."""

import json
from pathlib import Path

import pytest

from app.services.recommend import CATALOGUE_PATH, catalogue
from tests.conftest import invite_and_accept, make_client, signup

ASSESSMENT = Path(__file__).resolve().parents[1] / "app" / "content" / "assessment_v1.json"
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


def test_catalogue_covers_every_question_exactly_once() -> None:
    codes = [q["code"] for q in json.loads(ASSESSMENT.read_text(encoding="utf-8"))["questions"]]
    seen: list[str] = []
    for c in catalogue().values():
        seen += list(c.questions)
    assert sorted(seen) == sorted(codes), "each question maps to one catalogue control"
    cats = {c.category for c in catalogue().values() if c.category_default}
    assert cats == {
        "dados",
        "acesso",
        "seguranca",
        "fornecedores",
        "documentacao",
        "titulares",
        "incidentes",
        "pessoas",
    }
    raw = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    assert raw["last_verified"] is None  # same human-review gate as the assessment content


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    ids = {m["role"]: m["id"] for m in owner.get(f"/api/v1/orgs/{oid}/members").json()}
    base = f"/api/v1/orgs/{oid}/assessment"
    owner.post(f"{base}/start", json={"mode": "short"})
    for code in SHORT:
        owner.put(f"{base}/answers/{code}", json={"value": "nao" if code == "AA-03" else "sim"})
    owner.post(f"{base}/complete")
    risks = owner.get(f"/api/v1/orgs/{oid}/risks").json()["items"]
    mfa = next(r for r in risks if r["origin_question_code"] == "AA-03")
    return {"id": oid, "owner": owner, "member": member, "viewer": viewer, "ids": ids, "mfa": mfa}


def test_recommendation_then_plan_builds_the_graph(org) -> None:  # noqa: ANN001
    o, oid, mfa = org["owner"], org["id"], org["mfa"]
    rec = o.get(f"/api/v1/orgs/{oid}/risks/{mfa['id']}/recommendation").json()
    assert rec["planned"] is False and rec["linked_controls"] == []
    assert rec["control"]["code"] == "CTL-AA-MFA" and rec["control"]["exists"] is False
    assert rec["action_title"] == mfa["suggested_action"]
    assert rec["severity"] == "critico" and "pergunta AA-03" in rec["basis"]

    r = o.post(
        f"/api/v1/orgs/{oid}/risks/{mfa['id']}/plan",
        json={"owner_membership_id": org["ids"]["member"]},
    )
    assert r.status_code == 201, r.text
    plan = r.json()
    assert plan["control"]["template_code"] == "CTL-AA-MFA"
    assert plan["control"]["status"] == "planejado"
    assert plan["action"]["risk_id"] == mfa["id"]
    assert plan["action"]["control_id"] == plan["control"]["id"]
    assert plan["action"]["owner"]["membership_id"] == org["ids"]["member"]
    assert plan["action"]["due_date"] is not None  # 15 days for a critical risk

    rec = o.get(f"/api/v1/orgs/{oid}/risks/{mfa['id']}/recommendation").json()
    assert rec["planned"] is True and rec["existing_action"]["id"] == plan["action"]["id"]
    assert rec["control"]["exists"] is True and rec["control"]["already_linked"] is True
    # Idempotent while the action is open.
    assert o.post(f"/api/v1/orgs/{oid}/risks/{mfa['id']}/plan", json={}).status_code == 409
    # Audited as one event on the risk, plus the control and action events.
    names = [e["action"] for e in o.get(f"/api/v1/orgs/{oid}/audit-log?limit=20").json()["items"]]
    assert "risk.planned" in names and "control.created" in names and "action.created" in names

    # A manual risk of the same category reuses the organization's existing control.
    manual = o.post(
        f"/api/v1/orgs/{oid}/risks",
        json={
            "title": "Contas compartilhadas no CRM",
            "category": "acesso",
            "probability": 2,
            "impact": 3,
        },
    ).json()
    rec = o.get(f"/api/v1/orgs/{oid}/risks/{manual['id']}/recommendation").json()
    assert rec["control"]["code"] == "CTL-AA-ACESSO-MINIMO" and "categoria" in rec["basis"]
    r = o.post(
        f"/api/v1/orgs/{oid}/risks/{manual['id']}/plan",
        json={"title": "Criar contas individuais no CRM"},
    )
    assert r.status_code == 201 and r.json()["action"]["title"] == "Criar contas individuais no CRM"
    assert o.get(f"/api/v1/orgs/{oid}/controls").json()["total"] == 2


def test_plan_roles(org) -> None:  # noqa: ANN001
    oid, mfa = org["id"], org["mfa"]
    v, m = org["viewer"], org["member"]
    assert v.get(f"/api/v1/orgs/{oid}/risks/{mfa['id']}/recommendation").status_code == 200
    assert v.post(f"/api/v1/orgs/{oid}/risks/{mfa['id']}/plan", json={}).status_code == 403
    assert m.post(f"/api/v1/orgs/{oid}/risks/{mfa['id']}/plan", json={}).status_code == 403
