import re
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"
_VALID_REQUEST_ID = re.compile(r"^[A-Za-z0-9-]{8,128}$")

_request_id: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    """Request id of the current request, or "-" outside a request context."""
    return _request_id.get()


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Accept a well-formed inbound `X-Request-ID` or generate one; echo it on the response.

    The web app forwards its own id so one identifier follows a request across services.
    Malformed inbound values are discarded rather than propagated into logs.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        inbound = request.headers.get(REQUEST_ID_HEADER)
        request_id = inbound if inbound and _VALID_REQUEST_ID.match(inbound) else str(uuid.uuid4())
        token = _request_id.set(request_id)
        try:
            response = await call_next(request)
        finally:
            _request_id.reset(token)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response
