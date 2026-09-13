"""Risk / Action / Evidence: severity derivation, state machines, ownership rules, upload safety."""

import io

import pytest

from app.services.domain import derive_severity
from tests.conftest import invite_and_accept, make_client, signup

PDF = b"%PDF-1.4\n%fake\n" + b"0" * 200


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    ids = {m["role"]: m["id"] for m in owner.get(f"/api/v1/orgs/{oid}/members").json()}
    return {"id": oid, "owner": owner, "member": member, "viewer": viewer, "ids": ids}


def _risk(client, oid, **over):  # noqa: ANN001, ANN202
    body = {
        "title": "Sistemas críticos sem MFA",
        "category": "acesso",
        "probability": 3,
        "impact": 4,
    }
    body.update(over)
    r = client.post(f"/api/v1/orgs/{oid}/risks", json=body)
    assert r.status_code == 201, r.text
    return r.json()


@pytest.mark.parametrize(
    ("p", "i", "expected"),
    [
        (3, 4, "critico"),
        (3, 3, "alto"),
        (2, 4, "alto"),
        (3, 2, "medio"),
        (2, 3, "medio"),
        (2, 2, "medio"),
        (1, 4, "medio"),
        (3, 1, "baixo"),
        (2, 1, "baixo"),
        (1, 1, "baixo"),
    ],
)
def test_severity_matrix(p: int, i: int, expected: str) -> None:
    assert derive_severity(p, i).value == expected


def test_risk_create_derives_severity_and_ignores_client_severity(org) -> None:  # noqa: ANN001
    r = org["owner"].post(
        f"/api/v1/orgs/{org['id']}/risks",
        json={
            "title": "Backups não testados",
            "category": "seguranca",
            "probability": 2,
            "impact": 3,
            "severity": "critico",
        },
    )
    assert r.status_code == 201
    assert r.json()["severity"] == "medio"
    assert r.json()["status"] == "aberto" and r.json()["source"] == "manual"


def test_risk_validation(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    assert (
        o.post(
            f"/api/v1/orgs/{oid}/risks",
            json={"title": "x", "category": "acesso", "probability": 3, "impact": 4},
        ).status_code
        == 422
    )
    assert (
        o.post(
            f"/api/v1/orgs/{oid}/risks",
            json={"title": "Ok title", "category": "acesso", "probability": 4, "impact": 4},
        ).status_code
        == 422
    )
    assert (
        o.post(
            f"/api/v1/orgs/{oid}/risks",
            json={"title": "Ok title", "category": "nope", "probability": 1, "impact": 1},
        ).status_code
        == 422
    )
    # Owner must belong to the organization.
    import uuid

    r = o.post(
        f"/api/v1/orgs/{oid}/risks",
        json={
            "title": "Ok title",
            "category": "acesso",
            "probability": 1,
            "impact": 1,
            "owner_membership_id": str(uuid.uuid4()),
        },
    )
    assert r.status_code == 422


def test_viewer_cannot_create_but_can_read(org) -> None:  # noqa: ANN001
    risk = _risk(org["owner"], org["id"])
    v = org["viewer"]
    assert (
        v.post(
            f"/api/v1/orgs/{org['id']}/risks",
            json={"title": "Novo risco", "category": "dados", "probability": 1, "impact": 1},
        ).status_code
        == 403
    )
    assert v.get(f"/api/v1/orgs/{org['id']}/risks/{risk['id']}").status_code == 200
    assert (
        v.patch(
            f"/api/v1/orgs/{org['id']}/risks/{risk['id']}", json={"title": "Alterado"}
        ).status_code
        == 403
    )


def test_member_can_only_update_assigned(org) -> None:  # noqa: ANN001
    o, m, oid = org["owner"], org["member"], org["id"]
    mine = _risk(o, oid, owner_membership_id=org["ids"]["member"])
    theirs = _risk(o, oid)
    assert (
        m.patch(
            f"/api/v1/orgs/{oid}/risks/{mine['id']}", json={"treatment": "Ativar MFA"}
        ).status_code
        == 200
    )
    assert (
        m.patch(f"/api/v1/orgs/{oid}/risks/{theirs['id']}", json={"treatment": "x"}).status_code
        == 403
    )
    # A member cannot reassign, even their own.
    assert (
        m.patch(
            f"/api/v1/orgs/{oid}/risks/{mine['id']}",
            json={"owner_membership_id": org["ids"]["owner"]},
        ).status_code
        == 403
    )
    assert (
        m.post(
            f"/api/v1/orgs/{oid}/risks",
            json={"title": "Novo risco", "category": "dados", "probability": 1, "impact": 1},
        ).status_code
        == 403
    )
    # A manager can, and the response already shows the new person (regression: stale owner).
    r = o.patch(
        f"/api/v1/orgs/{oid}/risks/{theirs['id']}",
        json={"owner_membership_id": org["ids"]["member"]},
    )
    assert r.status_code == 200 and r.json()["owner"]["membership_id"] == org["ids"]["member"]
    r = o.patch(f"/api/v1/orgs/{oid}/risks/{theirs['id']}", json={"owner_membership_id": None})
    assert r.status_code == 200 and r.json()["owner"] is None


def test_update_recomputes_severity_and_audits(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    risk = _risk(o, oid)
    r = o.patch(f"/api/v1/orgs/{oid}/risks/{risk['id']}", json={"probability": 1})
    assert r.status_code == 200 and r.json()["severity"] == "medio"
    log = o.get(f"/api/v1/orgs/{oid}/audit-log", params={"limit": 50}).json()["items"]
    upd = next(e for e in log if e["action"] == "risk.updated")
    assert upd["data"]["severity"] == {"from": "critico", "to": "medio"}
    assert upd["entity_id"] == risk["id"]


def test_risk_state_machine(org) -> None:  # noqa: ANN001
    o, m, oid = org["owner"], org["member"], org["id"]
    risk = _risk(o, oid, owner_membership_id=org["ids"]["member"])
    url = f"/api/v1/orgs/{oid}/risks/{risk['id']}/status"
    assert (
        m.post(url, json={"status": "resolvido"}).status_code == 409
    )  # aberto → resolvido is not allowed
    assert m.post(url, json={"status": "aberto"}).status_code == 409  # same status
    assert m.post(url, json={"status": "em_andamento"}).status_code == 200
    assert m.post(url, json={"status": "em_revisao"}).status_code == 200
    r = m.post(url, json={"status": "resolvido"})
    assert r.status_code == 200 and r.json()["resolved_at"]
    assert m.post(url, json={"status": "aberto"}).status_code == 403  # reopen is manager-only
    assert o.post(url, json={"status": "aberto"}).status_code == 200
    assert (
        m.post(url, json={"status": "aceito"}).status_code == 403
    )  # accepting risk is manager-only
    assert o.post(url, json={"status": "aceito"}).status_code == 200


def test_actions_link_to_risks_and_track_completion(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    risk = _risk(o, oid)
    r = o.post(
        f"/api/v1/orgs/{oid}/actions",
        json={"title": "Ativar MFA no e-mail", "risk_id": risk["id"], "due_date": "2020-01-01"},
    )
    assert r.status_code == 201
    action = r.json()
    assert o.get(f"/api/v1/orgs/{oid}/risks/{risk['id']}/actions").json()[0]["id"] == action["id"]
    overdue = o.get(f"/api/v1/orgs/{oid}/actions", params={"overdue": "true"}).json()
    assert overdue["total"] == 1
    url = f"/api/v1/orgs/{oid}/actions/{action['id']}/status"
    assert (
        o.post(url, json={"status": "concluida"}).status_code == 409
    )  # a_fazer → concluida not allowed
    assert o.post(url, json={"status": "em_andamento"}).status_code == 200
    done = o.post(url, json={"status": "concluida"})
    assert done.status_code == 200 and done.json()["completed_at"]
    assert o.get(f"/api/v1/orgs/{oid}/actions", params={"overdue": "true"}).json()["total"] == 0
    # Linking to a risk that is not ours is a 404 (tenant rule), not a 422.
    import uuid

    assert (
        o.post(
            f"/api/v1/orgs/{oid}/actions", json={"title": "Ação órfã", "risk_id": str(uuid.uuid4())}
        ).status_code
        == 404
    )


def test_evidence_note_and_link(org) -> None:  # noqa: ANN001
    o, m, oid = org["owner"], org["member"], org["id"]
    risk = _risk(o, oid)
    assert (
        o.post(
            f"/api/v1/orgs/{oid}/evidence", json={"kind": "note", "risk_id": risk["id"]}
        ).status_code
        == 422
    )
    assert (
        o.post(
            f"/api/v1/orgs/{oid}/evidence",
            json={"kind": "link", "risk_id": risk["id"], "url": "not a url"},
        ).status_code
        == 422
    )
    assert (
        o.post(
            f"/api/v1/orgs/{oid}/evidence", json={"kind": "note", "note": "sem vínculo"}
        ).status_code
        == 422
    )
    n = m.post(
        f"/api/v1/orgs/{oid}/evidence",
        json={"kind": "note", "risk_id": risk["id"], "note": "MFA ativado em 12/09"},
    )
    assert n.status_code == 201
    link = m.post(
        f"/api/v1/orgs/{oid}/evidence",
        json={"kind": "link", "risk_id": risk["id"], "url": "https://exemplo.com/politica"},
    )
    assert link.status_code == 201
    listed = o.get(f"/api/v1/orgs/{oid}/evidence", params={"risk_id": risk["id"]}).json()
    assert {e["kind"] for e in listed} == {"note", "link"}
    # Members cannot delete evidence; managers can.
    assert m.delete(f"/api/v1/orgs/{oid}/evidence/{n.json()['id']}").status_code == 403
    assert o.delete(f"/api/v1/orgs/{oid}/evidence/{n.json()['id']}").status_code == 200
    assert (
        org["viewer"]
        .post(
            f"/api/v1/orgs/{oid}/evidence",
            json={"kind": "note", "risk_id": risk["id"], "note": "x"},
        )
        .status_code
        == 403
    )


def test_evidence_file_upload_and_download(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    risk = _risk(o, oid)
    r = o.post(
        f"/api/v1/orgs/{oid}/evidence/files",
        data={"risk_id": risk["id"], "note": "Captura da configuração"},
        files={"file": ("../../..\\etc\\config <mfa>.pdf", io.BytesIO(PDF), "application/pdf")},
    )
    assert r.status_code == 201, r.text
    ev = r.json()
    assert ev["kind"] == "file" and ev["size_bytes"] == len(PDF)
    assert ev["filename"] == "config _mfa_.pdf"  # directory parts and unsafe characters removed
    assert "storage_key" not in ev
    d = o.get(f"/api/v1/orgs/{oid}/evidence/{ev['id']}/download")
    assert d.status_code == 200 and d.content == PDF
    assert d.headers["content-type"].startswith("application/pdf")
    assert d.headers["x-content-type-options"] == "nosniff"
    assert "attachment" in d.headers["content-disposition"]
    # Delete removes the file too.
    assert o.delete(f"/api/v1/orgs/{oid}/evidence/{ev['id']}").status_code == 200
    assert o.get(f"/api/v1/orgs/{oid}/evidence/{ev['id']}/download").status_code == 404


def test_evidence_upload_rejects_bad_files(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    risk = _risk(o, oid)
    url = f"/api/v1/orgs/{oid}/evidence/files"
    exe = o.post(
        url,
        data={"risk_id": risk["id"]},
        files={"file": ("x.exe", io.BytesIO(b"MZ..."), "application/x-msdownload")},
    )
    assert exe.status_code == 415
    spoof = o.post(
        url,
        data={"risk_id": risk["id"]},
        files={"file": ("x.pdf", io.BytesIO(b"<html>"), "application/pdf")},
    )
    assert spoof.status_code == 415
    empty = o.post(
        url, data={"risk_id": risk["id"]}, files={"file": ("x.txt", io.BytesIO(b""), "text/plain")}
    )
    assert empty.status_code == 422
    big = o.post(
        url,
        data={"risk_id": risk["id"]},
        files={"file": ("x.txt", io.BytesIO(b"a" * (64 * 1024 + 1)), "text/plain")},
    )
    assert big.status_code == 413
    orphan = o.post(url, files={"file": ("x.txt", io.BytesIO(b"ok"), "text/plain")})
    assert orphan.status_code == 422
    assert o.get(f"/api/v1/orgs/{oid}/evidence", params={"risk_id": risk["id"]}).json() == []


def test_risk_list_filters_and_order(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    low = _risk(o, oid, title="Risco baixo", probability=1, impact=1)
    crit = _risk(o, oid, title="Risco crítico")
    page = o.get(f"/api/v1/orgs/{oid}/risks").json()
    assert [r["id"] for r in page["items"]] == [crit["id"], low["id"]]  # critical first
    assert o.get(f"/api/v1/orgs/{oid}/risks", params={"severity": "baixo"}).json()["total"] == 1
    o.post(f"/api/v1/orgs/{oid}/risks/{low['id']}/status", json={"status": "aceito"})
    assert o.get(f"/api/v1/orgs/{oid}/risks", params={"status": "aberto"}).json()["total"] == 1
