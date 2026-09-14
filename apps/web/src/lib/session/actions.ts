"use server";

import { redirect } from "next/navigation";
import { writePreferredOrganization } from "@/lib/session/org-cookie";
import { getSession } from "@/lib/session/server";

/**
 * Switch the current organization (Server Action: same-origin checked by Next). Only an
 * organization the signed-in person belongs to is accepted; the value comes from `/me`, never
 * from the form alone.
 */
export async function switchOrganization(formData: FormData): Promise<void> {
  const requested = String(formData.get("organization_id") ?? "");
  const session = await getSession();
  if (!session) redirect("/entrar");
  const target = session.memberships.find((m) => m.organization.id === requested);
  if (target) await writePreferredOrganization(target.organization.id);
  redirect("/");
}

/** After accepting an invitation: open the organization just joined. */
export async function rememberOrganization(organizationId: string): Promise<boolean> {
  const session = await getSession();
  const target = session?.memberships.find((m) => m.organization.id === organizationId);
  if (!target) return false;
  await writePreferredOrganization(target.organization.id);
  return true;
}
