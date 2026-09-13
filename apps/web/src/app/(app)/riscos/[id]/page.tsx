import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/domain/action-form";
import { EvidencePanel } from "@/components/domain/evidence-panel";
import { StatusControl } from "@/components/domain/status-control";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import {
  ACTION_STATUS,
  CATEGORY,
  IMPACT,
  PROBABILITY,
  RISK_STATUS,
  RISK_STATUS_LABELS,
  SEVERITY,
  formatDate,
  isOverdue,
} from "@/lib/domain/labels";
import { type Action, type EvidenceList, type Risk, isManager, memberOptions } from "@/lib/domain/queries";
import { documentOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Risco" };

export default async function RiscoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const base = `/api/v1/orgs/${orgId}`;
  const risk = await apiGet<Risk>(`${base}/risks/${id}`);
  if (!risk) notFound();
  const [actions, evidence, members, documents] = await Promise.all([
    apiGet<Action[]>(`${base}/risks/${id}/actions`),
    apiGet<EvidenceList>(`${base}/evidence?risk_id=${id}`),
    memberOptions(orgId),
    documentOptions(orgId),
  ]);
  const sev = SEVERITY[risk.severity]!;
  const st = RISK_STATUS[risk.status]!;
  const manager = isManager(session.membership.role);
  const canEdit = manager || risk.owner?.membership_id === session.membership.id;
  const closed = risk.status === "resolvido" || risk.status === "aceito";

  return (
    <>
      <PageHeader eyebrow="Riscos" title={risk.title} action={canEdit ? <ButtonLink href={`/riscos/${risk.id}/editar`} variant="secondary">Editar</ButtonLink> : undefined} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface-elevated p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={sev.label} tone={sev.tone} icon={sev.icon} />
              <Badge label={st.label} tone={st.tone} icon={st.icon} />
              <span className="text-caption text-text-secondary">
                {risk.source === "assessment" ? `Identificado no diagnóstico (${risk.origin_question_code})` : "Registrado manualmente"}
              </span>
            </div>
            <h2 className="mt-5 text-h3">Por que este risco existe</h2>
            <p className="mt-2 whitespace-pre-wrap text-body text-text-primary">
              {risk.description ?? <span className="text-text-secondary">Sem descrição.</span>}
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 text-body-sm md:grid-cols-2">
              <dt className="text-text-secondary">Categoria</dt>
              <dd>{CATEGORY[risk.category]}</dd>
              <dt className="text-text-secondary">Severidade</dt>
              <dd>
                {sev.label} — probabilidade {PROBABILITY[risk.probability]?.toLowerCase()} × impacto {IMPACT[risk.impact]?.toLowerCase()}
              </dd>
              <dt className="text-text-secondary">Responsável</dt>
              <dd>{risk.owner?.name ?? "—"}</dd>
              <dt className="text-text-secondary">Prazo</dt>
              <dd className={isOverdue(risk.due_date, closed) ? "text-danger-text" : ""}>
                {formatDate(risk.due_date)}
                {isOverdue(risk.due_date, closed) ? " · atrasado" : ""}
              </dd>
              {risk.treatment ? (
                <>
                  <dt className="text-text-secondary">Tratamento</dt>
                  <dd className="whitespace-pre-wrap">{risk.treatment}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="acoes" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="acoes" className="text-h3">
                Ações
              </h2>
              {manager ? <ActionForm orgId={orgId} members={members} riskId={risk.id} compact /> : null}
            </div>
            {!actions || actions.length === 0 ? (
              <p className="text-body-sm text-text-secondary">
                Nenhuma ação para este risco. Crie a primeira ação com responsável e prazo.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
                {actions.map((a) => {
                  const ast = ACTION_STATUS[a.status]!;
                  const overdue = isOverdue(a.due_date, a.status === "concluida");
                  return (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-body-sm">
                      <Link href={`/acoes/${a.id}`} className="font-medium text-text-primary hover:underline">
                        {a.title}
                      </Link>
                      <div className="flex items-center gap-3 text-caption text-text-secondary">
                        <span>{a.owner?.name ?? "Sem responsável"}</span>
                        <span className={overdue ? "text-danger-text" : ""}>{formatDate(a.due_date)}</span>
                        <Badge label={ast.label} tone={ast.tone} icon={ast.icon} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <EvidencePanel orgId={orgId} target={{ risk_id: risk.id }} items={evidence ?? []} canDelete={manager} documents={documents} />
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 className="text-h3">Status</h2>
            <p className="mt-1 text-caption text-text-secondary">
              Resolver exige passar por revisão. Reabrir e aceitar são ações de administradores.
            </p>
            <div className="mt-4">
              {canEdit ? (
                <StatusControl kind="risk" path={`${base}/risks/${risk.id}`} current={risk.status} labels={RISK_STATUS_LABELS} />
              ) : (
                <p className="text-body-sm text-text-secondary">Somente o responsável ou um administrador altera o status.</p>
              )}
            </div>
          </section>
          <p className="text-caption text-text-secondary">
            Criado em {formatDate(risk.created_at)} · atualizado em {formatDate(risk.updated_at)}
          </p>
        </aside>
      </div>
    </>
  );
}
