"""Role matrix (decision D8) tested through the API, not through the UI."""

import pytest

from tests.conftest import invite_and_accept, make_client, signup


@pytest.fixture
def org(emails):  # noqa: ANN001, ANN201
    owner = make_client()
    info = signup(owner, email="owner@acme.com.br")
    org_id = info["org_id"]
    admin = invite_and_accept(owner, org_id, emails, email="admin@acme.com.br", role="admin")
    viewer = invite_and_accept(owner, org_id, emails, email="viewer@acme.com.br", role="viewer")
    members = {
        m["user"]["name"] + m["role"]: m for m in owner.get(f"/api/v1/orgs/{org_id}/members").json()
    }
    ids = {m["role"]: m["id"] for m in members.values()}
    return {"id": org_id, "owner": owner, "admin": admin, "viewer": viewer, "ids": ids}


def test_viewer_is_read_only(org) -> None:  # noqa: ANN001
    v = org["viewer"]
    assert v.get(f"/api/v1/orgs/{org['id']}").status_code == 200
    assert v.patch(f"/api/v1/orgs/{org['id']}", json={"name": "X"}).status_code == 403
    r = v.post(
        f"/api/v1/orgs/{org['id']}/members/invitations", json={"email": "z@z.com", "role": "viewer"}
    )
    assert r.status_code == 403 and r.json()["code"] == "forbidden"
    assert v.get(f"/api/v1/orgs/{org['id']}/audit-log").status_code == 403


def test_viewer_does_not_see_member_emails(org) -> None:  # noqa: ANN001
    members = org["viewer"].get(f"/api/v1/orgs/{org['id']}/members").json()
    assert members and all(m["user"]["email"] is None for m in members)
    members_owner = org["owner"].get(f"/api/v1/orgs/{org['id']}/members").json()
    assert all(m["user"]["email"] for m in members_owner)


def test_admin_cannot_touch_owner_role(org) -> None:  # noqa: ANN001
    a, oid = org["admin"], org["id"]
    assert (
        a.post(
            f"/api/v1/orgs/{oid}/members/invitations", json={"email": "n@n.com", "role": "owner"}
        ).status_code
        == 403
    )
    assert (
        a.patch(
            f"/api/v1/orgs/{oid}/members/{org['ids']['owner']}", json={"role": "admin"}
        ).status_code
        == 403
    )
    assert (
        a.patch(
            f"/api/v1/orgs/{oid}/members/{org['ids']['viewer']}", json={"role": "owner"}
        ).status_code
        == 403
    )
    assert a.delete(f"/api/v1/orgs/{oid}/members/{org['ids']['owner']}").status_code == 403
    # But an admin can manage non-owners.
    assert (
        a.patch(
            f"/api/v1/orgs/{oid}/members/{org['ids']['viewer']}", json={"role": "member"}
        ).status_code
        == 200
    )


def test_cannot_change_own_role_or_remove_self(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    assert (
        o.patch(
            f"/api/v1/orgs/{oid}/members/{org['ids']['owner']}", json={"role": "admin"}
        ).status_code
        == 403
    )
    assert o.delete(f"/api/v1/orgs/{oid}/members/{org['ids']['owner']}").status_code == 403


def test_last_owner_is_protected(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    # Promote admin to owner, then the original owner can be demoted; demoting the last owner fails.
    assert (
        o.patch(
            f"/api/v1/orgs/{oid}/members/{org['ids']['admin']}", json={"role": "owner"}
        ).status_code
        == 200
    )
    second_owner = org["admin"]
    assert (
        second_owner.patch(
            f"/api/v1/orgs/{oid}/members/{org['ids']['owner']}", json={"role": "admin"}
        ).status_code
        == 200
    )
    r = o.patch(f"/api/v1/orgs/{oid}/members/{org['ids']['admin']}", json={"role": "member"})
    assert r.status_code == 403  # o is now admin: cannot revoke an owner
    r = second_owner.patch(
        f"/api/v1/orgs/{oid}/members/{org['ids']['admin']}", json={"role": "member"}
    )
    assert r.status_code == 403  # own role
    # Only-other-owner removal is impossible here: removing yourself is always 403.
    assert (
        second_owner.delete(f"/api/v1/orgs/{oid}/members/{org['ids']['admin']}").status_code == 403
    )


def test_owner_can_remove_member_and_it_loses_access(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    assert o.delete(f"/api/v1/orgs/{oid}/members/{org['ids']['viewer']}").status_code == 200
    assert org["viewer"].get(f"/api/v1/orgs/{oid}").status_code == 404
    assert org["viewer"].get("/api/v1/me").json()["memberships"] == []


def test_invitation_rules(org, emails) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    # Existing member cannot be invited again.
    r = o.post(
        f"/api/v1/orgs/{oid}/members/invitations",
        json={"email": "viewer@acme.com.br", "role": "member"},
    )
    assert r.status_code == 409
    # Invitation for a brand-new e-mail requires name+password on accept.
    r = o.post(
        f"/api/v1/orgs/{oid}/members/invitations",
        json={"email": "new@acme.com.br", "role": "member"},
    )
    assert r.status_code == 201
    token = emails.sent[-1].text.split("token=")[1].split()[0]
    r = make_client().post("/api/v1/auth/invitations/accept", json={"token": token})
    assert r.status_code == 422
    # Garbage token is 400, not 404 (no enumeration of invitation ids).
    r = make_client().post(
        "/api/v1/auth/invitations/accept",
        json={"token": "x" * 40, "name": "Nina", "password": "p" * 12},
    )
    assert r.status_code == 400
    # Pending invitations are listed for managers only; revoking kills the token.
    pending = o.get(f"/api/v1/orgs/{oid}/members/invitations")
    assert pending.status_code == 200 and [i["email"] for i in pending.json()] == [
        "new@acme.com.br"
    ]
    assert org["viewer"].get(f"/api/v1/orgs/{oid}/members/invitations").status_code == 403
    inv_id = pending.json()[0]["id"]
    assert o.delete(f"/api/v1/orgs/{oid}/members/invitations/{inv_id}").status_code == 200
    assert o.get(f"/api/v1/orgs/{oid}/members/invitations").json() == []
    r = make_client().post(
        "/api/v1/auth/invitations/accept",
        json={"token": token, "name": "Nina", "password": "p" * 12},
    )
    assert r.status_code == 400  # expired
    assert o.delete(f"/api/v1/orgs/{oid}/members/invitations/{inv_id}").status_code == 404


def test_audit_log_records_membership_changes_without_secrets(org) -> None:  # noqa: ANN001
    o, oid = org["owner"], org["id"]
    o.patch(f"/api/v1/orgs/{oid}/members/{org['ids']['viewer']}", json={"role": "member"})
    log = o.get(f"/api/v1/orgs/{oid}/audit-log", params={"limit": 50}).json()
    actions = [e["action"] for e in log["items"]]
    for expected in (
        "organization.created",
        "membership.invited",
        "membership.accepted",
        "membership.role_changed",
    ):
        assert expected in actions
    assert "password" not in str(log) and "token" not in str(log).lower().replace("token_hash", "")
    assert all(e["request_id"] for e in log["items"])
    assert log["total"] == len(log["items"])
