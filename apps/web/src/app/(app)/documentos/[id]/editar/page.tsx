import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DocumentForm } from "@/components/domain/document-form";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { type Document, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Editar documento" };

export default async function EditarDocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const doc = await apiGet<Document>(`/api/v1/orgs/${orgId}/documents/${id}`);
  if (!doc) notFound();
  const canEdit = isManager(session.membership.role) || doc.owner?.membership_id === session.membership.id;
  if (!canEdit) redirect(`/documentos/${id}`);
  return (
    <>
      <PageHeader eyebrow="Documentos" title="Editar documento" description="Situação e validade definem o status. O arquivo é substituído na página do documento." />
      <DocumentForm
        orgId={orgId}
        members={await memberOptions(orgId)}
        initial={{
          id: doc.id,
          name: doc.name,
          description: doc.description ?? null,
          category: doc.category,
          version: doc.version,
          review_state: doc.review_state,
          owner_membership_id: doc.owner?.membership_id ?? null,
          valid_until: doc.valid_until ?? null,
          tags: doc.tags,
          url: doc.url ?? null,
        }}
      />
    </>
  );
}
