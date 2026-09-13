import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DocumentForm } from "@/components/domain/document-form";
import { PageHeader } from "@/components/ui/page-header";
import { isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Adicionar documento" };

export default async function NovoDocumentoPage() {
  const session = await getSession();
  if (!session) return null;
  if (!isManager(session.membership.role)) redirect("/documentos");
  const orgId = session.membership.organization.id;
  return (
    <>
      <PageHeader eyebrow="Documentos" title="Adicionar documento" description="Registre o documento com responsável e validade. O arquivo pode ser enviado em seguida." />
      <DocumentForm orgId={orgId} members={await memberOptions(orgId)} />
    </>
  );
}
