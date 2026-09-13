import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

/**
 * Server-component fetch to the API with the browser's cookies forwarded. 401 → login page;
 * 404 → `null` (tenant rule: outside-tenant resources look like missing ones). Other errors throw.
 */
export async function apiGet<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  const requestId = (await headers()).get("x-request-id") ?? crypto.randomUUID();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { cookie: cookieHeader, "x-request-id": requestId },
    cache: "no-store",
  });
  if (res.status === 401) redirect("/entrar");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} on ${path} (request ${requestId})`);
  return (await res.json()) as T;
}
