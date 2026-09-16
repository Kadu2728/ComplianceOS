import "server-only";

import { apiGet } from "@/lib/api/server";
import type { paths } from "@/lib/api/schema";
import type { MemberOption } from "@/components/domain/risk-form";

type Members =
  paths["/api/v1/orgs/{org_id}/members"]["get"]["responses"]["200"]["content"]["application/json"];
export type RiskPage =
  paths["/api/v1/orgs/{org_id}/risks"]["get"]["responses"]["200"]["content"]["application/json"];
export type Risk =
  paths["/api/v1/orgs/{org_id}/risks/{risk_id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type ActionPage =
  paths["/api/v1/orgs/{org_id}/actions"]["get"]["responses"]["200"]["content"]["application/json"];
export type Action =
  paths["/api/v1/orgs/{org_id}/actions/{action_id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type EvidenceList =
  paths["/api/v1/orgs/{org_id}/evidence"]["get"]["responses"]["200"]["content"]["application/json"];
export type Overview =
  paths["/api/v1/orgs/{org_id}/overview"]["get"]["responses"]["200"]["content"]["application/json"];
export type AuditPage =
  paths["/api/v1/orgs/{org_id}/audit-log"]["get"]["responses"]["200"]["content"]["application/json"];
export type DocumentPage =
  paths["/api/v1/orgs/{org_id}/documents"]["get"]["responses"]["200"]["content"]["application/json"];
export type Document =
  paths["/api/v1/orgs/{org_id}/documents/{document_id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type ScoreHistory =
  paths["/api/v1/orgs/{org_id}/score/history"]["get"]["responses"]["200"]["content"]["application/json"];
export type ControlPage =
  paths["/api/v1/orgs/{org_id}/controls"]["get"]["responses"]["200"]["content"]["application/json"];
export type Control = ControlPage["items"][number];
export type ControlGraph =
  paths["/api/v1/orgs/{org_id}/controls/{control_id}"]["get"]["responses"]["200"]["content"]["application/json"];
export type Recommendation =
  paths["/api/v1/orgs/{org_id}/risks/{risk_id}/recommendation"]["get"]["responses"]["200"]["content"]["application/json"];
export type Priorities =
  paths["/api/v1/orgs/{org_id}/priorities"]["get"]["responses"]["200"]["content"]["application/json"];
export type Radar =
  paths["/api/v1/orgs/{org_id}/radar"]["get"]["responses"]["200"]["content"]["application/json"];
export type ExecutiveSummary =
  paths["/api/v1/orgs/{org_id}/executive-summary"]["get"]["responses"]["200"]["content"]["application/json"];
export type Profile =
  paths["/api/v1/orgs/{org_id}/profile"]["get"]["responses"]["200"]["content"]["application/json"];

export async function memberOptions(orgId: string): Promise<MemberOption[]> {
  const members = (await apiGet<Members>(`/api/v1/orgs/${orgId}/members`)) ?? [];
  return members.map((m) => ({ membership_id: m.id, name: m.user.name }));
}

export const isManager = (role: string) => role === "owner" || role === "admin";

/** Documents a citation can point to (evidence panel). Capped at 50 like every list. */
export async function documentOptions(orgId: string): Promise<{ id: string; name: string }[]> {
  const page = await apiGet<DocumentPage>(`/api/v1/orgs/${orgId}/documents?limit=50`);
  return (page?.items ?? []).map((d) => ({ id: d.id, name: d.name }));
}

/** Controls an action or evidence can point to (Control Graph). Capped at 50 like every list. */
export async function controlOptions(orgId: string): Promise<{ id: string; title: string; status: string }[]> {
  const page = await apiGet<ControlPage>(`/api/v1/orgs/${orgId}/controls?limit=50`);
  return (page?.items ?? []).map((c) => ({ id: c.id, title: c.title, status: c.status }));
}
