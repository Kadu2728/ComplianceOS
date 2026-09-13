from fastapi import APIRouter
from pydantic import BaseModel

from app.core.version import APP_VERSION

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    version: str


@router.get("/health", response_model=HealthResponse, summary="Liveness check")
async def health() -> HealthResponse:
    """Liveness only. Does not touch the database (Phase 1)."""
    return HealthResponse(status="ok", version=APP_VERSION)
