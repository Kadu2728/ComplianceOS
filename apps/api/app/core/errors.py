import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.email import EmailDeliveryError
from app.core.request_id import REQUEST_ID_HEADER, get_request_id

logger = logging.getLogger(__name__)

# Stable machine-readable codes. Never expose exception text for 5xx (decision D19).
_STATUS_CODES: dict[int, str] = {
    400: "bad_request",
    401: "unauthenticated",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    422: "validation_error",
    429: "rate_limited",
}


def error_response(
    status_code: int,
    message: str,
    *,
    code: str | None = None,
    details: Any = None,
) -> JSONResponse:
    body: dict[str, Any] = {
        "code": code or _STATUS_CODES.get(status_code, "error"),
        "message": message,
        "request_id": get_request_id(),
    }
    if details is not None:
        body["details"] = details
    return JSONResponse(
        status_code=status_code,
        content=body,
        headers={REQUEST_ID_HEADER: get_request_id()},
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def _http_exception(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return error_response(exc.status_code, detail)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return error_response(
            422,
            "Request validation failed.",
            details=[
                {"loc": list(e.get("loc", ())), "msg": e.get("msg"), "type": e.get("type")}
                for e in exc.errors()
            ],
        )

    @app.exception_handler(EmailDeliveryError)
    async def _email_unavailable(_: Request, exc: EmailDeliveryError) -> JSONResponse:
        # The service transaction is rolled back by the request scope, so nothing was created.
        logger.warning("email delivery unavailable request_id=%s", get_request_id())
        return error_response(
            503,
            "The e-mail could not be sent right now. Try again in a few minutes.",
            code="email_unavailable",
        )

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled error request_id=%s", get_request_id())
        return error_response(500, "Internal server error.", code="internal_error")
