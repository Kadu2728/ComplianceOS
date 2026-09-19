import { type NextRequest, NextResponse } from "next/server";
import { LANDING_PATH, shouldShowLanding } from "@/lib/marketing/entry";

const ACCESS_COOKIE = "cos_access";

/**
 * Per-request Content Security Policy with a script nonce (CLAUDE.md §9). Next reads the nonce
 * from the CSP request header it receives here and stamps every script tag it emits with it;
 * `'strict-dynamic'` then trusts the chunks those scripts load and nothing else, so an injected
 * inline `<script>` cannot run. The dev server still needs eval for its overlay and HMR.
 * The remaining headers stay in `next.config.ts` (static, no per-request value).
 *
 * Root route: an anonymous visitor at `/` is served the landing (`/inicio`) through a rewrite —
 * the URL stays `/`, the CSP request headers travel with it. Anyone carrying the access cookie
 * keeps the application at `/` (`lib/marketing/entry.ts`).
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const landing = shouldShowLanding(request.nextUrl.pathname, request.cookies.has(ACCESS_COOKIE));
  const response = landing
    ? NextResponse.rewrite(new URL(LANDING_PATH, request.url), { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Everything Next renders; static assets carry no script context and the BFF answers JSON
      // (the API sets its own headers). Prefetches skip it: they return RSC payloads, not pages.
      source: "/((?!api/v1|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
