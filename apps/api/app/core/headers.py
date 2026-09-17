"""Response hardening headers for every API response (CLAUDE.md §9).

The API serves JSON and file downloads only, so the policy is short: never sniff content types,
never frame, never cache authenticated responses by default (routes that stream files set their own
`Cache-Control`), and send no referrer. The web app carries its own, richer CSP.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        for name, value in SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        if "cache-control" not in response.headers:
            response.headers["Cache-Control"] = "no-store"
        if get_settings().app_env == "production":
            # Production is HTTPS-only (COOKIE_SECURE is enforced); tell browsers to remember it.
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )
        return response
