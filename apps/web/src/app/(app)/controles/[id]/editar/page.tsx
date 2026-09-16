import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ControlForm } from "@/components/domain/control-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { type ControlGraph, documentOptions, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Editar controle" };

export default async function EditarControlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const graph = await apiGet<ControlGraph>(`/api/v1/orgs/${orgId}/controls/${id}`);
  if (!graph) notFound();
  const c = graph.control;
  const canEdit = isManager(session.membership.role) || c.owner?.membership_id === session.membership.id;
  if (!canEdit) redirect(`/controles/${id}`);
  const [members, documents] = await Promise.all([memberOptions(orgId), documentOptions(orgId)]);
  return (
    <>
      <PageHeader eyebrow="Controles" title="Editar controle" description="A maturidade “Verificado” é definida na página do controle, com evidência." />
      <ControlForm
        orgId={orgId}
        members={members}
        documents={documents}
        initial={{
          id: c.id,
          title: c.title,
          description: c.description ?? null,
          category: c.category,
          kind: c.kind,
          status: c.status,
          owner_membership_id: c.owner?.membership_id ?? null,
          document_id: c.document?.id ?? null,
          review_date: c.review_date ?? null,
        }}
      />
    </>
  );
}
