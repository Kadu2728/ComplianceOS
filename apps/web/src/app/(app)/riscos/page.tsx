import type { Metadata } from "next";
import { RiskTable } from "@/components/domain/risk-table";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { apiGet } from "@/lib/api/server";
import { pageQuery } from "@/lib/domain/paging";
import { type Overview, type RiskPage, isManager } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Riscos" };

export default async function RiscosPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const { limit, offset } = pageQuery((await searchParams).page);
  const [pageData, overview] = await Promise.all([
    apiGet<RiskPage>(`/api/v1/orgs/${orgId}/risks?limit=${limit}&offset=${offset}`),
    apiGet<Overview>(`/api/v1/orgs/${orgId}/overview`),
  ]);
  const page = pageData ?? { items: [], total: 0, limit, offset };
  const canCreate = isManager(session.membership.role);
  const open = overview?.risks.open ?? 0;
  const critical = overview?.risks.by_severity.critico ?? 0;

  return (
    <>
      <PageHeader
        title="Riscos"
        description={
          page.total === 0
            ? "O que precisa de atenção, por severidade."
            : `${open} ${open === 1 ? "risco aberto" : "riscos abertos"}${critical ? ` · ${critical} ${critical === 1 ? "crítico" : "críticos"}` : ""}`
        }
        action={canCreate ? <ButtonLink href="/riscos/novo">Registrar risco</ButtonLink> : undefined}
      />
      {page.items.length === 0 ? (
        <EmptyState
          title="Nenhum risco registrado."
          description="Conclua o diagnóstico para identificar os primeiros riscos, ou registre um risco manualmente."
          actions={
            <>
              <ButtonLink href="/diagnostico" variant="secondary">
                Ir para o diagnóstico
              </ButtonLink>
              {canCreate ? <ButtonLink href="/riscos/novo">Registrar risco</ButtonLink> : null}
            </>
          }
        />
      ) : (
        <>
          <RiskTable risks={page.items} />
          <Pagination total={page.total} limit={page.limit} offset={page.offset} href="/riscos" />
        </>
      )}
    </>
  );
}
