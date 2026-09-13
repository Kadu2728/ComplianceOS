import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { paths } from "@/lib/api/schema";

/**
 * Server-side session (server components only). Reads the auth cookies the browser sent to
 * the app origin and calls the API directly, forwarding the request id. Never used in the
 * browser: client code goes through the /api/v1 proxy.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

export type Me = paths["/api/v1/me"]["get"]["responses"]["200"]["content"]["application/json"];
export type Session = { user: Me["user"]; membership: Me["memberships"][number] } | null;

export const getSession = cache(async (): Promise<Session> => {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;
  const requestId = (await headers()).get("x-request-id") ?? crypto.randomUUID();
  const res = await fetch(`${API_BASE_URL}/api/v1/me`, {
    headers: { cookie: cookieHeader, "x-request-id": requestId },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const me = (await res.json()) as Me;
  const membership = me.memberships[0];
  // Phase 2: a user with several organizations sees the first one (no switcher yet — D9/app-shell §1).
  return membership ? { user: me.user, membership } : null;
});
