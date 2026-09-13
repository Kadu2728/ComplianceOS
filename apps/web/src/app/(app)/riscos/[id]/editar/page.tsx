import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { RiskForm } from "@/components/domain/risk-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { type Risk, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Editar risco" };

/** Managers edit any risk; a member edits only a risk assigned to them (the API enforces both). */
export default async function EditarRiscoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const risk = await apiGet<Risk>(`/api/v1/orgs/${orgId}/risks/${id}`);
  if (!risk) notFound();
  const canEdit = isManager(session.membership.role) || risk.owner?.membership_id === session.membership.id;
  if (!canEdit) redirect(`/riscos/${id}`);
  return (
    <>
      <PageHeader eyebrow="Riscos" title="Editar risco" description="Alterar probabilidade ou impacto recalcula a severidade. O status muda na página do risco." />
      <RiskForm
        orgId={orgId}
        members={await memberOptions(orgId)}
        initial={{
          id: risk.id,
          title: risk.title,
          description: risk.description ?? null,
          category: risk.category,
          probability: risk.probability,
          impact: risk.impact,
          owner_membership_id: risk.owner?.membership_id ?? null,
          due_date: risk.due_date ?? null,
          treatment: risk.treatment ?? null,
        }}
      />
    </>
  );
}
