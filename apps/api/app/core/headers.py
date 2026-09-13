"""Response hardening headers for every API response (CLAUDE.md §9).

The API serves JSON and file downloads only, so the policy is short: never sniff content types,
never frame, never cache authenticated responses by default (routes that stream files set their own
`Cache-Control`), and send no referrer. The web app carries its own, richer CSP.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

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
        return response
