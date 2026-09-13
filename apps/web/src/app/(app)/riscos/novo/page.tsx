import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RiskForm } from "@/components/domain/risk-form";
import { PageHeader } from "@/components/ui/page-header";
import { isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Registrar risco" };

export default async function NovoRiscoPage() {
  const session = await getSession();
  if (!session) return null;
  if (!isManager(session.membership.role)) redirect("/riscos");
  const orgId = session.membership.organization.id;
  return (
    <>
      <PageHeader eyebrow="Riscos" title="Registrar risco" description="Descreva o risco e classifique probabilidade e impacto. A severidade é calculada." />
      <RiskForm orgId={orgId} members={await memberOptions(orgId)} />
    </>
  );
}
