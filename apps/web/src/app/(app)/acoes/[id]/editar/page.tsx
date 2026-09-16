import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ActionForm } from "@/components/domain/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { type Action, type RiskPage, controlOptions, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Editar ação" };

export default async function EditarAcaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const action = await apiGet<Action>(`/api/v1/orgs/${orgId}/actions/${id}`);
  if (!action) notFound();
  const canEdit = isManager(session.membership.role) || action.owner?.membership_id === session.membership.id;
  if (!canEdit) redirect(`/acoes/${id}`);
  const [members, risks, controls] = await Promise.all([
    memberOptions(orgId),
    apiGet<RiskPage>(`/api/v1/orgs/${orgId}/risks?limit=50&status=aberto&status=em_andamento&status=em_revisao`),
    controlOptions(orgId),
  ]);
  const options = (risks?.items ?? []).map((r) => ({ id: r.id, title: r.title }));
  return (
    <>
      <PageHeader eyebrow="Ações" title="Editar ação" description="Título, descrição, risco relacionado, responsável e prazo. O status muda na página da ação." />
      <ActionForm
        orgId={orgId}
        members={members}
        risks={options}
        controls={controls}
        initial={{
          id: action.id,
          title: action.title,
          description: action.description ?? null,
          risk_id: action.risk_id ?? null,
          control_id: action.control_id ?? null,
          owner_membership_id: action.owner?.membership_id ?? null,
          due_date: action.due_date ?? null,
          effort: action.effort ?? null,
        }}
      />
    </>
  );
}
