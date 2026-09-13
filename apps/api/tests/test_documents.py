"""Documents (D26): derived status, filters and order, permissions, file replace/download,
document citations as evidence (and their effect on the score), overview counts."""

import io
from datetime import date, timedelta

import pytest

from app.models.document import DocumentReviewState, DocumentStatus
from app.services.documents import derive_status
from tests.conftest import invite_and_accept, make_client, signup

PDF = b"%PDF-1.4\n%fake\n"
TODAY = date(2026, 9, 13)


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br")["org_id"]
    viewer = invite_and_accept(owner, oid, emails, email="viewer@acme.com.br", role="viewer")
    member = invite_and_accept(owner, oid, emails, email="member@acme.com.br", role="member")
    members = owner.get(f"/api/v1/orgs/{oid}/members").json()
    ids = {m["role"]: m["id"] for m in members}
    return {"id": oid, "owner": owner, "viewer": viewer, "member": member, "ids": ids}


def _base(org) -> str:  # noqa: ANN001
    return f"/api/v1/orgs/{org['id']}/documents"


def _doc(org, name: str, **extra) -> dict:  # noqa: ANN001, ANN003
    r = org["owner"].post(_base(org), json={"name": name, "category": "politica", **extra})
    assert r.status_code == 201, r.text
    return r.json()


@pytest.mark.parametrize(
    ("state", "valid_until", "expected"),
    [
        (DocumentReviewState.FALTANTE, None, DocumentStatus.FALTANTE),
        (DocumentReviewState.FALTANTE, TODAY - timedelta(days=1), DocumentStatus.FALTANTE),
        (DocumentReviewState.EM_REVISAO, TODAY - timedelta(days=1), DocumentStatus.EM_REVISAO),
        (DocumentReviewState.VIGENTE, None, DocumentStatus.ATUALIZADO),
        (DocumentReviewState.VIGENTE, TODAY - timedelta(days=1), DocumentStatus.VENCIDO),
        (DocumentReviewState.VIGENTE, TODAY, DocumentStatus.VENCENDO),  # ends today: still valid
        (DocumentReviewState.VIGENTE, TODAY + timedelta(days=30), DocumentStatus.VENCENDO),
        (DocumentReviewState.VIGENTE, TODAY + timedelta(days=31), DocumentStatus.ATUALIZADO),
    ],
)
def test_derive_status(state, valid_until, expected) -> None:  # noqa: ANN001
    assert derive_status(state, valid_until, TODAY) == expected


def test_create_defaults_and_validation(org) -> None:  # noqa: ANN001
    d = _doc(org, "  Política de Privacidade  ", tags=["LGPD", "lgpd ", "Site"])
    assert d["name"] == "Política de Privacidade" and d["version"] == "1.0"
    assert d["status"] == "atualizado" and d["review_state"] == "vigente"
    assert d["tags"] == ["lgpd", "site"]  # normalized, de-duplicated
    assert d["owner"] is None and d["filename"] is None
    o = org["owner"]
    assert o.post(_base(org), json={"name": "x", "category": "politica"}).status_code == 422
    assert o.post(_base(org), json={"name": "Ok", "category": "invalida"}).status_code == 422
    r = o.post(_base(org), json={"name": "Ok", "category": "outro", "tags": ["a"] * 11})
    assert r.status_code == 422
    r = o.post(
        _base(org),
        json={
            "name": "Ok",
            "category": "outro",
            "owner_membership_id": str(__import__("uuid").uuid4()),
        },
    )
    assert r.status_code == 422
    r = o.post(_base(org), json={"name": "Link", "category": "outro", "url": "https://x.com/doc"})
    assert r.status_code == 201 and r.json()["url"] == "https://x.com/doc"


def test_list_order_filters_and_pagination(org) -> None:  # noqa: ANN001
    today = date.today()
    ok = _doc(org, "Atualizado", valid_until=(today + timedelta(days=90)).isoformat())
    soon = _doc(org, "Vencendo", valid_until=(today + timedelta(days=10)).isoformat())
    late = _doc(org, "Vencido", valid_until=(today - timedelta(days=1)).isoformat())
    missing = _doc(org, "Faltante", review_state="faltante", category="registro")
    review = _doc(org, "Em revisão", review_state="em_revisao")
    forever = _doc(org, "Sem validade")
    page = org["owner"].get(_base(org)).json()
    assert page["total"] == 6
    assert [d["name"] for d in page["items"]] == [
        "Vencido",
        "Faltante",
        "Vencendo",
        "Em revisão",
        "Atualizado",
        "Sem validade",
    ]
    assert {d["id"]: d["status"] for d in page["items"]} == {
        ok["id"]: "atualizado",
        soon["id"]: "vencendo",
        late["id"]: "vencido",
        missing["id"]: "faltante",
        review["id"]: "em_revisao",
        forever["id"]: "atualizado",
    }
    r = org["owner"].get(_base(org), params={"status": ["vencido", "vencendo"]}).json()
    assert [d["name"] for d in r["items"]] == ["Vencido", "Vencendo"]
    r = org["owner"].get(_base(org), params={"category": "registro"}).json()
    assert [d["name"] for d in r["items"]] == ["Faltante"]
    r = org["owner"].get(_base(org), params={"limit": 2, "offset": 2}).json()
    assert r["total"] == 6 and [d["name"] for d in r["items"]] == ["Vencendo", "Em revisão"]
    # Viewer reads, member reads; neither creates.
    assert org["viewer"].get(_base(org)).json()["total"] == 6
    assert (
        org["viewer"].post(_base(org), json={"name": "Nope", "category": "outro"}).status_code
        == 403
    )
    assert (
        org["member"].post(_base(org), json={"name": "Nope", "category": "outro"}).status_code
        == 403
    )


def test_update_permissions_and_audit(org) -> None:  # noqa: ANN001
    d = _doc(org, "Procedimento de incidentes", category="procedimento")
    path = f"{_base(org)}/{d['id']}"
    # Member cannot edit an unassigned document; once assigned, can edit but not reassign.
    assert org["member"].patch(path, json={"version": "1.1"}).status_code == 403
    r = org["owner"].patch(path, json={"owner_membership_id": org["ids"]["member"]})
    assert r.status_code == 200 and r.json()["owner"]["membership_id"] == org["ids"]["member"]
    r = org["member"].patch(path, json={"version": "1.1", "review_state": "em_revisao"})
    assert r.status_code == 200 and r.json()["status"] == "em_revisao"
    assert org["member"].patch(path, json={"owner_membership_id": None}).status_code == 403
    assert org["viewer"].patch(path, json={"version": "2"}).status_code == 403
    assert org["owner"].patch(path, json={"unknown": 1}).status_code == 422
    log = org["owner"].get(f"/api/v1/orgs/{org['id']}/audit-log").json()["items"]
    latest = log[0]
    assert latest["action"] == "document.updated" and latest["entity_title"] == d["name"]
    assert latest["data"]["version"] == {"from": "1.0", "to": "1.1"}
    assert latest["data"]["review_state"] == {"from": "vigente", "to": "em_revisao"}


def test_file_replace_download_and_missing_placeholder(org) -> None:  # noqa: ANN001
    d = _doc(org, "Política de segurança", review_state="faltante")
    assert d["status"] == "faltante"
    path = f"{_base(org)}/{d['id']}"
    o = org["owner"]
    assert o.get(f"{path}/download").status_code == 404  # nothing to download yet
    r = o.post(
        f"{path}/file", files={"file": ("../v1 <x>.pdf", io.BytesIO(PDF), "application/pdf")}
    )
    assert r.status_code == 200, r.text
    first = r.json()
    assert first["filename"] == "v1 _x_.pdf" and first["size_bytes"] == len(PDF)
    assert first["status"] == "atualizado"  # uploading a file clears "faltante"
    dl = o.get(f"{path}/download")
    assert dl.status_code == 200 and dl.content == PDF
    assert dl.headers["content-disposition"].startswith("attachment;")
    assert dl.headers["x-content-type-options"] == "nosniff"
    # Replace: the new file wins, old bytes are gone.
    r = o.post(f"{path}/file", files={"file": ("v2.txt", io.BytesIO(b"texto"), "text/plain")})
    assert r.status_code == 200 and r.json()["filename"] == "v2.txt"
    assert o.get(f"{path}/download").content == b"texto"
    # Same validation as evidence files.
    r = o.post(
        f"{path}/file", files={"file": ("x.exe", io.BytesIO(b"MZ"), "application/x-msdownload")}
    )
    assert r.status_code == 415
    r = o.post(f"{path}/file", files={"file": ("x.pdf", io.BytesIO(b"<html>"), "application/pdf")})
    assert r.status_code == 415
    # Viewer can download, cannot upload.
    assert org["viewer"].get(f"{path}/download").status_code == 200
    r = org["viewer"].post(
        f"{path}/file", files={"file": ("v3.txt", io.BytesIO(b"x"), "text/plain")}
    )
    assert r.status_code == 403


def test_document_as_evidence_counts_for_the_score_and_blocks_delete(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    d = _doc(org, "Política de privacidade publicada")
    risk = o.post(
        f"/api/v1/orgs/{oid}/risks",
        json={
            "title": "Política ausente",
            "category": "documentacao",
            "probability": 3,
            "impact": 4,
        },
    ).json()
    # Citation rules: kind=document ⇔ document_id.
    r = o.post(f"/api/v1/orgs/{oid}/evidence", json={"kind": "document", "risk_id": risk["id"]})
    assert r.status_code == 422
    r = o.post(
        f"/api/v1/orgs/{oid}/evidence",
        json={"kind": "note", "risk_id": risk["id"], "note": "x", "document_id": d["id"]},
    )
    assert r.status_code == 422
    r = o.post(
        f"/api/v1/orgs/{oid}/evidence",
        json={"kind": "document", "risk_id": risk["id"], "document_id": d["id"]},
    )
    assert r.status_code == 201, r.text
    ev = r.json()
    assert ev["kind"] == "document" and ev["document"] == {"id": d["id"], "name": d["name"]}
    listed = o.get(f"/api/v1/orgs/{oid}/evidence", params={"risk_id": risk["id"]}).json()
    assert listed[0]["document"]["name"] == d["name"]
    # The cited document cannot be deleted while referenced.
    r = o.delete(f"{_base(org)}/{d['id']}")
    assert r.status_code == 409
    assert o.delete(f"/api/v1/orgs/{oid}/evidence/{ev['id']}").status_code == 200
    assert o.delete(f"{_base(org)}/{d['id']}").status_code == 200
    assert o.get(f"{_base(org)}/{d['id']}").status_code == 404
    assert org["member"].delete(f"{_base(org)}/{d['id']}").status_code == 404  # gone, not 403


def test_overview_document_counts(org) -> None:  # noqa: ANN001
    today = date.today()
    _doc(org, "Doc A", valid_until=(today + timedelta(days=5)).isoformat())
    _doc(org, "Doc B", valid_until=(today - timedelta(days=5)).isoformat())
    _doc(org, "Doc C", review_state="faltante")
    _doc(org, "Doc D")
    out = org["viewer"].get(f"/api/v1/orgs/{org['id']}/overview").json()
    assert out["documents"] == {
        "total": 4,
        "atualizado": 1,
        "vencendo": 1,
        "vencido": 1,
        "faltante": 1,
        "em_revisao": 0,
    }
