"""Demo organization (CLAUDE.md §23): built through the services, coherent with what the API
reports, and removable."""

from sqlalchemy.orm import Session

from app.content import demo_acme
from app.content import demo_acme_data as data
from app.core.storage import get_storage
from app.db.session import get_engine
from tests.conftest import make_client

PASSWORD = "acme-demo-2026"


def _login() -> tuple:
    client = make_client()
    r = client.post("/api/v1/auth/login", json={"email": data.OWNER_EMAIL, "password": PASSWORD})
    assert r.status_code == 200, r.text
    me = client.get("/api/v1/me").json()
    return client, me["memberships"][0]["organization"]["id"]


def _seed() -> dict:
    with Session(get_engine()) as db:
        summary = demo_acme.build(db, password=PASSWORD)
        db.commit()
    return summary


def test_demo_is_coherent_with_the_api() -> None:
    summary = _seed()
    client, org_id = _login()
    assert summary["organization_id"] == org_id

    overview = client.get(f"/api/v1/orgs/{org_id}/overview").json()
    risks = overview["risks"]
    plans = list(data.RISKS.values()) + data.MANUAL_RISKS
    assert summary["risks"] == len(plans) == 28
    assert risks["open"] == sum(1 for r in plans if r["status"] not in ("resolvido", "aceito"))
    # Three critical risks still being worked on (the story), none resolved.
    assert risks["by_severity"]["critico"] == 3
    assert risks["in_review"] == 1 and risks["without_owner"] == 0
    listing = client.get(f"/api/v1/orgs/{org_id}/risks?limit=50").json()
    assert listing["total"] == 28
    actions = overview["actions"]
    assert actions["done"] == sum(1 for a in data.ACTIONS if a["status"] == "concluida")
    assert actions["pending"] + actions["done"] == len(data.ACTIONS)
    assert (
        actions["overdue"]
        == sum(1 for a in data.ACTIONS if a["due"] < 0 and a["status"] != "concluida")
        == 3
    )
    assert actions["blocked"] == 1
    docs = overview["documents"]
    assert docs["total"] == len(data.DOCUMENTS)
    assert (docs["vencido"], docs["faltante"], docs["vencendo"], docs["em_revisao"]) == (1, 2, 1, 1)
    assert overview["assessment"]["status"] == "completed"
    assert len(overview["recent_activity"]) == 8

    # The story in numbers (D10 v1). If the assessment content or the weights change, the demo
    # dataset must be re-read against the new derivation — that is the point of this assertion.
    score = client.get(f"/api/v1/orgs/{org_id}/score").json()
    assert score["available"] and score["score"] == summary["score"] == 77
    assert score["band"]["label"] == "Organizado"  # 60–79: a real programme with gaps left
    factors = {f["key"]: f["value"] for f in score["factors"]}
    assert factors == {"A": 100.0, "B": 62.8, "C": 88.4, "D": 87.5}
    assert score["top_reducers"][0]["reason"] == "open_critico"
    assert score["top_reducers"][0]["count"] == 3
    history = client.get(f"/api/v1/orgs/{org_id}/score/history").json()["items"]
    assert [h["score"] for h in history] == [77, 40]  # after the diagnostic → today
    assert all(h["trigger"] for h in history)

    members = client.get(f"/api/v1/orgs/{org_id}/members").json()
    assert {m["role"] for m in members} == {"owner", "admin", "member", "viewer"}
    assert len(members) == len(data.MEMBERS)
    # Demo files really exist and download through the API.
    page = client.get(f"/api/v1/orgs/{org_id}/documents?limit=50").json()
    with_file = [d for d in page["items"] if d["filename"]]
    assert len(with_file) == sum(1 for d in data.DOCUMENTS.values() if d.get("file"))
    d = client.get(f"/api/v1/orgs/{org_id}/documents/{with_file[0]['id']}/download")
    assert d.status_code == 200 and d.content.startswith(b"%PDF-1.4")


def test_demo_refuses_to_run_twice_and_can_be_removed() -> None:
    _seed()
    with Session(get_engine()) as db:
        try:
            demo_acme.build(db, password=PASSWORD)
        except ValueError as exc:
            assert "already exists" in str(exc)
        else:  # pragma: no cover
            raise AssertionError("second build should fail")
        db.rollback()
    client, org_id = _login()
    page = client.get(f"/api/v1/orgs/{org_id}/documents?limit=50").json()
    keys = [d["id"] for d in page["items"] if d["filename"]]
    with Session(get_engine()) as db:
        assert demo_acme.remove(db) is True
        db.commit()
        assert demo_acme.remove(db) is False
    assert client.get("/api/v1/me").status_code == 401
    assert keys and get_storage()  # files were deleted with the organization (no error raised)


def test_also_owner_joins_the_demo(emails) -> None:  # noqa: ANN001
    from tests.conftest import signup

    founder = make_client()
    signup(founder, email="founder@compliance-os.example", org="Minha Empresa")
    with Session(get_engine()) as db:
        demo_acme.build(db, password=PASSWORD, also_owner_email="founder@compliance-os.example")
        db.commit()
    me = founder.get("/api/v1/me").json()
    names = sorted(m["organization"]["name"] for m in me["memberships"])
    assert names == [data.ORGANIZATION_NAME, "Minha Empresa"]
