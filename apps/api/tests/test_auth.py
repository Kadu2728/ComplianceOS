from fastapi.testclient import TestClient

from app.core.cookies import ACCESS_COOKIE, REFRESH_COOKIE
from tests.conftest import extract_token, make_client, signup

SIGNUP = {
    "name": "Ana",
    "email": "ana@acme.com.br",
    "password": "correct-horse-battery",
    "organization_name": "Acme Tecnologia",
}


def test_signup_creates_user_org_and_owner_membership(client: TestClient) -> None:
    r = client.post("/api/v1/auth/signup", json=SIGNUP)
    assert r.status_code == 201
    assert ACCESS_COOKIE in r.cookies and REFRESH_COOKIE in r.cookies
    assert "password" not in r.text
    me = client.get("/api/v1/me").json()
    assert me["user"]["email"] == "ana@acme.com.br"
    assert me["memberships"][0]["role"] == "owner"
    assert me["memberships"][0]["organization"]["name"] == "Acme Tecnologia"


def test_signup_duplicate_email_is_409_case_insensitive(client: TestClient) -> None:
    assert client.post("/api/v1/auth/signup", json=SIGNUP).status_code == 201
    r = make_client().post("/api/v1/auth/signup", json={**SIGNUP, "email": "ANA@acme.com.br"})
    assert r.status_code == 409
    assert r.json()["code"] == "conflict"


def test_signup_rejects_weak_password(client: TestClient) -> None:
    r = client.post("/api/v1/auth/signup", json={**SIGNUP, "password": "short"})
    assert r.status_code == 422
    assert r.json()["code"] == "validation_error"


def test_cookie_flags(client: TestClient) -> None:
    r = client.post("/api/v1/auth/signup", json=SIGNUP)
    headers = [h.lower() for h in r.headers.get_list("set-cookie")]
    access = next(h for h in headers if h.startswith(ACCESS_COOKIE))
    refresh = next(h for h in headers if h.startswith(REFRESH_COOKIE))
    assert "httponly" in access and "samesite=lax" in access and "path=/;" in access
    assert "httponly" in refresh and "path=/api/v1/auth" in refresh


def test_login_wrong_password_is_generic_401(client: TestClient) -> None:
    signup(client, email="ana@acme.com.br")
    anon = make_client()
    r = anon.post(
        "/api/v1/auth/login", json={"email": "ana@acme.com.br", "password": "nope-nope-nope"}
    )
    assert r.status_code == 401
    assert r.json()["message"] == "Invalid e-mail or password."
    r2 = anon.post("/api/v1/auth/login", json={"email": "ghost@acme.com.br", "password": "x"})
    assert r2.status_code == 401 and r2.json()["message"] == r.json()["message"]


def test_login_rate_limit_per_email(client: TestClient) -> None:
    signup(client, email="ana@acme.com.br")
    anon = make_client()
    codes = [
        anon.post(
            "/api/v1/auth/login", json={"email": "ana@acme.com.br", "password": "wrong-pw"}
        ).status_code
        for _ in range(6)
    ]
    assert codes[:5] == [401] * 5 and codes[5] == 429


def test_unauthenticated_and_tampered_tokens_are_401(client: TestClient) -> None:
    assert client.get("/api/v1/me").status_code == 401
    client.cookies.set(ACCESS_COOKIE, "not-a-jwt")
    assert client.get("/api/v1/me").status_code == 401


def test_refresh_rotates_and_reuse_revokes_family(client: TestClient) -> None:
    signup(client, email="ana@acme.com.br")
    first_refresh = client.cookies[REFRESH_COOKIE]

    r = client.post("/api/v1/auth/refresh")
    assert r.status_code == 200
    second_refresh = client.cookies[REFRESH_COOKIE]
    assert second_refresh != first_refresh

    # Replay of the rotated (revoked) token: rejected and the whole family is revoked.
    replay = make_client()
    replay.cookies.set(REFRESH_COOKIE, first_refresh, path="/api/v1/auth")
    assert replay.post("/api/v1/auth/refresh").status_code == 401

    stolen = make_client()
    stolen.cookies.set(REFRESH_COOKIE, second_refresh, path="/api/v1/auth")
    assert stolen.post("/api/v1/auth/refresh").status_code == 401


def test_logout_revokes_refresh_and_clears_cookies(client: TestClient) -> None:
    signup(client, email="ana@acme.com.br")
    refresh = client.cookies[REFRESH_COOKIE]
    r = client.post("/api/v1/auth/logout")
    assert r.status_code == 200
    again = make_client()
    again.cookies.set(REFRESH_COOKIE, refresh, path="/api/v1/auth")
    assert again.post("/api/v1/auth/refresh").status_code == 401


def test_password_reset_flow(client: TestClient, emails) -> None:  # noqa: ANN001
    signup(client, email="ana@acme.com.br")
    anon = make_client()
    r = anon.post("/api/v1/auth/password-reset/request", json={"email": "ana@acme.com.br"})
    assert r.status_code == 202
    # Unknown e-mail: same response, no e-mail sent (no enumeration).
    assert (
        anon.post("/api/v1/auth/password-reset/request", json={"email": "ghost@x.com"}).status_code
        == 202
    )
    assert len(emails.sent) == 1 and emails.sent[0].to == "ana@acme.com.br"
    token = extract_token(emails.sent[0].text)

    r = anon.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": token, "password": "brand-new-password-1"},
    )
    assert r.status_code == 200
    # Token is single-use; old sessions are revoked; new password works.
    assert (
        anon.post(
            "/api/v1/auth/password-reset/confirm", json={"token": token, "password": "x" * 12}
        ).status_code
        == 400
    )
    assert client.post("/api/v1/auth/refresh").status_code == 401
    assert (
        anon.post(
            "/api/v1/auth/login",
            json={"email": "ana@acme.com.br", "password": "brand-new-password-1"},
        ).status_code
        == 200
    )


def test_origin_check_blocks_cross_site_mutations(client: TestClient) -> None:
    signup(client, email="ana@acme.com.br")
    r = client.post("/api/v1/auth/logout", headers={"Origin": "https://evil.example"})
    assert r.status_code == 403 and r.json()["code"] == "forbidden_origin"
    r = client.post("/api/v1/auth/logout", headers={"Origin": "http://localhost:3000"})
    assert r.status_code == 200
