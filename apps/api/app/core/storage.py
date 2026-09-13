"""Evidence file storage (decisions D9, D12).

`StorageBackend` is the only surface the rest of the application sees. `LocalDiskStorage` serves
development and tests; an S3-compatible backend with private objects will implement the same
protocol once D12 is decided. Keys are always server-generated and organization-prefixed.
"""

import shutil
import uuid
from collections.abc import Iterator
from pathlib import Path
from typing import BinaryIO, Protocol

from app.core.config import get_settings


class StorageBackend(Protocol):
    def put(self, key: str, stream: BinaryIO) -> int: ...
    def open(self, key: str) -> Iterator[bytes]: ...
    def delete(self, key: str) -> None: ...


def new_key(organization_id: uuid.UUID, evidence_id: uuid.UUID, extension: str) -> str:
    """`<org>/<evidence-id>.<ext>` — no user input reaches the key."""
    ext = "".join(ch for ch in extension.lower() if ch.isalnum())[:8]
    return f"{organization_id}/{evidence_id}.{ext}" if ext else f"{organization_id}/{evidence_id}"


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


_backend: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _backend
    if _backend is None:
        s = get_settings()
        _backend = LocalDiskStorage(Path(s.storage_local_root))
    return _backend


def set_storage(backend: StorageBackend | None) -> None:
    global _backend
    _backend = backend
