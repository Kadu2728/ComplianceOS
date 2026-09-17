import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ControlStatusControl, LinkRiskControl } from "@/components/domain/control-graph-actions";
import { EvidencePanel } from "@/components/domain/evidence-panel";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import {
  ACTION_STATUS,
  CATEGORY,
  CONTROL_KIND,
  CONTROL_STATUS,
  CONTROL_STATUS_LABELS,
  RISK_STATUS,
  SEVERITY,
  formatDate,
  isOverdue,
} from "@/lib/domain/labels";
import { type ControlGraph, type RiskPage, documentOptions, isManager } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Controle" };

const LADDER = ["planejado", "parcial", "implementado", "verificado"] as const;

/**
 * One control and everything connected to it — the Control Graph neighbourhood (D27):
 * risks it mitigates · actions that implement it · evidence that proves it · the document that
 * formalizes it · its maturity and history.
 */
export default async function ControlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const base = `/api/v1/orgs/${orgId}`;
  const graph = await apiGet<ControlGraph>(`${base}/controls/${id}`);
  if (!graph) notFound();
  const c = graph.control;
  const manager = isManager(session.membership.role);
  const canEdit = manager || c.owner?.membership_id === session.membership.id;
  const [openRisks, documents] = await Promise.all([
    manager ? apiGet<RiskPage>(`${base}/risks?limit=50&status=aberto&status=em_andamento&status=em_revisao`) : Promise.resolve(null),
    documentOptions(orgId),
  ]);
  const linkedIds = new Set(graph.risks.map((r) => r.id));
  const linkable = (openRisks?.items ?? []).filter((r) => !linkedIds.has(r.id)).map((r) => ({ id: r.id, label: `${SEVERITY[r.severity]!.label} · ${r.title}` }));
  const st = CONTROL_STATUS[c.status]!;
  const step = LADDER.indexOf(c.status as (typeof LADDER)[number]);

  return (
    <>
      <PageHeader eyebrow="Controles" title={c.title} action={canEdit ? <ButtonLink href={`/controles/${c.id}/editar`} variant="secondary">Editar</ButtonLink> : undefined} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface-elevated p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={st.label} tone={st.tone} icon={st.icon} />
              <span className="text-caption text-text-secondary">{CONTROL_KIND[c.kind]} · {CATEGORY[c.category]}{c.template_code ? ` · catálogo ${c.template_code}` : ""}</span>
            </div>
            {/* Maturity ladder: position, not color, carries the meaning (brand §30). */}
            <ol className="mt-4 flex flex-wrap gap-1" aria-label="Escada de maturidade">
              {LADDER.map((s, i) => (
                <li key={s} className={`flex items-center gap-1 rounded-md px-2 py-1 text-caption ${i <= step ? "bg-text-primary text-surface-elevated" : "border border-border text-text-secondary"}`} aria-current={s === c.status ? "step" : undefined}>
                  {i + 1}. {CONTROL_STATUS[s]!.label}
                </li>
              ))}
            </ol>
            <p className="mt-1 text-caption text-text-secondary">{st.hint}.</p>
            <h2 className="mt-5 text-h3">O que este controle faz</h2>
            <p className="mt-2 whitespace-pre-wrap text-body">{c.description ?? <span className="text-text-secondary">Sem descrição.</span>}</p>
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 text-body-sm md:grid-cols-2">
              <dt className="text-text-secondary">Responsável</dt>
              <dd>{c.owner?.name ?? "—"}</dd>
              <dt className="text-text-secondary">Próxima revisão</dt>
              <dd className="tabular-nums">{formatDate(c.review_date)}</dd>
              <dt className="text-text-secondary">Documento que formaliza</dt>
              <dd>{c.document ? <Link href={`/documentos/${c.document.id}`} className="text-info-text underline underline-offset-2">{c.document.name}</Link> : "—"}</dd>
            </dl>
          </section>

          <section aria-labelledby="riscos" className="flex flex-col gap-3">
            <h2 id="riscos" className="text-h3">Riscos que este controle mitiga</h2>
            {graph.risks.length === 0 ? (
              <p className="text-body-sm text-text-secondary">Nenhum risco vinculado. Um controle sem risco não conta para o score.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
                {graph.risks.map((r) => {
                  const sev = SEVERITY[r.severity]!;
                  const rs = RISK_STATUS[r.status]!;
                  return (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-body-sm">
                      <Link href={`/riscos/${r.id}`} className="font-medium text-text-primary hover:underline">{r.title}</Link>
                      <span className="flex items-center gap-2">
                        <Badge label={sev.label} tone={sev.tone} icon={sev.icon} />
                        <Badge label={rs.label} tone={rs.tone} icon={rs.icon} />
                        {manager ? <LinkRiskControl orgId={orgId} controlId={c.id} riskId={r.id} options={[]} mode="unlink" /> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            {manager && linkable.length > 0 ? <LinkRiskControl orgId={orgId} controlId={c.id} options={linkable} mode="link" /> : null}
          </section>

          <section aria-labelledby="acoes" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 id="acoes" className="text-h3">Ações que implementam</h2>
              {manager ? <ButtonLink href={`/acoes/nova?controle=${c.id}`} variant="secondary">Nova ação</ButtonLink> : null}
            </div>
            {graph.actions.length === 0 ? (
              <p className="text-body-sm text-text-secondary">Nenhuma ação vinculada a este controle.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
                {graph.actions.map((a) => {
                  const ast = ACTION_STATUS[a.status]!;
                  const late = isOverdue(a.due_date, a.status === "concluida");
                  return (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-body-sm">
                      <Link href={`/acoes/${a.id}`} className="font-medium text-text-primary hover:underline">{a.title}</Link>
                      <div className="flex items-center gap-3 text-caption text-text-secondary">
                        <span>{a.owner?.name ?? "Sem responsável"}</span>
                        <span className={late ? "text-danger-text" : ""}>{formatDate(a.due_date)}</span>
                        <Badge label={ast.label} tone={ast.tone} icon={ast.icon} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <EvidencePanel orgId={orgId} target={{ control_id: c.id }} items={graph.evidence} canDelete={manager} documents={documents} />
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 className="text-h3">Maturidade</h2>
            <p className="mt-1 text-caption text-text-secondary">Verificado exige pelo menos uma evidência anexada a este controle ({graph.evidence_count}).</p>
            <div className="mt-4">
              {canEdit ? (
                <ControlStatusControl orgId={orgId} controlId={c.id} current={c.status} labels={CONTROL_STATUS_LABELS} evidenceCount={graph.evidence_count} />
              ) : (
                <p className="text-body-sm text-text-secondary">Somente o responsável ou um administrador altera a maturidade.</p>
              )}
            </div>
          </section>
          <p className="text-caption text-text-secondary">Criado em {formatDate(c.created_at)} · atualizado em {formatDate(c.updated_at)}. Histórico completo em <Link href="/historico" className="underline underline-offset-2">Histórico</Link>.</p>
        </aside>
      </div>
    </>
  );
}
