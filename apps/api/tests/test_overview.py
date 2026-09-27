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
        "by_category": [],
    }
    assert out["actions"] == {
        "pending": 0,
        "overdue": 0,
        "blocked": 0,
        "done": 0,
        "items": [],
        "recent": [],
    }
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


def _status(org, kind: str, item: dict, *steps: str) -> None:  # noqa: ANN001
    for step in steps:
        r = org["owner"].post(
            f"/api/v1/orgs/{org['id']}/{kind}/{item['id']}/status", json={"status": step}
        )
        assert r.status_code == 200, r.text


def test_open_risks_by_category(org) -> None:  # noqa: ANN001
    _risk(org, "Acesso crítico", 3, 4, category="acesso")
    _risk(org, "Acesso médio", 2, 3, category="acesso")
    _risk(org, "Dados crítico", 3, 4, category="dados")
    _risk(org, "Fornecedor alto", 3, 3, category="fornecedores")
    _status(org, "risks", _risk(org, "Fornecedor aceito", 3, 4, category="fornecedores"), "aceito")
    _risk(org, "Segurança alta", 3, 3, category="seguranca")
    _status(org, "risks", _risk(org, "Pessoas aceito", 1, 1, category="pessoas"), "aceito")
    resolved = _risk(org, "Documentação resolvida", 3, 4, category="documentacao")
    _status(org, "risks", resolved, "em_andamento", "em_revisao", "resolvido")
    # em_revisao is still open (same definition as the counters and the score).
    _status(
        org,
        "risks",
        _risk(org, "Titulares em revisão", 2, 2, category="titulares"),
        "em_andamento",
        "em_revisao",
    )
    for n in range(3):
        _risk(org, f"Incidente baixo {n}", 1, 2, category="incidentes")

    out = org["owner"].get(f"/api/v1/orgs/{org['id']}/overview").json()
    by_category = out["risks"]["by_category"]
    # Worst severity present first, then more open risks, then the category value; categories
    # with only closed risks (aceito, resolvido) are absent.
    assert [(c["category"], c["open"]) for c in by_category] == [
        ("acesso", 2),
        ("dados", 1),
        ("fornecedores", 1),
        ("seguranca", 1),
        ("titulares", 1),
        ("incidentes", 3),
    ]
    assert by_category[0]["by_severity"] == {"critico": 1, "alto": 0, "medio": 1, "baixo": 0}
    assert by_category[2]["by_severity"] == {"critico": 0, "alto": 1, "medio": 0, "baixo": 0}
    assert by_category[-1]["by_severity"] == {"critico": 0, "alto": 0, "medio": 0, "baixo": 3}
    assert sum(c["open"] for c in by_category) == out["risks"]["open"] == 9
    # Viewers read the same aggregate.
    viewer = org["viewer"].get(f"/api/v1/orgs/{org['id']}/overview").json()
    assert viewer["risks"]["by_category"] == by_category


def test_recent_actions_any_status_most_recently_updated_first(org) -> None:  # noqa: ANN001
    actions = [_action(org, f"Ação {n}") for n in range(1, 7)]
    a1, a2 = actions[0], actions[1]
    r = org["owner"].patch(
        f"/api/v1/orgs/{org['id']}/actions/{a1['id']}", json={"title": "Ação 1 revisada"}
    )
    assert r.status_code == 200, r.text
    _status(org, "actions", a2, "em_andamento", "concluida")

    out = org["owner"].get(f"/api/v1/orgs/{org['id']}/overview").json()
    recent = out["actions"]["recent"]
    # Last touched first; a concluded action is included; five at most.
    assert [a["id"] for a in recent] == [
        a2["id"],
        a1["id"],
        actions[5]["id"],
        actions[4]["id"],
        actions[3]["id"],
    ]
    assert recent[0]["status"] == "concluida" and recent[1]["title"] == "Ação 1 revisada"
    stamps = [a["updated_at"] for a in recent]
    assert stamps == sorted(stamps, reverse=True)
    # `items` keeps its meaning (pending only).
    assert a2["id"] not in {a["id"] for a in out["actions"]["items"]}


def test_new_overview_fields_are_organization_scoped(org) -> None:  # noqa: ANN001
    _risk(org, "Risco de A", 3, 4, category="acesso")
    mine = _action(org, "Ação de A")
    other = make_client()
    other_org = signup(other, email="owner@outra.com.br", org="Outra Ltda.")["org_id"]
    r = other.post(
        f"/api/v1/orgs/{other_org}/risks",
        json={"title": "Risco de B", "category": "documentacao", "probability": 3, "impact": 4},
    )
    assert r.status_code == 201, r.text
    theirs = other.post(f"/api/v1/orgs/{other_org}/actions", json={"title": "Ação de B"}).json()

    out = org["owner"].get(f"/api/v1/orgs/{org['id']}/overview").json()
    assert [c["category"] for c in out["risks"]["by_category"]] == ["acesso"]
    assert [a["id"] for a in out["actions"]["recent"]] == [mine["id"]]
    b = other.get(f"/api/v1/orgs/{other_org}/overview").json()
    assert [c["category"] for c in b["risks"]["by_category"]] == ["documentacao"]
    assert [a["id"] for a in b["actions"]["recent"]] == [theirs["id"]]
