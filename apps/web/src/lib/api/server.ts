import "server-only";

import { cookies, headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

/**
 * Server-component fetch to the API with the browser's cookies forwarded. 401 → login page;
 * 404 → `null` (tenant rule: outside-tenant resources look like missing ones). Other errors throw.
 */
export async function apiGet<T>(path: string): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  const requestId = (await headers()).get("x-request-id") ?? crypto.randomUUID();
  const init: RequestInit = { headers: { cookie: cookieHeader, "x-request-id": requestId }, cache: "no-store" };
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    // Socket-level failure (e.g. ECONNRESET when a keep-alive connection the server just closed is
    // reused). A GET is idempotent: retry once on a fresh connection before giving up.
    res = await fetch(`${API_BASE_URL}${path}`, init);
  }
  if (res.status === 401) redirect("/entrar");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} on ${path} (request ${requestId})`);
  return (await res.json()) as T;
}

/**
 * Like `apiGet`, but a failing source becomes `null` instead of throwing, so one broken block never
 * takes a whole page down (visual-v2 §4.5: partial data never hides a working card). Framework
 * control flow (the 401 redirect) is rethrown untouched.
 */
export async function apiGetSafe<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    return null;
  }
}
