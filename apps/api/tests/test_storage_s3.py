"""S3-compatible backend (decision D12) against moto's in-process S3, including the evidence
upload → download → delete route sequence with the backend swapped in."""

import io
import uuid
from collections.abc import Iterator

import boto3
import pytest
from botocore.exceptions import ClientError
from moto import mock_aws

from app.core.config import Settings
from app.core.storage import S3Storage, get_storage, new_key, set_storage
from tests.conftest import make_client, signup

PDF = b"%PDF-1.4\n%fake\n" + b"0" * 200


@pytest.fixture
def s3() -> Iterator[S3Storage]:
    with mock_aws():
        client = boto3.client(
            "s3", region_name="us-east-1", aws_access_key_id="x", aws_secret_access_key="y"
        )
        client.create_bucket(Bucket="cos-evidence")
        yield S3Storage(client, "cos-evidence", prefix="/tenants/")


def test_put_open_delete_round_trip_under_prefix(s3: S3Storage) -> None:
    key = new_key(uuid.uuid4(), uuid.uuid4(), "pdf")
    assert s3.put(key, io.BytesIO(PDF)) == len(PDF)
    assert b"".join(s3.open(key)) == PDF
    stored = s3.client.list_objects_v2(Bucket="cos-evidence")["Contents"]
    assert [o["Key"] for o in stored] == [f"tenants/{key}"]
    s3.delete(key)
    with pytest.raises(ClientError):
        s3.client.get_object(Bucket="cos-evidence", Key=f"tenants/{key}")


@pytest.mark.parametrize("bad", ["", "/abs", "a/../b"])
def test_rejects_unsafe_keys(s3: S3Storage, bad: str) -> None:
    with pytest.raises(ValueError):
        s3.put(bad, io.BytesIO(b"x"))


def test_evidence_routes_work_with_s3(s3: S3Storage) -> None:
    previous = get_storage()
    set_storage(s3)
    try:
        owner = make_client()
        oid = signup(owner, email="owner@acme.com.br")["org_id"]
        risk = owner.post(
            f"/api/v1/orgs/{oid}/risks",
            json={
                "title": "Backups sem teste",
                "category": "seguranca",
                "probability": 2,
                "impact": 3,
            },
        ).json()
        r = owner.post(
            f"/api/v1/orgs/{oid}/evidence/files",
            data={"risk_id": risk["id"]},
            files={"file": ("relatorio.pdf", io.BytesIO(PDF), "application/pdf")},
        )
        assert r.status_code == 201, r.text
        ev = r.json()
        assert ev["size_bytes"] == len(PDF)
        keys = [o["Key"] for o in s3.client.list_objects_v2(Bucket="cos-evidence")["Contents"]]
        assert keys == [f"tenants/{oid}/{ev['id']}.pdf"]
        d = owner.get(f"/api/v1/orgs/{oid}/evidence/{ev['id']}/download")
        assert d.status_code == 200 and d.content == PDF
        assert owner.delete(f"/api/v1/orgs/{oid}/evidence/{ev['id']}").status_code == 200
        assert "Contents" not in s3.client.list_objects_v2(Bucket="cos-evidence")
    finally:
        set_storage(previous)


def test_settings_guard_requires_bucket(monkeypatch) -> None:  # noqa: ANN001
    monkeypatch.setenv("STORAGE_BACKEND", "s3")
    with pytest.raises(ValueError, match="S3_BUCKET"):
        Settings(_env_file=None)
    monkeypatch.setenv("S3_BUCKET", "cos-evidence")
    assert Settings(_env_file=None).storage_backend == "s3"
