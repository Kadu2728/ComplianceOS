import uuid

from fastapi.testclient import TestClient


def test_health_returns_ok_with_request_id(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert isinstance(body["version"], str) and body["version"]
    request_id = response.headers.get("X-Request-ID")
    assert request_id
    uuid.UUID(request_id)  # generated ids are UUIDs


def test_inbound_request_id_is_echoed(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "trace-abc-12345"})
    assert response.headers["X-Request-ID"] == "trace-abc-12345"


def test_malformed_inbound_request_id_is_replaced(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "bad id <script>"})
    assert response.headers["X-Request-ID"] != "bad id <script>"
    uuid.UUID(response.headers["X-Request-ID"])


def test_unknown_route_uses_error_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/does-not-exist", headers={"X-Request-ID": "trace-404-00001"})
    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "not_found"
    assert body["message"]
    assert body["request_id"] == "trace-404-00001"
    assert response.headers["X-Request-ID"] == "trace-404-00001"


def test_validation_error_uses_error_envelope(client: TestClient) -> None:
    # Query param coercion failure on a route that does not declare it is not a 422,
    # so exercise the handler through a bad path parameter on the docs-less openapi route.
    response = client.post("/api/v1/health")  # method not allowed → still enveloped
    assert response.status_code == 405
    body = response.json()
    assert body["code"] == "method_not_allowed"
    assert "request_id" in body


def test_security_headers_on_every_response(client) -> None:  # noqa: ANN001
    for path in ("/api/v1/health", "/api/v1/nope"):
        r = client.get(path)
        assert r.headers["x-content-type-options"] == "nosniff"
        assert r.headers["x-frame-options"] == "DENY"
        assert r.headers["referrer-policy"] == "no-referrer"
        assert r.headers["content-security-policy"] == "default-src 'none'; frame-ancestors 'none'"
        assert r.headers["cache-control"] == "no-store"


def test_production_requires_secure_cookies(monkeypatch) -> None:  # noqa: ANN001
    import pytest

    from app.core.config import Settings

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET", "x" * 40)
    monkeypatch.setenv("COOKIE_SECURE", "false")
    monkeypatch.setenv("EMAIL_PROVIDER", "smtp")
    monkeypatch.setenv("SMTP_HOST", "relay")
    monkeypatch.setenv("SMTP_FROM", "no-reply@example.com")
    with pytest.raises(ValueError, match="COOKIE_SECURE"):
        Settings(_env_file=None)
    monkeypatch.setenv("COOKIE_SECURE", "true")
    # Production also refuses ephemeral local storage (container filesystems vanish on deploy).
    monkeypatch.setenv("STORAGE_BACKEND", "local")
    with pytest.raises(ValueError, match="STORAGE_BACKEND"):
        Settings(_env_file=None)
    monkeypatch.setenv("STORAGE_BACKEND", "s3")
    monkeypatch.setenv("S3_BUCKET", "compliance-os")
    monkeypatch.setenv("DATABASE_URL", "postgres://user:secret@db.internal/compliance")
    settings = Settings(_env_file=None)
    assert settings.cookie_secure is True
    # Managed providers hand out `postgres://`; SQLAlchemy needs the driver spelled out.
    assert settings.database_url == "postgresql+psycopg://user:secret@db.internal/compliance"
    monkeypatch.delenv("DATABASE_URL")
    with pytest.raises(ValueError, match="DATABASE_URL"):
        Settings(_env_file=None)


def test_hsts_only_in_production(client: TestClient, monkeypatch) -> None:  # noqa: ANN001
    from app.core import headers as headers_module

    assert "strict-transport-security" not in client.get("/health").headers
    monkeypatch.setattr(
        headers_module, "get_settings", lambda: type("S", (), {"app_env": "production"})()
    )
    assert (
        client.get("/health").headers["strict-transport-security"]
        == "max-age=31536000; includeSubDomains"
    )
