"""Evidence and document file storage (decisions D9, D12).

`StorageBackend` is the only surface the rest of the application sees. `LocalDiskStorage` serves
development and tests; `S3Storage` talks to any S3-compatible object store (AWS S3, Cloudflare R2,
Backblaze B2, MinIO…) with private objects — the provider and region remain decision D12. Keys
are always server-generated and organization-prefixed.
"""

import shutil
import uuid
from collections.abc import Iterator
from pathlib import Path
from typing import Any, BinaryIO, Protocol

from app.core.config import get_settings


class StorageBackend(Protocol):
    def put(self, key: str, stream: BinaryIO) -> int: ...
    def open(self, key: str) -> Iterator[bytes]: ...
    def delete(self, key: str) -> None: ...


def new_key(organization_id: uuid.UUID, evidence_id: uuid.UUID, extension: str) -> str:
    """`<org>/<evidence-id>.<ext>` — no user input reaches the key."""
    ext = "".join(ch for ch in extension.lower() if ch.isalnum())[:8]
    return f"{organization_id}/{evidence_id}.{ext}" if ext else f"{organization_id}/{evidence_id}"


class StorageDisabledError(Exception):
    """File uploads are switched off in this installation (beta without a bucket, D17)."""


class DisabledStorage:
    def put(self, key: str, stream: BinaryIO) -> int:
        raise StorageDisabledError

    def open(self, key: str) -> Iterator[bytes]:
        raise StorageDisabledError

    def delete(self, key: str) -> None:
        return None  # nothing was ever stored


class LocalDiskStorage:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if self.root not in path.parents:
            raise ValueError("invalid storage key")
        return path

    def put(self, key: str, stream: BinaryIO) -> int:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as out:
            shutil.copyfileobj(stream, out)
        return path.stat().st_size

    def open(self, key: str) -> Iterator[bytes]:
        path = self._path(key)
        with path.open("rb") as f:
            while chunk := f.read(64 * 1024):
                yield chunk

    def delete(self, key: str) -> None:
        path = self._path(key)
        path.unlink(missing_ok=True)


class S3Storage:
    """Private objects in one bucket, optionally under a key prefix. The client comes from
    boto3's default credential chain unless explicit keys are configured; a custom
    `endpoint_url` selects a non-AWS provider. Uploads are bounded by `EVIDENCE_MAX_BYTES`
    before they reach this class, so the body is sent in one request."""

    def __init__(self, client: Any, bucket: str, prefix: str = "") -> None:
        self.client = client
        self.bucket = bucket
        self.prefix = prefix.strip("/")

    def _key(self, key: str) -> str:
        if not key or key.startswith("/") or ".." in key.split("/"):
            raise ValueError("invalid storage key")
        return f"{self.prefix}/{key}" if self.prefix else key

    def put(self, key: str, stream: BinaryIO) -> int:
        body = stream.read()
        self.client.put_object(Bucket=self.bucket, Key=self._key(key), Body=body)
        return len(body)

    def open(self, key: str) -> Iterator[bytes]:
        obj = self.client.get_object(Bucket=self.bucket, Key=self._key(key))
        yield from obj["Body"].iter_chunks(64 * 1024)

    def delete(self, key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=self._key(key))


def build_s3_client() -> Any:
    import boto3  # imported lazily: development and tests never need it

    s = get_settings()
    return boto3.client(
        "s3",
        region_name=s.s3_region,
        endpoint_url=s.s3_endpoint_url,
        aws_access_key_id=s.s3_access_key_id,
        aws_secret_access_key=s.s3_secret_access_key,
    )


_backend: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _backend
    if _backend is None:
        s = get_settings()
        if s.storage_backend == "s3":
            _backend = S3Storage(build_s3_client(), s.s3_bucket, s.s3_key_prefix)
        elif s.storage_backend == "disabled":
            _backend = DisabledStorage()
        else:
            _backend = LocalDiskStorage(Path(s.storage_local_root))
    return _backend


def set_storage(backend: StorageBackend | None) -> None:
    global _backend
    _backend = backend
