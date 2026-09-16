import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/domain/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { type RiskPage, controlOptions, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Nova ação" };

export default async function NovaAcaoPage({ searchParams }: { searchParams: Promise<{ controle?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (!isManager(session.membership.role)) redirect("/acoes");
  const orgId = session.membership.organization.id;
  const { controle } = await searchParams;
  const [members, risks, controls] = await Promise.all([
    memberOptions(orgId),
    apiGet<RiskPage>(`/api/v1/orgs/${orgId}/risks?limit=50&status=aberto&status=em_andamento&status=em_revisao`),
    controlOptions(orgId),
  ]);
  const controlId = controls.some((c) => c.id === controle) ? controle : undefined;
  return (
    <>
      <PageHeader eyebrow="Ações" title="Nova ação" description="Uma ação tem responsável, prazo e, sempre que possível, o risco que ela trata e o controle que ela implementa." />
      <ActionForm orgId={orgId} members={members} risks={(risks?.items ?? []).map((r) => ({ id: r.id, title: r.title }))} controls={controls} controlId={controlId} />
    </>
  );
}
