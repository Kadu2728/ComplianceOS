import "server-only";

import { cookies } from "next/headers";

/**
 * The organization a person with several memberships is currently working in. A plain
 * preference: the API authorizes every request by membership, so a stale or forged value can
 * only fall back to the first organization the person actually belongs to.
 */
export const ORG_COOKIE = "cos_org";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function readPreferredOrganization(): Promise<string | null> {
  return (await cookies()).get(ORG_COOKIE)?.value ?? null;
}

export async function writePreferredOrganization(organizationId: string): Promise<void> {
  (await cookies()).set(ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
