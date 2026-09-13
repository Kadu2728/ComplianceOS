"""Visão geral aggregate + enriched audit log: counts, ordering, role gating, empty state."""

from datetime import date, timedelta

import pytest

from tests.conftest import invite_and_accept, make_client, signup


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br", name="Ana Souza")["org_id"]
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    members = owner.get(f"/api/v1/orgs/{oid}/members").json()
    owner_membership = next(m["id"] for m in members if m["role"] == "owner")
    return {"id": oid, "owner": owner, "viewer": viewer, "owner_membership": owner_membership}


def _risk(org, title: str, p: int, i: int, **extra) -> dict:  # noqa: ANN001, ANN003
    r = org["owner"].post(
        f"/api/v1/orgs/{org['id']}/risks",
        json={"title": title, "category": "acesso", "probability": p, "impact": i, **extra},
    )
    assert r.status_code == 201, r.text
    return r.json()


def _action(org, title: str, **extra) -> dict:  # noqa: ANN001, ANN003
    r = org["owner"].post(f"/api/v1/orgs/{org['id']}/actions", json={"title": title, **extra})
    assert r.status_code == 201, r.text
    return r.json()


def test_empty_organization(org) -> None:  # noqa: ANN001
    out = org["owner"].get(f"/api/v1/orgs/{org['id']}/overview").json()
    assert out["risks"] == {
        "open": 0,
        "by_severity": {"critico": 0, "alto": 0, "medio": 0, "baixo": 0},
        "in_review": 0,
        "without_owner": 0,
        "items": [],
    }
    assert out["actions"] == {"pending": 0, "overdue": 0, "blocked": 0, "done": 0, "items": []}
    assert out["assessment"] == {
        "status": "none",
        "mode": None,
        "answered": 0,
        "total": 0,
        "completed_at": None,
    }
    # The owner already sees the organization and invitation entries (`user.signup` is a
    # user-level event without an organization, so it never appears here).
    assert {e["action"] for e in out["recent_activity"]} == {
        "organization.created",
        "membership.invited",
        "membership.accepted",
    }


def test_counts_ordering_and_role_gating(org) -> None:  # noqa: ANN001
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    soon = (date.today() + timedelta(days=3)).isoformat()
    later = (date.today() + timedelta(days=30)).isoformat()
    crit_late = _risk(org, "Crítico com prazo", 3, 4, due_date=later)
    crit_soon = _risk(org, "Crítico urgente", 3, 4, due_date=soon)
    crit_none = _risk(org, "Crítico sem prazo", 3, 4, owner_membership_id=org["owner_membership"])
    alto = _risk(org, "Alto", 3, 3)
    _risk(org, "Médio", 2, 3)
    baixo = _risk(org, "Baixo aceito", 1, 1)
    org["owner"].post(
        f"/api/v1/orgs/{org['id']}/risks/{baixo['id']}/status", json={"status": "aceito"}
    )
    org["owner"].post(
        f"/api/v1/orgs/{org['id']}/risks/{alto['id']}/status", json={"status": "em_andamento"}
    )
    org["owner"].post(
        f"/api/v1/orgs/{org['id']}/risks/{alto['id']}/status", json={"status": "em_revisao"}
    )

    a_overdue = _action(org, "Atrasada", due_date=yesterday, risk_id=crit_soon["id"])
    a_soon = _action(org, "Em breve", due_date=soon)
    a_none = _action(org, "Sem prazo")
    a_done = _action(org, "Concluída", due_date=yesterday)
    a_blocked = _action(org, "Bloqueada")
    org["owner"].post(
        f"/api/v1/orgs/{org['id']}/actions/{a_done['id']}/status", json={"status": "em_andamento"}
    )
    org["owner"].post(
        f"/api/v1/orgs/{org['id']}/actions/{a_done['id']}/status", json={"status": "concluida"}
    )
    org["owner"].post(
        f"/api/v1/orgs/{org['id']}/actions/{a_blocked['id']}/status", json={"status": "bloqueada"}
    )

    out = org["owner"].get(f"/api/v1/orgs/{org['id']}/overview").json()
    assert out["risks"]["open"] == 5 and out["risks"]["in_review"] == 1
    assert out["risks"]["by_severity"] == {"critico": 3, "alto": 1, "medio": 1, "baixo": 0}
    assert out["risks"]["without_owner"] == 4
    # Crítico before Alto; within a severity the earliest due date first, no due date last.
    assert [r["id"] for r in out["risks"]["items"]] == [
        crit_soon["id"],
        crit_late["id"],
        crit_none["id"],
        alto["id"],
    ]
    assert out["actions"]["pending"] == 4 and out["actions"]["overdue"] == 1
    assert out["actions"]["blocked"] == 1 and out["actions"]["done"] == 1
    # Earliest due date first; without a due date the most recently updated first.
    assert [a["id"] for a in out["actions"]["items"]] == [
        a_overdue["id"],
        a_soon["id"],
        a_blocked["id"],
        a_none["id"],
    ]
    # The audit log filter stays consistent with the local-day overdue rule.
    listed = (
        org["owner"].get(f"/api/v1/orgs/{org['id']}/actions", params={"overdue": "true"}).json()
    )
    assert [a["id"] for a in listed["items"]] == [a_overdue["id"]]

    # Recent activity is enriched and newest first; viewers do not get it at all.
    latest = out["recent_activity"][0]
    assert latest["action"] == "action.status_changed" and latest["actor_name"] == "Ana Souza"
    assert latest["entity_title"] == "Bloqueada" and latest["data"] == {
        "from": "a_fazer",
        "to": "bloqueada",
    }
    assert len(out["recent_activity"]) == 8
    v = org["viewer"].get(f"/api/v1/orgs/{org['id']}/overview")
    assert v.status_code == 200 and v.json()["recent_activity"] is None
    assert v.json()["risks"]["open"] == 5


def test_audit_log_page_is_enriched_and_paginated(org) -> None:  # noqa: ANN001
    risk = _risk(org, "Risco auditado", 2, 2)
    org["owner"].patch(f"/api/v1/orgs/{org['id']}/risks/{risk['id']}", json={"title": "Renomeado"})
    page = org["owner"].get(f"/api/v1/orgs/{org['id']}/audit-log", params={"limit": 2}).json()
    assert page["total"] >= 4 and page["limit"] == 2 and len(page["items"]) == 2
    first = page["items"][0]
    assert first["action"] == "risk.updated" and first["entity_title"] == "Renomeado"
    assert first["actor_name"] == "Ana Souza"
    assert first["data"] == {"title": {"from": "Risco auditado", "to": "Renomeado"}}
    assert page["items"][1]["action"] == "risk.created"
    assert org["viewer"].get(f"/api/v1/orgs/{org['id']}/audit-log").status_code == 403
