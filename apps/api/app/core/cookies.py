"""Auth cookies (decision D3): httpOnly, SameSite=Lax, Secure outside development.

The refresh cookie is scoped to the auth path so it is not sent with every API call.
"""

from fastapi import Response

from app.core.config import get_settings

ACCESS_COOKIE = "cos_access"
REFRESH_COOKIE = "cos_refresh"
REFRESH_PATH = "/api/v1/auth"


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    s = get_settings()
    common = {
        "httponly": True,
        "samesite": "lax",
        "secure": s.cookie_secure,
        "domain": s.cookie_domain,
    }
    response.set_cookie(
        ACCESS_COOKIE, access_token, max_age=s.access_token_ttl_minutes * 60, path="/", **common
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=s.refresh_token_ttl_days * 86400,
        path=REFRESH_PATH,
        **common,
    )


def clear_auth_cookies(response: Response) -> None:
    s = get_settings()
    response.delete_cookie(ACCESS_COOKIE, path="/", domain=s.cookie_domain)
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_PATH, domain=s.cookie_domain)
