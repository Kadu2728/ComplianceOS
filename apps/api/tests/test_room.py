"""Compliance Room (D36): owner management, explicit sharing, time-boxed links, the visitor
surface and its boundaries (docs/security/compliance-room-threat-model.md §4)."""

import io
import json
from datetime import timedelta

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.db.session import get_engine
from app.models.room import ACTIVE_LINKS_MAX, RoomLink
from tests.conftest import invite_and_accept, make_client, signup
from tests.test_insights import SHORT

PDF = b"%PDF-1.4\n%fake\n"


@pytest.fixture
def world(emails):  # noqa: ANN001, ANN201
    """Owner + admin; a diagnostic (score available), two documents (one with a file, one
    faltante), two controls (verificado with proof, planejado); a second organization."""
    owner = make_client()
    oid = signup(owner, email="owner@acme.com.br", org="Acme Tecnologia")["org_id"]
    admin = invite_and_accept(owner, oid, emails, email="admin@acme.com.br", role="admin")
    base = f"/api/v1/orgs/{oid}"
    # Full diagnostic: a short one yields a preliminary score, which a room never shows.
    owner.post(f"{base}/assessment/start", json={"mode": "full"})
    q = owner.get(f"{base}/assessment/questions").json()
    for code in [x["code"] for sec in q["sections"] for x in sec["questions"]]:
        owner.put(f"{base}/assessment/answers/{code}", json={"value": "sim"})
    owner.post(f"{base}/assessment/complete")
    policy = owner.post(
        f"{base}/documents",
        json={"name": "Política de Privacidade", "category": "politica", "version": "2.0"},
    ).json()
    owner.post(
        f"{base}/documents/{policy['id']}/file",
        files={"file": ("politica.pdf", io.BytesIO(PDF), "application/pdf")},
    )
    missing = owner.post(
        f"{base}/documents",
        json={"name": "Registro de tratamento", "category": "registro", "review_state": "faltante"},
    ).json()
    done = owner.post(
        f"{base}/controls",
        json={
            "title": "Backup com teste de restauração",
            "category": "seguranca",
            "kind": "preventivo",
        },
    ).json()
    owner.post(
        f"{base}/evidence",
        json={"kind": "note", "note": "Teste de restauração de 01/09", "control_id": done["id"]},
    )
    owner.patch(f"{base}/controls/{done['id']}", json={"status": "verificado"})
    planned = owner.post(
        f"{base}/controls",
        json={"title": "MFA em sistemas críticos", "category": "acesso", "kind": "preventivo"},
    ).json()
    other = make_client()
    other_org = signup(other, email="outsider@outra.com.br", org="Outra")["org_id"]
    other_doc = other.post(
        f"/api/v1/orgs/{other_org}/documents",
        json={"name": "Segredo de Outra", "category": "politica"},
    ).json()
    return {
        "owner": owner,
        "admin": admin,
        "base": base,
        "org": oid,
        "policy": policy,
        "missing": missing,
        "done": done,
        "planned": planned,
        "other": other,
        "other_base": f"/api/v1/orgs/{other_org}",
        "other_doc": other_doc,
    }


def _public(client, token: str):  # noqa: ANN001, ANN201
    return client.get(f"/api/v1/public/rooms/{token}")


def test_owner_only_and_nothing_shared_by_default(world) -> None:  # noqa: ANN001
    o, a, base = world["owner"], world["admin"], world["base"]
    room = o.get(f"{base}/room").json()
    assert room["enabled"] is False and room["links"] == []
    assert room["shared_documents"] == 0 and room["shared_controls"] == 0
    # Admin (and every non-owner) is refused on every management endpoint.
    for method, path, body in [
        ("GET", f"{base}/room", None),
        ("PUT", f"{base}/room", {"enabled": True}),
        ("GET", f"{base}/room/preview", None),
        ("PUT", f"{base}/room/documents/{world['policy']['id']}", {"shared": True}),
        ("PUT", f"{base}/room/controls/{world['done']['id']}", {"shared": True}),
        ("POST", f"{base}/room/links", {"label": "Cliente"}),
    ]:
        r = a.request(method, path, json=body)
        assert r.status_code == 403, f"{method} {path} -> {r.status_code}"


def test_sharing_rules_and_preview_equals_visitor_view(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    # A faltante document and a planejado control cannot be shared.
    r = o.put(f"{base}/room/documents/{world['missing']['id']}", json={"shared": True})
    assert r.status_code == 409
    r = o.put(f"{base}/room/controls/{world['planned']['id']}", json={"shared": True})
    assert r.status_code == 409
    # Another organization's document id: 404, never 403.
    r = o.put(f"{base}/room/documents/{world['other_doc']['id']}", json={"shared": True})
    assert r.status_code == 404

    assert o.put(
        f"{base}/room/documents/{world['policy']['id']}", json={"shared": True}
    ).json() == {
        "id": world["policy"]["id"],
        "shared": True,
    }
    assert (
        o.put(f"{base}/room/controls/{world['done']['id']}", json={"shared": True}).status_code
        == 200
    )
    r = o.put(
        f"{base}/room",
        json={
            "enabled": True,
            "title": "  Sala da Acme ",
            "intro": "Como cuidamos de dados.",
            "contact_email": "privacidade@acme.com.br",
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["title"] == "Sala da Acme" and r.json()["shared_documents"] == 1

    preview = o.get(f"{base}/room/preview").json()
    assert preview["organization_name"] == "Acme Tecnologia" and preview["title"] == "Sala da Acme"
    assert preview["score"]["score"] > 0 and set(preview["score"]) == {
        "score",
        "band",
        "computed_at",
    }
    assert [d["name"] for d in preview["documents"]] == ["Política de Privacidade"]
    assert (
        preview["documents"][0]["has_file"] is True
        and preview["documents"][0]["status"] == "atualizado"
    )
    assert [c["title"] for c in preview["controls"]] == ["Backup com teste de restauração"]
    assert preview["link"] is None and "certificação" in preview["caveat"]
    # The document appears flagged in the regular list too (management page reads it there).
    docs = o.get(f"{base}/documents").json()["items"]
    assert {d["name"]: d["shared_in_room"] for d in docs} == {
        "Política de Privacidade": True,
        "Registro de tratamento": False,
    }

    created = o.post(
        f"{base}/room/links", json={"label": "Procurement Cliente X", "expires_in_days": 7}
    )
    assert created.status_code == 201, created.text
    token = created.json()["token"]
    assert len(token) >= 40 and created.json()["link"]["active"] is True
    visitor = make_client()
    r = _public(visitor, token)
    assert r.status_code == 200, r.text
    assert r.headers["cache-control"] == "no-store" and "noindex" in r.headers["x-robots-tag"]
    public = r.json()
    assert public["link"] == {
        "label": "Procurement Cliente X",
        "expires_at": created.json()["link"]["expires_at"],
    }
    for key in ("organization_name", "title", "intro", "documents", "controls", "caveat"):
        assert public[key] == preview[key], key
    assert (public["score"]["score"], public["score"]["band"]) == (
        preview["score"]["score"],
        preview["score"]["band"],
    )
    # Nothing else leaks: no risks, actions, evidence, members, owners or e-mails of people.
    dump = json.dumps(public).lower()
    for word in ("risk", "action", "evidence", "member", "owner", "owner@acme", "admin@acme"):
        assert word not in dump, word


def test_links_are_time_boxed_revocable_and_audited(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    o.put(f"{base}/room", json={"enabled": True})
    token = o.post(f"{base}/room/links", json={"label": "Auditor"}).json()["token"]
    visitor = make_client()
    assert _public(visitor, token).status_code == 200
    assert _public(visitor, token).status_code == 200
    links = o.get(f"{base}/room").json()["links"]
    assert links[0]["view_count"] == 2 and links[0]["last_viewed_at"] is not None
    # Every view is audited with the link id, without visitor data.
    log = o.get(f"{base}/audit-log?limit=20").json()["items"]
    views = [e for e in log if e["action"] == "room.viewed"]
    assert len(views) == 2 and views[0]["entity_id"] == links[0]["id"]
    assert views[0]["actor_name"] is None and views[0]["data"] == {"label": "Auditor"}
    assert {e["action"] for e in log} >= {"room.updated", "room.link_created"}

    # Room disabled → the link stops working; enabled again → works.
    o.put(f"{base}/room", json={"enabled": False})
    assert _public(visitor, token).status_code == 404
    o.put(f"{base}/room", json={"enabled": True})
    assert _public(visitor, token).status_code == 200

    # Revoked → 404, and stays revoked.
    assert o.delete(f"{base}/room/links/{links[0]['id']}").status_code == 200
    assert _public(visitor, token).status_code == 404
    assert o.get(f"{base}/room").json()["links"][0]["active"] is False

    # Expired → 404 (clock moved on the row; same code path as a real expiry).
    token2 = o.post(f"{base}/room/links", json={"label": "Expira", "expires_in_days": 1}).json()[
        "token"
    ]
    assert _public(visitor, token2).status_code == 200
    with Session(get_engine()) as db:
        link = db.scalar(select(RoomLink).where(RoomLink.label == "Expira"))
        link.expires_at = utcnow() - timedelta(seconds=1)
        db.commit()
    assert _public(visitor, token2).status_code == 404

    # Wrong token and a revoked link of another org's id look identical.
    assert _public(visitor, "x" * 43).status_code == 404
    assert o.delete(f"{base}/room/links/{world['other_doc']['id']}").status_code == 404
    # Validation of the request.
    assert o.post(f"{base}/room/links", json={"label": "A"}).status_code == 422
    assert (
        o.post(f"{base}/room/links", json={"label": "Longo", "expires_in_days": 91}).status_code
        == 422
    )


def test_preliminary_score_is_never_shown(world) -> None:  # noqa: ANN001
    other, base = world["other"], world["other_base"]
    other.post(f"{base}/assessment/start", json={"mode": "short"})
    for code in SHORT:
        other.put(f"{base}/assessment/answers/{code}", json={"value": "sim"})
    other.post(f"{base}/assessment/complete")
    assert other.get(f"{base}/score").json()["preliminary"] is True
    assert other.get(f"{base}/room/preview").json()["score"] is None


def test_active_links_ceiling(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    for i in range(ACTIVE_LINKS_MAX):
        assert o.post(f"{base}/room/links", json={"label": f"Link {i}"}).status_code == 201
    r = o.post(f"{base}/room/links", json={"label": "Um a mais"})
    assert r.status_code == 409


def test_download_only_for_flagged_documents_of_the_room(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    o.put(f"{base}/room", json={"enabled": True})
    o.put(f"{base}/room/documents/{world['policy']['id']}", json={"shared": True})
    token = o.post(f"{base}/room/links", json={"label": "Cliente"}).json()["token"]
    visitor = make_client()
    r = visitor.get(f"/api/v1/public/rooms/{token}/documents/{world['policy']['id']}/download")
    assert r.status_code == 200 and r.content == PDF
    assert r.headers["content-disposition"].startswith("attachment;")
    assert (
        r.headers["cache-control"] == "no-store"
        and r.headers["x-content-type-options"] == "nosniff"
    )
    # Unflagged document of the same organization → 404; another organization's → 404.
    for doc_id in (world["missing"]["id"], world["other_doc"]["id"]):
        assert (
            visitor.get(f"/api/v1/public/rooms/{token}/documents/{doc_id}/download").status_code
            == 404
        )
    # Unsharing closes the download immediately.
    o.put(f"{base}/room/documents/{world['policy']['id']}", json={"shared": False})
    assert (
        visitor.get(
            f"/api/v1/public/rooms/{token}/documents/{world['policy']['id']}/download"
        ).status_code
        == 404
    )
    log = o.get(f"{base}/audit-log?limit=20").json()["items"]
    assert any(
        e["action"] == "room.document_downloaded"
        and e["data"]["title"] == "Política de Privacidade"
        for e in log
    )


def test_public_endpoint_is_rate_limited(world) -> None:  # noqa: ANN001
    visitor = make_client()
    codes = [_public(visitor, "nope").status_code for _ in range(61)]
    assert codes[:60] == [404] * 60 and codes[60] == 429


def test_control_that_regresses_disappears_from_the_room(world) -> None:  # noqa: ANN001
    o, base = world["owner"], world["base"]
    o.put(f"{base}/room", json={"enabled": True})
    o.put(f"{base}/room/controls/{world['done']['id']}", json={"shared": True})
    assert len(o.get(f"{base}/room/preview").json()["controls"]) == 1
    o.patch(f"{base}/controls/{world['done']['id']}", json={"status": "parcial"})
    assert o.get(f"{base}/room/preview").json()["controls"] == []
    o.put(f"{base}/room", json={"show_controls": False})
    o.patch(f"{base}/controls/{world['done']['id']}", json={"status": "implementado"})
    assert o.get(f"{base}/room/preview").json()["controls"] == []
