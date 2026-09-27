"""Global search: four kinds, accent/case folding, LIKE metacharacters as literals, validation,
limits and totals, roles, organization isolation, no audit entry."""

import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import literal, select

from app.api.v1.search import fold, fold_sql, like_pattern
from app.db.session import get_engine
from tests.conftest import invite_and_accept, make_client, signup

KINDS = ["risk", "action", "control", "document"]


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br", name="Ana Souza")["org_id"]
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    return {"id": oid, "owner": owner, "member": member, "viewer": viewer}


def _post(client: TestClient, oid: str, path: str, body: dict) -> dict:
    r = client.post(f"/api/v1/orgs/{oid}/{path}", json=body)
    assert r.status_code == 201, r.text
    return r.json()


def _risk(client: TestClient, oid: str, title: str, **extra) -> dict:  # noqa: ANN003
    body = {"title": title, "category": "acesso", "probability": 2, "impact": 2, **extra}
    return _post(client, oid, "risks", body)


def _action(client: TestClient, oid: str, title: str, **extra) -> dict:  # noqa: ANN003
    return _post(client, oid, "actions", {"title": title, **extra})


def _control(client: TestClient, oid: str, title: str) -> dict:
    return _post(client, oid, "controls", {"title": title, "category": "acesso"})


def _document(client: TestClient, oid: str, name: str, **extra) -> dict:  # noqa: ANN003
    return _post(client, oid, "documents", {"name": name, "category": "politica", **extra})


def _search(client: TestClient, oid: str, q: str, **params) -> dict:  # noqa: ANN003
    r = client.get(f"/api/v1/orgs/{oid}/search", params={"q": q, **params})
    assert r.status_code == 200, r.text
    return r.json()


def _group(out: dict, kind: str) -> dict:
    return next(g for g in out["groups"] if g["kind"] == kind)


def _ids(out: dict) -> set[str]:
    return {item["id"] for g in out["groups"] for item in g["items"]}


def test_pure_helpers() -> None:
    assert fold("  AÇÃO Não-Conformidade ÍNDICE  ") == "  acao nao-conformidade indice  "
    assert fold("ac\u0327a\u0303o") == "acao"  # decomposed input folds like the composed one
    assert like_pattern("50%_\\x") == "%50\\%\\_\\\\x%"


def test_sql_folding_does_not_depend_on_the_database_locale() -> None:
    """Under the "C" collation `lower()` only touches ASCII; the upper-case accented letters in the
    translate table keep the SQL side equal to the Python side on any database locale."""
    text = "AÇÃO Índice ÉTICA Ônus ÚNICO Ü à"
    with get_engine().connect() as conn:
        for value in (literal(text), literal(text).collate("C")):
            assert (
                conn.scalar(select(fold_sql(value)))
                == fold(text)
                == "acao indice etica onus unico u a"
            )


def test_matches_every_kind_with_the_dropdown_fields(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    due = (date.today() + timedelta(days=10)).isoformat()
    risk = _risk(o, oid, "Ausência de política de acesso", probability=3, impact=4)
    action = _action(o, oid, "Revisar ACESSOS de ex-colaboradores", due_date=due)
    control = _control(o, oid, "Gestão de acessos privilegiados")
    past = (date.today() - timedelta(days=1)).isoformat()
    document = _document(o, oid, "Política de Controle de Acesso", valid_until=past)
    _risk(o, oid, "Backup sem teste de restauração")  # does not match

    out = _search(o, oid, "acesso")
    assert out["query"] == "acesso" and out["total"] == 4
    assert [g["kind"] for g in out["groups"]] == KINDS
    assert _group(out, "risk") == {
        "kind": "risk",
        "total": 1,
        "items": [
            {
                "id": risk["id"],
                "title": "Ausência de política de acesso",
                "severity": "critico",
                "status": "aberto",
                "category": "acesso",
            }
        ],
    }
    assert _group(out, "action")["items"] == [
        {
            "id": action["id"],
            "title": "Revisar ACESSOS de ex-colaboradores",
            "status": "a_fazer",
            "due_date": due,
        }
    ]
    assert _group(out, "control")["items"] == [
        {"id": control["id"], "title": "Gestão de acessos privilegiados", "status": "planejado"}
    ]
    # Documents carry the derived status (validity in the past → vencido).
    assert _group(out, "document")["items"] == [
        {"id": document["id"], "title": "Política de Controle de Acesso", "status": "vencido"}
    ]


def test_accent_and_case_insensitive(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    control = _control(o, oid, "Notificação de incidentes")["id"]
    document = _document(o, oid, "Instrução sobre retenção e ação disciplinar")["id"]
    expected = {
        _risk(o, oid, "Ação corretiva pendente")["id"],
        _action(o, oid, "AÇÃO URGENTE NO FORNECEDOR")["id"],  # upper-case accented letters
        control,
        document,
    }
    decoy = _risk(o, oid, "Acesso sem revisão")["id"]  # "acao" is not a substring of "acesso"
    for q in ["acao", "ACAO", "ação", "AÇÃO", "  Ação  ", "ac\u0327a\u0303o"]:
        out = _search(o, oid, q)
        assert _ids(out) == expected, q
        assert out["total"] == 4, q
    # Both sides are folded: accent-free text finds accented titles, accented text finds either.
    assert _ids(_search(o, oid, "NOTIFICACAO")) == {control}
    assert _ids(_search(o, oid, "retencão")) == {document}
    assert _ids(_search(o, oid, "REVISÃO")) == {decoy}


def test_like_metacharacters_are_literal(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    percent = _risk(o, oid, "Cobertura de 100% dos backups")["id"]
    underscore = _risk(o, oid, "Tabela user_data sem dono")["id"]
    _risk(o, oid, "Tabela userXdata sem dono")  # would match "r_d" if "_" were a wildcard
    backslash = _risk(o, oid, "Pasta C:\\dados\\clientes aberta")["id"]
    _risk(o, oid, "Dados pessoais sem inventário")  # would match "\d" if "\" were an escape

    for q in ["%%", "__", "%_", "\\\\"]:
        out = _search(o, oid, q)
        assert out["total"] == 0 and _ids(out) == set(), q
    assert _ids(_search(o, oid, "0%")) == {percent}
    assert _ids(_search(o, oid, "r_d")) == {underscore}
    assert _ids(_search(o, oid, "\\d")) == {backslash}
    # A quote is just text (the query is a bound parameter).
    assert _search(o, oid, "' OR 1=1 --")["total"] == 0


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"q": ""},
        {"q": "a"},
        {"q": "   a   "},  # trimmed before the length check
        {"q": "x" * 101},
        {"q": "ab\x00cd"},
        {"q": "ab", "limit": 0},
        {"q": "ab", "limit": 11},
    ],
    ids=["missing", "empty", "short", "short-after-trim", "long", "nul", "limit-0", "limit-11"],
)
def test_invalid_input_is_422(org, params: dict) -> None:  # noqa: ANN001
    r = org["owner"].get(f"/api/v1/orgs/{org['id']}/search", params=params)
    assert r.status_code == 422, r.text
    assert r.json()["code"] == "validation_error"


def test_boundary_lengths_are_accepted(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    assert _search(o, oid, "ab")["query"] == "ab"
    assert _search(o, oid, "  " + "x" * 100 + "  ")["query"] == "x" * 100


def test_limit_total_and_recency_order(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    risks = [_risk(o, oid, f"Risco alfa {n}") for n in range(1, 8)]
    r = o.patch(f"/api/v1/orgs/{oid}/risks/{risks[0]['id']}", json={"title": "Risco alfa 1 rev"})
    assert r.status_code == 200, r.text

    default = _group(_search(o, oid, "alfa"), "risk")
    assert default["total"] == 7 and len(default["items"]) == 5
    # Most recently updated first: the edited one, then newest created.
    assert [i["id"] for i in default["items"]] == [
        risks[0]["id"],
        risks[6]["id"],
        risks[5]["id"],
        risks[4]["id"],
        risks[3]["id"],
    ]
    two = _search(o, oid, "alfa", limit=2)
    assert _group(two, "risk")["total"] == 7 and len(_group(two, "risk")["items"]) == 2
    assert two["total"] == 7
    ten = _group(_search(o, oid, "alfa", limit=10), "risk")
    assert len(ten["items"]) == 7


def test_no_match_returns_every_group_empty(org) -> None:  # noqa: ANN001
    _risk(org["owner"], org["id"], "Risco qualquer")
    assert _search(org["owner"], org["id"], "  inexistente  ") == {
        "query": "inexistente",
        "total": 0,
        "groups": [{"kind": k, "total": 0, "items": []} for k in KINDS],
    }


def test_every_role_reads_all_groups_and_nothing_is_audited(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    _risk(o, oid, "Contrato sem cláusula")
    _document(o, oid, "Contrato de operador")
    before = o.get(f"/api/v1/orgs/{oid}/audit-log").json()["total"]
    owner_out = _search(o, oid, "contrato")
    for role in ("member", "viewer"):
        out = _search(org[role], oid, "contrato")
        assert [g["kind"] for g in out["groups"]] == KINDS
        assert out == owner_out, role
    assert o.get(f"/api/v1/orgs/{oid}/audit-log").json()["total"] == before


def test_organization_isolation(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    mine = {
        _risk(o, oid, "Acesso de A")["id"],
        _action(o, oid, "Acesso de A")["id"],
        _control(o, oid, "Acesso de A")["id"],
        _document(o, oid, "Acesso de A")["id"],
    }
    b = make_client()
    b_org = signup(b, email="owner@outra.com.br", org="Outra Ltda.")["org_id"]
    theirs = {
        _risk(b, b_org, "Acesso de B")["id"],
        _action(b, b_org, "Acesso de B")["id"],
        _control(b, b_org, "Acesso de B")["id"],
        _document(b, b_org, "Acesso de B")["id"],
    }

    out = _search(o, oid, "acesso de")
    assert _ids(out) == mine and out["total"] == 4
    assert all(g["total"] == 1 for g in out["groups"])
    assert _ids(_search(b, b_org, "acesso de")) == theirs

    # Another organization's id or an unknown one: 404 (never 403), same envelope as elsewhere.
    for target in (b_org, str(uuid.uuid4())):
        r = o.get(f"/api/v1/orgs/{target}/search", params={"q": "acesso"})
        assert r.status_code == 404 and r.json()["code"] == "not_found"
    # Anonymous callers are rejected before anything is searched.
    anon = make_client().get(f"/api/v1/orgs/{oid}/search", params={"q": "acesso"})
    assert anon.status_code == 401


def test_search_is_rate_limited_per_membership(org) -> None:  # noqa: ANN001
    """QA 2026-09-27 P3-1: 60 searches per minute per membership, then 429 (the client says so);
    another member of the same organization keeps their own budget."""
    o, oid = org["owner"], org["id"]
    for _ in range(60):
        _search(o, oid, "ab")
    assert o.get(f"/api/v1/orgs/{oid}/search", params={"q": "ab"}).status_code == 429
    _search(org["member"], oid, "ab")
