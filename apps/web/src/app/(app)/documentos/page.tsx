import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { apiGet } from "@/lib/api/server";
import { DOCUMENT_CATEGORY, DOCUMENT_STATUS, formatDate } from "@/lib/domain/labels";
import { pageQuery } from "@/lib/domain/paging";
import { type DocumentPage, type Overview, isManager } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Documentos" };

const FILTERS = ["vencido", "vencendo", "faltante", "em_revisao", "atualizado"] as const;

export default async function DocumentosPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const params = await searchParams;
  const { limit, offset } = pageQuery(params.page);
  const status = FILTERS.find((s) => s === params.status);
  const query = `limit=${limit}&offset=${offset}${status ? `&status=${status}` : ""}`;
  const [pageData, overview] = await Promise.all([
    apiGet<DocumentPage>(`/api/v1/orgs/${orgId}/documents?${query}`),
    apiGet<Overview>(`/api/v1/orgs/${orgId}/overview`),
  ]);
  const page = pageData ?? { items: [], total: 0, limit, offset };
  const canCreate = isManager(session.membership.role);
  const docs = overview?.documents;
  const attention = (docs?.vencido ?? 0) + (docs?.vencendo ?? 0) + (docs?.faltante ?? 0);
  const href = status ? `/documentos?status=${status}` : "/documentos";

  return (
    <>
      <PageHeader
        title="Documentos"
        description={
          !docs || docs.total === 0
            ? "Políticas, procedimentos e evidências com validade e responsável."
            : `${docs.total} ${docs.total === 1 ? "documento" : "documentos"}${attention ? ` · ${attention} ${attention === 1 ? "precisa" : "precisam"} de atenção` : " · tudo em dia"}`
        }
        action={canCreate ? <ButtonLink href="/documentos/novo">Adicionar documento</ButtonLink> : undefined}
      />
      {docs && docs.total > 0 ? (
        <nav aria-label="Filtrar por status" className="mb-4 flex flex-wrap gap-2">
          <FilterChip href="/documentos" active={!status} label={`Todos (${docs.total})`} />
          {FILTERS.map((s) => (
            <FilterChip key={s} href={`/documentos?status=${s}`} active={status === s} label={`${DOCUMENT_STATUS[s]!.label} (${docs[s]})`} />
          ))}
        </nav>
      ) : null}
      {page.items.length === 0 ? (
        status ? (
          <p className="text-body-sm text-text-secondary">Nenhum documento com este status.</p>
        ) : (
          <EmptyState
            title="Nenhum documento organizado."
            description="Centralize políticas, procedimentos e evidências com data de validade e responsável."
            actions={canCreate ? <ButtonLink href="/documentos/novo">Adicionar documento</ButtonLink> : undefined}
          />
        )
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-border bg-surface-elevated md:block">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border text-left text-label uppercase text-text-secondary">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Versão</th>
                  <th className="px-4 py-3 font-medium">Responsável</th>
                  <th className="px-4 py-3 font-medium">Validade</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((d) => {
                  const st = DOCUMENT_STATUS[d.status]!;
                  return (
                    <tr key={d.id} className="h-11 border-b border-border last:border-b-0 hover:bg-surface-hover">
                      <td className="px-4"><Badge label={st.label} tone={st.tone} icon={st.icon} /></td>
                      <td className="px-4">
                        <Link href={`/documentos/${d.id}`} className="font-medium text-text-primary hover:underline">{d.name}</Link>
                      </td>
                      <td className="px-4 text-text-secondary">{DOCUMENT_CATEGORY[d.category]}</td>
                      <td className="px-4 tabular-nums text-text-secondary">{d.version}</td>
                      <td className="px-4 text-text-secondary">{d.owner?.name ?? "—"}</td>
                      <td className={`px-4 tabular-nums ${d.status === "vencido" ? "text-danger-text" : d.status === "vencendo" ? "text-warning-text" : "text-text-secondary"}`}>{formatDate(d.valid_until)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {page.items.map((d) => {
              const st = DOCUMENT_STATUS[d.status]!;
              return (
                <li key={d.id} className="rounded-lg border border-border bg-surface-elevated p-4">
                  <Link href={`/documentos/${d.id}`} className="text-body font-medium text-text-primary hover:underline">{d.name}</Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                    <Badge label={st.label} tone={st.tone} icon={st.icon} />
                    <span>{DOCUMENT_CATEGORY[d.category]}</span>
                    <span>v{d.version}</span>
                    <span>{d.owner?.name ?? "Sem responsável"}</span>
                    {d.valid_until ? <span>até {formatDate(d.valid_until)}</span> : null}
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

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`inline-flex h-8 items-center rounded-pill border px-3 text-body-sm ${active ? "border-electric-blue bg-info-tint font-medium text-info-text" : "border-border text-text-secondary hover:bg-surface-hover"}`}>
      {label}
    </Link>
  );
}
