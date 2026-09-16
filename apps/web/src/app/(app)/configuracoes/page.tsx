import type { Metadata } from "next";
import { MembersPanel } from "@/components/settings/members-panel";
import { OrganizationForm } from "@/components/settings/organization-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import type { paths } from "@/lib/api/schema";
import { ROLE_LABEL } from "@/lib/domain/labels";
import { type Profile, isManager } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Configurações" };

type Members = paths["/api/v1/orgs/{org_id}/members"]["get"]["responses"]["200"]["content"]["application/json"];
type Invitations = paths["/api/v1/orgs/{org_id}/members/invitations"]["get"]["responses"]["200"]["content"]["application/json"];

export default async function ConfiguracoesPage() {
  const session = await getSession();
  if (!session) return null; // layout already redirected
  const orgId = session.membership.organization.id;
  const role = session.membership.role;
  const canManage = isManager(role);
  const [members, invitations, profile] = await Promise.all([
    apiGet<Members>(`/api/v1/orgs/${orgId}/members`),
    canManage ? apiGet<Invitations>(`/api/v1/orgs/${orgId}/members/invitations`) : Promise.resolve([]),
    apiGet<Profile>(`/api/v1/orgs/${orgId}/profile`),
  ]);

  return (
    <>
      <PageHeader title="Configurações" description="Organização, perfil de compliance e membros." />
      <div className="flex flex-col gap-6">
        <section className="rounded-lg border border-border bg-surface-elevated p-6">
          <h2 className="text-h3">Organização</h2>
          {role === "owner" ? (
            <div className="mt-4">
              <OrganizationForm orgId={orgId} name={session.membership.organization.name} />
            </div>
          ) : null}
          <dl className="mt-4 grid grid-cols-1 gap-3 text-body-sm md:grid-cols-[160px_1fr]">
            {role !== "owner" ? (
              <>
                <dt className="text-text-secondary">Nome</dt>
                <dd className="text-text-primary">{session.membership.organization.name}</dd>
              </>
            ) : null}
            <dt className="text-text-secondary">Seu papel</dt>
            <dd className="text-text-primary">{ROLE_LABEL[role] ?? role}</dd>
            <dt className="text-text-secondary">Seu e-mail</dt>
            <dd className="text-text-primary">{session.user.email}</dd>
          </dl>
        </section>
        <section id="perfil" aria-labelledby="perfil-titulo" className="rounded-lg border border-border bg-surface-elevated p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="perfil-titulo" className="text-h3">Perfil da organização</h2>
            <span className={`text-caption ${profile?.complete ? "text-success-text" : "text-warning-text"}`}>
              {profile?.complete ? "Perfil completo" : "Perfil incompleto — a priorização usa o que já foi informado"}
            </span>
          </div>
          <p className="mt-1 text-body-sm text-text-secondary">
            O contexto da empresa: segmento, tamanho, tipos de dados e sistemas. Ele ajusta a priorização e o radar. Nada aqui decide se uma obrigação legal se aplica.
          </p>
          <div className="mt-4">
            {profile ? (
              <ProfileForm
                orgId={orgId}
                canEdit={canManage}
                value={{
                  segment: profile.segment ?? null,
                  headcount_band: profile.headcount_band ?? null,
                  customer_type: profile.customer_type ?? null,
                  data_categories: profile.data_categories,
                  sells_to_enterprise: profile.sells_to_enterprise ?? null,
                  international_transfers: profile.international_transfers ?? null,
                  systems: profile.systems,
                  processes: profile.processes,
                  notes: profile.notes ?? null,
                  complete: profile.complete,
                }}
              />
            ) : (
              <p className="text-body-sm text-text-secondary">Perfil indisponível no momento.</p>
            )}
          </div>
        </section>
        <MembersPanel
          orgId={orgId}
          members={members ?? []}
          invitations={invitations ?? []}
          me={{ membershipId: session.membership.id }}
          canManage={canManage}
          isOwner={role === "owner"}
        />
      </div>
    </>
  );
}
