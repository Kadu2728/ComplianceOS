import type { Metadata } from "next";
import { FilterBar } from "@/components/domain/filter-bar";
import { RiskTable } from "@/components/domain/risk-table";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { apiGet } from "@/lib/api/server";
import {
  RISK_STATUS_FILTER_LABELS,
  RISK_STATUS_FILTERS,
  SEVERITIES,
  filterHref,
  hasFilters,
  parseRiskFilters,
  riskQuery,
} from "@/lib/domain/filters";
import { SEVERITY } from "@/lib/domain/labels";
import { pageQuery } from "@/lib/domain/paging";
import { type Overview, type RiskPage, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Riscos" };

type Search = { page?: string; status?: string; severity?: string; owner?: string };

export default async function RiscosPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const params = await searchParams;
  const { limit, offset } = pageQuery(params.page);
  const filters = parseRiskFilters(params);
  const filtered = hasFilters(filters);
  const [pageData, overview, members] = await Promise.all([
    apiGet<RiskPage>(`/api/v1/orgs/${orgId}/risks?limit=${limit}&offset=${offset}${riskQuery(filters)}`),
    apiGet<Overview>(`/api/v1/orgs/${orgId}/overview`),
    memberOptions(orgId),
  ]);
  const page = pageData ?? { items: [], total: 0, limit, offset };
  const canCreate = isManager(session.membership.role);
  const open = overview?.risks.open ?? 0;
  const critical = overview?.risks.by_severity.critico ?? 0;
  const href = filterHref("/riscos", filters);
  const me = session.membership.id;
  const owners = [
    { value: me, label: "Meus riscos" },
    ...members.filter((m) => m.membership_id !== me).map((m) => ({ value: m.membership_id, label: m.name })),
  ];

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
      {page.total > 0 || filtered ? (
        <FilterBar
          action="/riscos"
          count={page.total}
          noun={["risco", "riscos"]}
          active={filtered}
          selects={[
            {
              name: "status",
              label: "Status",
              value: filters.status,
              all: "Todos os status",
              options: (Object.keys(RISK_STATUS_FILTERS) as (keyof typeof RISK_STATUS_FILTERS)[]).map((k) => ({ value: k, label: RISK_STATUS_FILTER_LABELS[k] })),
            },
            {
              name: "severity",
              label: "Severidade",
              value: filters.severity,
              all: "Todas as severidades",
              options: SEVERITIES.map((sev) => ({ value: sev, label: SEVERITY[sev]!.label })),
            },
            { name: "owner", label: "Responsável", value: filters.owner, all: "Qualquer responsável", options: owners },
          ]}
        />
      ) : null}
      {page.items.length === 0 && filtered ? (
        <p className="text-body-sm text-text-secondary">Nenhum risco com estes filtros.</p>
      ) : page.items.length === 0 ? (
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
          <Pagination total={page.total} limit={page.limit} offset={page.offset} href={href} />
        </>
      )}
    </>
  );
}
