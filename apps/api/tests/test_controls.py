"""Control Graph (D27) and organization profile (D28): CRUD, roles, edges, evidence rule."""

import pytest

from tests.conftest import invite_and_accept, make_client, signup


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    ids = {m["role"]: m["id"] for m in owner.get(f"/api/v1/orgs/{oid}/members").json()}
    risk = owner.post(
        f"/api/v1/orgs/{oid}/risks",
        json={
            "title": "Sistemas críticos sem MFA",
            "category": "acesso",
            "probability": 3,
            "impact": 4,
        },
    ).json()
    return {"id": oid, "owner": owner, "member": member, "viewer": viewer, "ids": ids, "risk": risk}


def _control(client, oid: str, **extra) -> dict:  # noqa: ANN001, ANN003
    body = {"title": "Autenticação multifator", "category": "acesso", **extra}
    r = client.post(f"/api/v1/orgs/{oid}/controls", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def test_control_lifecycle_and_graph(org) -> None:  # noqa: ANN001
    o, oid, risk = org["owner"], org["id"], org["risk"]
    c = _control(o, oid, risk_id=risk["id"], owner_membership_id=org["ids"]["member"])
    assert (
        c["status"] == "planejado" and c["kind"] == "preventivo" and c["owner"]["name"] == "Bruno"
    )

    # Linked on creation; visible from both sides.
    assert [x["id"] for x in o.get(f"/api/v1/orgs/{oid}/risks/{risk['id']}/controls").json()] == [
        c["id"]
    ]
    graph = o.get(f"/api/v1/orgs/{oid}/controls/{c['id']}").json()
    assert [r["id"] for r in graph["risks"]] == [risk["id"]] and graph["evidence_count"] == 0

    # An action implements the control; evidence proves it (with validity).
    a = o.post(
        f"/api/v1/orgs/{oid}/actions",
        json={
            "title": "Ativar MFA no e-mail",
            "risk_id": risk["id"],
            "control_id": c["id"],
            "effort": "baixo",
        },
    )
    assert (
        a.status_code == 201 and a.json()["control_id"] == c["id"] and a.json()["effort"] == "baixo"
    )
    ev = o.post(
        f"/api/v1/orgs/{oid}/evidence",
        json={
            "kind": "note",
            "control_id": c["id"],
            "note": "Captura da política de MFA",
            "valid_until": "2099-01-01",
        },
    )
    assert ev.status_code == 201 and ev.json()["validity"] == "vigente"
    graph = o.get(f"/api/v1/orgs/{oid}/controls/{c['id']}").json()
    assert len(graph["actions"]) == 1 and graph["evidence_count"] == 1
    assert (
        o.get(f"/api/v1/orgs/{oid}/evidence?control_id={c['id']}").json()[0]["id"]
        == ev.json()["id"]
    )

    # Maturity ladder: implementado, then verificado (allowed because evidence exists).
    assert (
        o.patch(
            f"/api/v1/orgs/{oid}/controls/{c['id']}", json={"status": "implementado"}
        ).status_code
        == 200
    )
    r = o.patch(f"/api/v1/orgs/{oid}/controls/{c['id']}", json={"status": "verificado"})
    assert r.status_code == 200 and r.json()["status"] == "verificado"

    # Unlink and relink are idempotent and audited.
    assert (
        o.delete(f"/api/v1/orgs/{oid}/controls/{c['id']}/risks/{risk['id']}").json()["linked"]
        is False
    )
    assert o.get(f"/api/v1/orgs/{oid}/risks/{risk['id']}/controls").json() == []
    assert (
        o.post(f"/api/v1/orgs/{oid}/controls/{c['id']}/risks/{risk['id']}").json()["linked"] is True
    )
    assert o.post(f"/api/v1/orgs/{oid}/controls/{c['id']}/risks/{risk['id']}").status_code == 200
    actions = [e["action"] for e in o.get(f"/api/v1/orgs/{oid}/audit-log?limit=50").json()["items"]]
    for name in ("control.created", "control.linked", "control.unlinked", "control.updated"):
        assert name in actions

    # Delete: refused while proof hangs only off the control; afterwards the action survives
    # with control_id cleared.
    assert o.delete(f"/api/v1/orgs/{oid}/controls/{c['id']}").status_code == 409
    assert o.delete(f"/api/v1/orgs/{oid}/evidence/{ev.json()['id']}").status_code == 200
    assert o.delete(f"/api/v1/orgs/{oid}/controls/{c['id']}").status_code == 200
    assert o.get(f"/api/v1/orgs/{oid}/controls/{c['id']}").status_code == 404
    assert o.get(f"/api/v1/orgs/{oid}/actions/{a.json()['id']}").json()["control_id"] is None


def test_verified_requires_evidence_and_roles(org) -> None:  # noqa: ANN001
    o, m, v, oid = org["owner"], org["member"], org["viewer"], org["id"]
    r = o.post(
        f"/api/v1/orgs/{oid}/controls",
        json={"title": "Backup testado", "category": "seguranca", "status": "verificado"},
    )
    assert r.status_code == 409
    c = _control(o, oid, owner_membership_id=org["ids"]["member"])
    r = o.patch(f"/api/v1/orgs/{oid}/controls/{c['id']}", json={"status": "verificado"})
    assert r.status_code == 409 and "evidence" in r.json()["message"]

    # Member: cannot create or link; can edit the assigned control but not reassign it.
    assert (
        m.post(
            f"/api/v1/orgs/{oid}/controls", json={"title": "Controle X", "category": "dados"}
        ).status_code
        == 403
    )
    assert (
        m.post(f"/api/v1/orgs/{oid}/controls/{c['id']}/risks/{org['risk']['id']}").status_code
        == 403
    )
    assert (
        m.patch(f"/api/v1/orgs/{oid}/controls/{c['id']}", json={"status": "parcial"}).status_code
        == 200
    )
    assert (
        m.patch(
            f"/api/v1/orgs/{oid}/controls/{c['id']}",
            json={"owner_membership_id": org["ids"]["owner"]},
        ).status_code
        == 403
    )
    other = _control(o, oid, title="Outro controle")
    assert (
        m.patch(
            f"/api/v1/orgs/{oid}/controls/{other['id']}", json={"status": "parcial"}
        ).status_code
        == 403
    )
    # Viewer: read only.
    assert v.get(f"/api/v1/orgs/{oid}/controls").json()["total"] == 2
    assert (
        v.patch(f"/api/v1/orgs/{oid}/controls/{c['id']}", json={"status": "parcial"}).status_code
        == 403
    )
    assert v.delete(f"/api/v1/orgs/{oid}/controls/{c['id']}").status_code == 403


def test_control_links_are_validated_within_the_tenant(org, emails) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    other = make_client()
    other_org = signup(other, email="owner@beta.com.br", org="Beta")["org_id"]
    foreign = _control(other, other_org)
    foreign_doc = other.post(
        f"/api/v1/orgs/{other_org}/documents",
        json={"name": "Política da Beta", "category": "politica"},
    ).json()
    # A control of another organization is never accepted as a link target: 422, not 404 leak.
    r = o.post(f"/api/v1/orgs/{oid}/actions", json={"title": "Ação", "control_id": foreign["id"]})
    assert r.status_code == 422
    r = o.post(
        f"/api/v1/orgs/{oid}/evidence",
        json={"kind": "note", "control_id": foreign["id"], "note": "x"},
    )
    assert r.status_code == 422
    r = o.post(
        f"/api/v1/orgs/{oid}/controls",
        json={"title": "C", "category": "dados", "document_id": foreign_doc["id"]},
    )
    assert r.status_code == 422
    assert (
        o.post(f"/api/v1/orgs/{oid}/controls/{foreign['id']}/risks/{org['risk']['id']}").status_code
        == 404
    )


def test_list_filters_and_order(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    _control(o, oid, title="Zeta implementado", status="implementado")
    _control(o, oid, title="Alfa planejado")
    _control(
        o, oid, title="Beta parcial", status="parcial", category="dados", risk_id=org["risk"]["id"]
    )
    page = o.get(f"/api/v1/orgs/{oid}/controls").json()
    assert [c["title"] for c in page["items"]] == [
        "Alfa planejado",
        "Beta parcial",
        "Zeta implementado",
    ]
    assert o.get(f"/api/v1/orgs/{oid}/controls?status=parcial").json()["total"] == 1
    assert o.get(f"/api/v1/orgs/{oid}/controls?category=dados").json()["total"] == 1
    assert o.get(f"/api/v1/orgs/{oid}/controls?risk_id={org['risk']['id']}").json()["total"] == 1


def test_profile_read_update_and_roles(org) -> None:  # noqa: ANN001
    o, m, v, oid = org["owner"], org["member"], org["viewer"], org["id"]
    p = v.get(f"/api/v1/orgs/{oid}/profile").json()
    assert p["complete"] is False and p["data_categories"] == [] and p["segment"] is None
    r = o.put(
        f"/api/v1/orgs/{oid}/profile",
        json={
            "segment": "software_saas",
            "headcount_band": "de_50_a_199",
            "customer_type": "b2b",
            "data_categories": ["cadastrais", "saude", "cadastrais"],
            "sells_to_enterprise": True,
            "international_transfers": "nao_sei",
            "systems": [" CRM ", "ERP", "crm"],
            "processes": ["Onboarding de clientes"],
        },
    )
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["complete"] is True and p["data_categories"] == ["cadastrais", "saude"]
    assert p["systems"] == ["CRM", "ERP"]  # trimmed and deduplicated case-insensitively
    assert m.put(f"/api/v1/orgs/{oid}/profile", json={"notes": "x"}).status_code == 403
    assert v.put(f"/api/v1/orgs/{oid}/profile", json={"notes": "x"}).status_code == 403
    r = o.put(f"/api/v1/orgs/{oid}/profile", json={"systems": [f"s{i}" for i in range(21)]})
    assert r.status_code == 422
    r = o.put(f"/api/v1/orgs/{oid}/profile", json={"segment": "banco"})
    assert r.status_code == 422
    entries = o.get(f"/api/v1/orgs/{oid}/audit-log").json()["items"]
    assert entries[0]["action"] == "profile.updated" and "segment" in entries[0]["data"]
