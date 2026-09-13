from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.csrf import OriginCheckMiddleware
from app.core.errors import register_error_handlers
from app.core.headers import SecurityHeadersMiddleware
from app.core.logging import configure_logging
from app.core.request_id import RequestIdMiddleware
from app.core.version import APP_VERSION


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="Compliance OS API",
        version=APP_VERSION,
        docs_url="/api/docs" if settings.app_env != "production" else None,
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    # Middleware order: the last added runs first. Request-ID must wrap CORS so that
    # every response, including CORS preflight and error responses, carries the header.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )
    app.add_middleware(OriginCheckMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestIdMiddleware)
    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
