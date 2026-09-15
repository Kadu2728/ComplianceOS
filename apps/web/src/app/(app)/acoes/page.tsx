import { Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/domain/filter-bar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { apiGet } from "@/lib/api/server";
import {
  ACTION_STATUS_FILTER_LABELS,
  ACTION_STATUS_FILTERS,
  actionQuery,
  filterHref,
  hasFilters,
  parseActionFilters,
} from "@/lib/domain/filters";
import { ACTION_STATUS, formatDate, isOverdue } from "@/lib/domain/labels";
import { pageQuery } from "@/lib/domain/paging";
import { type ActionPage, type Overview, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Ações" };

type Search = { page?: string; status?: string; overdue?: string; owner?: string };

export default async function AcoesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const params = await searchParams;
  const { limit, offset } = pageQuery(params.page);
  const filters = parseActionFilters(params);
  const filtered = hasFilters(filters);
  const [pageData, overview, members] = await Promise.all([
    apiGet<ActionPage>(`/api/v1/orgs/${orgId}/actions?limit=${limit}&offset=${offset}${actionQuery(filters)}`),
    apiGet<Overview>(`/api/v1/orgs/${orgId}/overview`),
    memberOptions(orgId),
  ]);
  const page = pageData ?? { items: [], total: 0, limit, offset };
  const canCreate = isManager(session.membership.role);
  const overdue = overview?.actions.overdue ?? 0;
  const open = overview?.actions.pending ?? 0;
  const href = filterHref("/acoes", filters);
  const me = session.membership.id;
  const owners = [
    { value: me, label: "Minhas ações" },
    ...members.filter((m) => m.membership_id !== me).map((m) => ({ value: m.membership_id, label: m.name })),
  ];

  return (
    <>
      <PageHeader
        title="Ações"
        description={page.total === 0 ? "Quem faz o quê, até quando." : `${open} ${open === 1 ? "ação aberta" : "ações abertas"}${overdue ? ` · ${overdue} ${overdue === 1 ? "atrasada" : "atrasadas"}` : ""}`}
        action={canCreate ? <ButtonLink href="/acoes/nova">Nova ação</ButtonLink> : undefined}
      />
      {page.total > 0 || filtered ? (
        <FilterBar
          action="/acoes"
          count={page.total}
          noun={["ação", "ações"]}
          active={filtered}
          selects={[
            {
              name: "status",
              label: "Status",
              value: filters.status,
              all: "Todos os status",
              options: (Object.keys(ACTION_STATUS_FILTERS) as (keyof typeof ACTION_STATUS_FILTERS)[]).map((k) => ({ value: k, label: ACTION_STATUS_FILTER_LABELS[k] })),
            },
            { name: "owner", label: "Responsável", value: filters.owner, all: "Qualquer responsável", options: owners },
          ]}
          toggles={[{ name: "overdue", label: "Só atrasadas", checked: filters.overdue === true }]}
        />
      ) : null}
      {page.items.length === 0 && filtered ? (
        <p className="text-body-sm text-text-secondary">Nenhuma ação com estes filtros.</p>
      ) : page.items.length === 0 ? (
        <EmptyState
          title="Nenhuma ação planejada."
          description="As ações nascem dos riscos: cada risco aberto pode gerar ações com responsável e prazo."
          actions={
            <>
              <ButtonLink href="/riscos" variant="secondary">
                Ver riscos
              </ButtonLink>
              {canCreate ? <ButtonLink href="/acoes/nova">Nova ação</ButtonLink> : null}
            </>
          }
        />
      ) : (
        <>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
          {page.items.map((a) => {
            const st = ACTION_STATUS[a.status]!;
            const late = isOverdue(a.due_date, a.status === "concluida");
            return (
              <li key={a.id} className="flex flex-col gap-2 px-4 py-3 text-body-sm md:h-11 md:flex-row md:items-center md:justify-between md:py-0">
                <Link href={`/acoes/${a.id}`} className="font-medium text-text-primary hover:underline">
                  {a.title}
                </Link>
                <div className="flex flex-wrap items-center gap-3 text-caption text-text-secondary md:text-body-sm">
                  <span>{a.owner?.name ?? "Sem responsável"}</span>
                  <span className={`inline-flex items-center gap-1 tabular-nums ${late ? "text-danger-text" : ""}`}>
                    {late ? <Clock aria-hidden size={14} strokeWidth={1.5} /> : null}
                    {formatDate(a.due_date)}
                  </span>
                  <Badge label={st.label} tone={st.tone} icon={st.icon} />
                </div>
              </li>
            );
          })}
          </ul>
          <Pagination total={page.total} limit={page.limit} offset={page.offset} href={href} />
        </>
      )}
    </>
  );
}
