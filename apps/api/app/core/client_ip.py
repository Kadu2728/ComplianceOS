"""Client IP for per-IP rate limits (decision D23), proxy-aware when configured (D17).

Behind Vercel / Render / Koyeb the socket peer is the platform's proxy; the first entry of
`X-Forwarded-For` is the client. Trusting that header on a host that does not set it would let a
client pick its own bucket, so it is opt-in (`TRUST_PROXY_HEADERS`).
"""

from fastapi import Request

from app.core.config import get_settings


def client_ip(request: Request) -> str:
    if get_settings().trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for", "")
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else "unknown"
