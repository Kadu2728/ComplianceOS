import { NextRequest } from "next/server";

/**
 * BFF proxy (decision D3): the browser only ever talks to the app origin. Every /api/v1/* call
 * is forwarded to FastAPI with the same path, so the API's cookie paths (e.g. /api/v1/auth for
 * the refresh cookie) stay valid and all auth cookies are first-party to the app domain.
 *
 * Forwarded: method, body, Cookie, Content-Type, Origin (the API enforces its Origin check),
 * X-Request-ID (generated here when absent). Returned: status, body, Set-Cookie (all of them).
 */

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";
// x-forwarded-for: the platform's client IP, so the API's per-IP rate limits see the real client
// (the API must run with --proxy-headers and trust only this server's address — see README).
const REQUEST_HEADERS = ["cookie", "content-type", "origin", "x-request-id", "accept", "x-forwarded-for"];
const RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "content-disposition",
  "x-content-type-options",
  "x-request-id",
  "cache-control",
];

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const url = new URL(`${API_BASE_URL}/api/v1/${path.join("/")}`);
  url.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("x-request-id")) headers.set("x-request-id", crypto.randomUUID());

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function POST(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function PATCH(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
