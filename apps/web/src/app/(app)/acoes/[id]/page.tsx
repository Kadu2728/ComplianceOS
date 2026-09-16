import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EvidencePanel } from "@/components/domain/evidence-panel";
import { StatusControl } from "@/components/domain/status-control";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { ACTION_STATUS, ACTION_STATUS_LABELS, EFFORT, SEVERITY, formatDate, isOverdue } from "@/lib/domain/labels";
import { type Action, type ControlGraph, type EvidenceList, type Risk, controlOptions, isManager } from "@/lib/domain/queries";
import { documentOptions } from "@/lib/domain/queries";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Ação" };

export default async function AcaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const base = `/api/v1/orgs/${orgId}`;
  const action = await apiGet<Action>(`${base}/actions/${id}`);
  if (!action) notFound();
  const [risk, evidence, documents, control, controls] = await Promise.all([
    action.risk_id ? apiGet<Risk>(`${base}/risks/${action.risk_id}`) : Promise.resolve(null),
    apiGet<EvidenceList>(`${base}/evidence?action_id=${id}`),
    documentOptions(orgId),
    action.control_id ? apiGet<ControlGraph>(`${base}/controls/${action.control_id}`) : Promise.resolve(null),
    controlOptions(orgId),
  ]);
  const st = ACTION_STATUS[action.status]!;
  const manager = isManager(session.membership.role);
  const canEdit = manager || action.owner?.membership_id === session.membership.id;
  const done = action.status === "concluida";
  const late = isOverdue(action.due_date, done);

  return (
    <>
      <PageHeader eyebrow="Ações" title={action.title} action={canEdit ? <ButtonLink href={`/acoes/${action.id}/editar`} variant="secondary">Editar</ButtonLink> : undefined} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface-elevated p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={st.label} tone={st.tone} icon={st.icon} />
              {late ? <span className="text-caption text-danger-text">Atrasada</span> : null}
            </div>
            {action.description ? (
              <p className="mt-4 whitespace-pre-wrap text-body">{action.description}</p>
            ) : null}
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 text-body-sm md:grid-cols-2">
              <dt className="text-text-secondary">Responsável</dt>
              <dd>{action.owner?.name ?? "—"}</dd>
              <dt className="text-text-secondary">Prazo</dt>
              <dd className={late ? "text-danger-text" : ""}>{formatDate(action.due_date)}</dd>
              <dt className="text-text-secondary">Risco relacionado</dt>
              <dd>
                {risk ? (
                  <Link href={`/riscos/${risk.id}`} className="inline-flex items-center gap-2 text-info-text underline underline-offset-2">
                    {risk.title}
                    <Badge label={SEVERITY[risk.severity]!.label} tone={SEVERITY[risk.severity]!.tone} icon={SEVERITY[risk.severity]!.icon} />
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
              <dt className="text-text-secondary">Implementa o controle</dt>
              <dd>
                {control ? (
                  <Link href={`/controles/${control.control.id}`} className="text-info-text underline underline-offset-2">{control.control.title}</Link>
                ) : (
                  <span className="text-text-secondary">— {canEdit ? "vincule um controle ao editar" : ""}</span>
                )}
              </dd>
              <dt className="text-text-secondary">Esforço</dt>
              <dd>{action.effort ? EFFORT[action.effort] : <span className="text-text-secondary">não informado</span>}</dd>
              {action.completed_at ? (
                <>
                  <dt className="text-text-secondary">Concluída em</dt>
                  <dd>{formatDate(action.completed_at)}</dd>
                </>
              ) : null}
            </dl>
          </section>
          <EvidencePanel orgId={orgId} target={{ action_id: action.id }} items={evidence ?? []} canDelete={manager} documents={documents} controls={controls.map((c) => ({ id: c.id, title: c.title }))} />
        </div>
        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 className="text-h3">Status</h2>
            <p className="mt-1 text-caption text-text-secondary">
              Concluir sem evidência conta na execução, não na comprovação (score v1).
            </p>
            <div className="mt-4">
              {canEdit ? (
                <StatusControl kind="action" path={`${base}/actions/${action.id}`} current={action.status} labels={ACTION_STATUS_LABELS} />
              ) : (
                <p className="text-body-sm text-text-secondary">Somente o responsável ou um administrador altera o status.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
