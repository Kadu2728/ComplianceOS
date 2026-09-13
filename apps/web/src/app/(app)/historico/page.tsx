import type { Metadata } from "next";
import { ActivityList } from "@/components/domain/activity-list";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { apiGet } from "@/lib/api/server";
import { pageQuery } from "@/lib/domain/paging";
import { type AuditPage, isManager } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Histórico" };

/** Audit trail (CLAUDE.md §4). Managers only — the permission lives in the API (`audit.read`). */
export default async function HistoricoPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await getSession();
  if (!session) return null;
  if (!isManager(session.membership.role)) {
    return (
      <>
        <PageHeader title="Histórico" description="Quem alterou o quê, e quando." />
        <Alert tone="info">Você não tem permissão para acessar esta área. Fale com um administrador da organização.</Alert>
      </>
    );
  }
  const { limit, offset } = pageQuery((await searchParams).page);
  const orgId = session.membership.organization.id;
  const page = (await apiGet<AuditPage>(`/api/v1/orgs/${orgId}/audit-log?limit=${limit}&offset=${offset}`)) ?? { items: [], total: 0, limit, offset };
  return (
    <>
      <PageHeader title="Histórico" description={page.total ? `${page.total} ${page.total === 1 ? "registro" : "registros"} — cada alteração com data e autor.` : "Quem alterou o quê, e quando."} />
      {page.items.length === 0 ? (
        <EmptyState title="Nenhuma atividade ainda." description="Alterações em riscos, ações, documentos e membros aparecem aqui com data e autor." />
      ) : (
        <>
          <ActivityList entries={page.items} />
          <Pagination total={page.total} limit={page.limit} offset={page.offset} href="/historico" />
        </>
      )}
    </>
  );
}
