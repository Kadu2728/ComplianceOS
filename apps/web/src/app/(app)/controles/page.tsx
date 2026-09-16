import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/domain/filter-bar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { apiGet } from "@/lib/api/server";
import { filterHref, hasFilters } from "@/lib/domain/filters";
import { CATEGORY, CONTROL_KIND, CONTROL_STATUS, formatDate } from "@/lib/domain/labels";
import { pageQuery } from "@/lib/domain/paging";
import { type ControlPage, isManager, memberOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Controles" };

const STATUSES = ["planejado", "parcial", "implementado", "verificado", "inativo"] as const;
const CATEGORIES = ["dados", "acesso", "seguranca", "fornecedores", "documentacao", "titulares", "incidentes", "pessoas"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Search = { page?: string; status?: string; category?: string; owner?: string };

/** Controls (Control Graph, D27): the organization's safeguards, least mature first. */
export default async function ControlesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const params = await searchParams;
  const { limit, offset } = pageQuery(params.page);
  const filters = {
    status: STATUSES.find((s) => s === params.status),
    category: CATEGORIES.find((c) => c === params.category),
    owner: params.owner && UUID.test(params.owner) ? params.owner : undefined,
  };
  const filtered = hasFilters(filters);
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (filters.status) q.set("status", filters.status);
  if (filters.category) q.set("category", filters.category);
  if (filters.owner) q.set("owner_membership_id", filters.owner);
  const [pageData, members] = await Promise.all([
    apiGet<ControlPage>(`/api/v1/orgs/${orgId}/controls?${q}`),
    memberOptions(orgId),
  ]);
  const page = pageData ?? { items: [], total: 0, limit, offset };
  const canCreate = isManager(session.membership.role);
  const href = filterHref("/controles", filters);

  return (
    <>
      <PageHeader
        title="Controles"
        description="As salvaguardas da empresa: o que existe entre um risco e um incidente. Cada controle mitiga riscos, é implementado por ações e comprovado por evidências."
        action={canCreate ? <ButtonLink href="/controles/novo">Novo controle</ButtonLink> : undefined}
      />
      {page.total > 0 || filtered ? (
        <FilterBar
          action="/controles"
          count={page.total}
          noun={["controle", "controles"]}
          active={filtered}
          selects={[
            { name: "status", label: "Maturidade", value: filters.status, all: "Toda maturidade", options: STATUSES.map((s) => ({ value: s, label: CONTROL_STATUS[s]!.label })) },
            { name: "category", label: "Categoria", value: filters.category, all: "Todas as categorias", options: CATEGORIES.map((c) => ({ value: c, label: CATEGORY[c]! })) },
            { name: "owner", label: "Responsável", value: filters.owner, all: "Qualquer responsável", options: members.map((m) => ({ value: m.membership_id, label: m.name })) },
          ]}
        />
      ) : null}
      {page.items.length === 0 && filtered ? (
        <p className="text-body-sm text-text-secondary">Nenhum controle com estes filtros.</p>
      ) : page.items.length === 0 ? (
        <EmptyState
          title="Nenhum controle registrado."
          description="Abra um risco crítico ou alto e use “Planejar em um passo”: o controle recomendado é criado e vinculado ao risco. Ou registre um controle que já existe na empresa."
          actions={
            <>
              <ButtonLink href="/riscos?status=abertos&severity=critico" variant="secondary">Ver riscos críticos</ButtonLink>
              {canCreate ? <ButtonLink href="/controles/novo">Novo controle</ButtonLink> : null}
            </>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-surface-elevated md:block">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border text-left text-label uppercase text-text-secondary">
                  <th className="px-4 py-3 font-medium">Maturidade</th>
                  <th className="px-4 py-3 font-medium">Controle</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Responsável</th>
                  <th className="px-4 py-3 font-medium">Revisão</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((c) => {
                  const st = CONTROL_STATUS[c.status]!;
                  return (
                    <tr key={c.id} className="h-11 border-b border-border last:border-b-0 hover:bg-surface-hover">
                      <td className="px-4"><Badge label={st.label} tone={st.tone} icon={st.icon} /></td>
                      <td className="px-4"><Link href={`/controles/${c.id}`} className="font-medium text-text-primary hover:underline">{c.title}</Link></td>
                      <td className="px-4 text-text-secondary">{CATEGORY[c.category]}</td>
                      <td className="px-4 text-text-secondary">{CONTROL_KIND[c.kind]}</td>
                      <td className="px-4 text-text-secondary">{c.owner?.name ?? "—"}</td>
                      <td className="px-4 tabular-nums text-text-secondary">{formatDate(c.review_date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {page.items.map((c) => {
              const st = CONTROL_STATUS[c.status]!;
              return (
                <li key={c.id} className="rounded-lg border border-border bg-surface-elevated p-4">
                  <Link href={`/controles/${c.id}`} className="text-body font-medium text-text-primary hover:underline">{c.title}</Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                    <Badge label={st.label} tone={st.tone} icon={st.icon} />
                    <span>{CATEGORY[c.category]}</span>
                    <span>{c.owner?.name ?? "Sem responsável"}</span>
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
