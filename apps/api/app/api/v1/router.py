from fastapi import APIRouter

from app.api.v1 import (
    assessment,
    auth,
    controls,
    documents,
    evidence,
    health,
    insights,
    orgs,
    overview,
    profile,
    risks,
    room,
    score,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(orgs.router)
api_router.include_router(risks.router)
api_router.include_router(evidence.router)
api_router.include_router(assessment.router)
api_router.include_router(score.router)
api_router.include_router(overview.router)
api_router.include_router(documents.router)
api_router.include_router(controls.router)
api_router.include_router(profile.router)
api_router.include_router(insights.router)
api_router.include_router(room.router)
api_router.include_router(room.public_router)
