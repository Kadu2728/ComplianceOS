"""Origin check for state-changing requests (defense in depth next to SameSite=Lax cookies).

Browsers always attach `Origin` on cross-origin unsafe requests; if it is present and not an
allowed origin, the request is rejected before any handler runs. Requests without `Origin`
(non-browser clients) carry no victim cookies, so they pass through.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings
from app.core.request_id import REQUEST_ID_HEADER, get_request_id

UNSAFE = {"POST", "PUT", "PATCH", "DELETE"}


class OriginCheckMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method in UNSAFE and request.cookies:
            origin = request.headers.get("origin")
            if origin and origin not in get_settings().cors_origins:
                return JSONResponse(
                    status_code=403,
                    content={
                        "code": "forbidden_origin",
                        "message": "Origin not allowed.",
                        "request_id": get_request_id(),
                    },
                    headers={REQUEST_ID_HEADER: get_request_id()},
                )
        return await call_next(request)
