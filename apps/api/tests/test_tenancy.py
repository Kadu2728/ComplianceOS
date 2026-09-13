"""Cross-tenant isolation (Diagnostic §7): a member of organization A must get 404 — never data,
never 403 — for every organization-scoped route of organization B. This file is the fixture every
future tenant-owned resource must extend (add its routes to ROUTES)."""

import uuid

import pytest
from fastapi.testclient import TestClient

from tests.conftest import invite_and_accept, make_client, signup

# (method, path template, json body). {org} and {member} are substituted with B's ids.
ROUTES = [
    ("GET", "/api/v1/orgs/{org}", None),
    ("PATCH", "/api/v1/orgs/{org}", {"name": "Hacked"}),
    ("GET", "/api/v1/orgs/{org}/members", None),
    ("POST", "/api/v1/orgs/{org}/members/invitations", {"email": "x@x.com", "role": "viewer"}),
    ("GET", "/api/v1/orgs/{org}/members/invitations", None),
    ("DELETE", "/api/v1/orgs/{org}/members/invitations/{invitation}", None),
    ("PATCH", "/api/v1/orgs/{org}/members/{member}", {"role": "viewer"}),
    ("DELETE", "/api/v1/orgs/{org}/members/{member}", None),
    ("GET", "/api/v1/orgs/{org}/audit-log", None),
    # Phase 3 — core domain
    ("GET", "/api/v1/orgs/{org}/risks", None),
    (
        "POST",
        "/api/v1/orgs/{org}/risks",
        {"title": "Injected", "category": "dados", "probability": 3, "impact": 4},
    ),
    ("GET", "/api/v1/orgs/{org}/risks/{risk}", None),
    ("PATCH", "/api/v1/orgs/{org}/risks/{risk}", {"title": "Hacked"}),
    ("POST", "/api/v1/orgs/{org}/risks/{risk}/status", {"status": "aceito"}),
    ("GET", "/api/v1/orgs/{org}/risks/{risk}/actions", None),
    ("GET", "/api/v1/orgs/{org}/actions", None),
    ("POST", "/api/v1/orgs/{org}/actions", {"title": "Injected action", "risk_id": "{risk}"}),
    ("GET", "/api/v1/orgs/{org}/actions/{action}", None),
    ("PATCH", "/api/v1/orgs/{org}/actions/{action}", {"title": "Hacked"}),
    ("POST", "/api/v1/orgs/{org}/actions/{action}/status", {"status": "em_andamento"}),
    ("GET", "/api/v1/orgs/{org}/evidence?risk_id={risk}", None),
    ("POST", "/api/v1/orgs/{org}/evidence", {"kind": "note", "risk_id": "{risk}", "note": "x"}),
    ("GET", "/api/v1/orgs/{org}/evidence/{evidence}/download", None),
    ("DELETE", "/api/v1/orgs/{org}/evidence/{evidence}", None),
    # Phase 4 — assessment
    ("GET", "/api/v1/orgs/{org}/assessment", None),
    ("POST", "/api/v1/orgs/{org}/assessment/start", {"mode": "short"}),
    ("GET", "/api/v1/orgs/{org}/assessment/questions", None),
    ("PUT", "/api/v1/orgs/{org}/assessment/answers/DF-01", {"value": "nao"}),
    ("POST", "/api/v1/orgs/{org}/assessment/complete", None),
    ("POST", "/api/v1/orgs/{org}/assessment/reopen", {}),
    ("GET", "/api/v1/orgs/{org}/assessment/result", None),
    # Phase 5 — score
    ("GET", "/api/v1/orgs/{org}/score", None),
    ("GET", "/api/v1/orgs/{org}/score/history", None),
    # Phase 6 — overview
    ("GET", "/api/v1/orgs/{org}/overview", None),
    # Phase 7 — documents
    ("GET", "/api/v1/orgs/{org}/documents", None),
    ("POST", "/api/v1/orgs/{org}/documents", {"name": "Injected", "category": "outro"}),
    ("GET", "/api/v1/orgs/{org}/documents/{document}", None),
    ("PATCH", "/api/v1/orgs/{org}/documents/{document}", {"name": "Hacked"}),
    ("GET", "/api/v1/orgs/{org}/documents/{document}/download", None),
    ("DELETE", "/api/v1/orgs/{org}/documents/{document}", None),
    (
        "POST",
        "/api/v1/orgs/{org}/evidence",
        {"kind": "document", "risk_id": "{risk}", "document_id": "{document}"},
    ),
]


@pytest.fixture
def two_orgs(emails):  # noqa: ANN001, ANN201
    a = make_client()
    a_info = signup(a, email="owner-a@a.com", org="Org A")
    b = make_client()
    b_info = signup(b, email="owner-b@b.com", org="Org B")
    b_member = invite_and_accept(b, b_info["org_id"], emails, email="viewer-b@b.com", role="viewer")
    b_member_id = [
        m for m in b.get(f"/api/v1/orgs/{b_info['org_id']}/members").json() if m["role"] == "viewer"
    ][0]["id"]
    org_b = b_info["org_id"]
    risk = b.post(
        f"/api/v1/orgs/{org_b}/risks",
        json={"title": "Risco de B", "category": "acesso", "probability": 3, "impact": 4},
    ).json()
    action = b.post(
        f"/api/v1/orgs/{org_b}/actions", json={"title": "Ação de B", "risk_id": risk["id"]}
    ).json()
    evidence = b.post(
        f"/api/v1/orgs/{org_b}/evidence", json={"kind": "note", "risk_id": risk["id"], "note": "n"}
    ).json()
    document = b.post(
        f"/api/v1/orgs/{org_b}/documents", json={"name": "Documento de B", "category": "politica"}
    ).json()
    invitation = b.post(
        f"/api/v1/orgs/{org_b}/members/invitations",
        json={"email": "pending@b.com", "role": "member"},
    ).json()
    return {
        "b_document": document["id"],
        "b_invitation": invitation["id"],
        "a": a,
        "a_org": a_info["org_id"],
        "b": b,
        "b_org": org_b,
        "b_member": b_member_id,
        "b_member_client": b_member,
        "b_risk": risk["id"],
        "b_action": action["id"],
        "b_evidence": evidence["id"],
    }


@pytest.mark.parametrize(
    ("method", "template", "body"), ROUTES, ids=[f"{m} {t}" for m, t, _ in ROUTES]
)
def test_member_of_a_cannot_touch_b(two_orgs, method: str, template: str, body) -> None:  # noqa: ANN001
    a: TestClient = two_orgs["a"]
    ids = {
        "org": two_orgs["b_org"],
        "member": two_orgs["b_member"],
        "risk": two_orgs["b_risk"],
        "action": two_orgs["b_action"],
        "evidence": two_orgs["b_evidence"],
        "document": two_orgs["b_document"],
        "invitation": two_orgs["b_invitation"],
    }
    path = template.format(**ids)
    body = (
        {k: (v.format(**ids) if isinstance(v, str) else v) for k, v in body.items()}
        if body
        else None
    )
    r = a.request(method, path, json=body)
    assert r.status_code == 404, f"{method} {path} -> {r.status_code} {r.text}"
    assert r.json()["code"] == "not_found"
    # Nothing changed on B.
    b: TestClient = two_orgs["b"]
    assert b.get(f"/api/v1/orgs/{two_orgs['b_org']}").json()["name"] == "Org B"
    assert len(b.get(f"/api/v1/orgs/{two_orgs['b_org']}/members").json()) == 2


@pytest.mark.parametrize(
    ("method", "template", "body"), ROUTES, ids=[f"{m} {t}" for m, t, _ in ROUTES]
)
def test_unknown_org_is_404_not_403(two_orgs, method: str, template: str, body) -> None:  # noqa: ANN001
    a: TestClient = two_orgs["a"]
    ids = {
        k: uuid.uuid4()
        for k in ("org", "member", "risk", "action", "evidence", "document", "invitation")
    }
    path = template.format(**ids)
    body = (
        {k: (v.format(**ids) if isinstance(v, str) else v) for k, v in body.items()}
        if body
        else None
    )
    assert a.request(method, path, json=body).status_code == 404


def test_audit_log_is_tenant_scoped(two_orgs) -> None:  # noqa: ANN001
    a, b = two_orgs["a"], two_orgs["b"]
    a.patch(f"/api/v1/orgs/{two_orgs['a_org']}", json={"name": "Org A renamed"})
    b_log = b.get(f"/api/v1/orgs/{two_orgs['b_org']}/audit-log").json()
    assert all(e["action"] != "organization.updated" for e in b_log["items"])
    a_log = a.get(f"/api/v1/orgs/{two_orgs['a_org']}/audit-log").json()
    assert any(e["action"] == "organization.updated" for e in a_log["items"])


def test_me_lists_only_own_memberships(two_orgs) -> None:  # noqa: ANN001
    me = two_orgs["a"].get("/api/v1/me").json()
    assert [m["organization"]["id"] for m in me["memberships"]] == [two_orgs["a_org"]]
