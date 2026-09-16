import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ControlForm } from "@/components/domain/control-form";
import { PageHeader } from "@/components/ui/page-header";
import { documentOptions, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Novo controle" };

export default async function NovoControlePage({ searchParams }: { searchParams: Promise<{ risco?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (!isManager(session.membership.role)) redirect("/controles");
  const orgId = session.membership.organization.id;
  const { risco } = await searchParams;
  const riskId = risco && /^[0-9a-f-]{36}$/i.test(risco) ? risco : undefined;
  const [members, documents] = await Promise.all([memberOptions(orgId), documentOptions(orgId)]);
  return (
    <>
      <PageHeader eyebrow="Controles" title="Novo controle" description="Registre uma salvaguarda que existe ou que a empresa vai implementar. Vincule riscos, ações e evidências na página do controle." />
      <ControlForm orgId={orgId} members={members} documents={documents} riskId={riskId} />
    </>
  );
}
