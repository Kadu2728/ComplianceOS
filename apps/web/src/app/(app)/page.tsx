import Link from "next/link";
import { ActivityList } from "@/components/domain/activity-list";
import { PrioritiesList } from "@/components/domain/priorities-list";
import { RadarPanel } from "@/components/domain/radar-panel";
import { ScoreCard } from "@/components/score/score-card";
import { ScoreTrend } from "@/components/score/score-trend";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { CONTROL_STATUS, RISK_STATUS, SEVERITY, formatDate, isOverdue } from "@/lib/domain/labels";
import type { ControlPage, Overview, Priorities, Radar, ScoreHistory } from "@/lib/domain/queries";
import type { Score } from "@/lib/domain/score";
import { getSession } from "@/lib/session/server";

/**
 * Visão geral — the Company Control Room (CLAUDE.md §4, UX §12, brief §14): "What's happening
 * with my compliance?" and "What needs attention today?" — score with explanation, the radar,
 * priorities with score gain, then the state of risks, controls, documents and activity.
 */
export default async function OverviewPage() {
  const session = await getSession();
  if (!session) return null;
  const base = `/api/v1/orgs/${session.membership.organization.id}`;
  const [score, overview, history, radar, prio, controls] = await Promise.all([
    apiGet<Score>(`${base}/score`),
    apiGet<Overview>(`${base}/overview`),
    apiGet<ScoreHistory>(`${base}/score/history?limit=30`),
    apiGet<Radar>(`${base}/radar`),
    apiGet<Priorities>(`${base}/priorities?limit=5`),
    apiGet<ControlPage>(`${base}/controls?limit=1`),
  ]);
  const empty = !score || (!score.available && score.reason === "no_assessment");
  const trend = [...(history?.items ?? [])].reverse();
  const risks = overview?.risks;
  const actions = overview?.actions;
  const assessment = overview?.assessment;
  const documents = overview?.documents;

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Onde sua empresa está, o que precisa de atenção hoje e o que fazer a seguir."
        action={<ButtonLink href="/resumo" variant="secondary">Resumo executivo</ButtonLink>}
      />
      <div className="mb-6">
        <ScoreCard score={score ?? { available: false, message: "Score disponível após o diagnóstico." }} />
      </div>
      {radar ? (
        <div className="mb-8">
          <RadarPanel radar={radar} />
        </div>
      ) : null}

      {empty ? (
        <EmptyState
          title="Sua visão geral ainda está vazia."
          description="Comece pelo diagnóstico para identificar os primeiros riscos e gerar seu score."
          actions={<ButtonLink href="/diagnostico">Iniciar diagnóstico</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section aria-labelledby="status-atual" className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 id="status-atual" className="text-h3">Status atual</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
              <Stat label="Riscos abertos" value={risks?.open ?? 0} href="/riscos?status=abertos" />
              <Stat label="Críticos" value={risks?.by_severity.critico ?? 0} tone={risks?.by_severity.critico ? "danger" : undefined} href="/riscos?status=abertos&severity=critico" />
              <Stat label="Ações pendentes" value={actions?.pending ?? 0} href="/acoes?status=pendentes" />
              <Stat label="Atrasadas" value={actions?.overdue ?? 0} tone={actions?.overdue ? "danger" : undefined} href="/acoes?overdue=1" />
              <Stat label="Em revisão" value={risks?.in_review ?? 0} href="/riscos?status=em_revisao" />
              <Stat label="Sem responsável" value={risks?.without_owner ?? 0} tone={risks?.without_owner ? "warning" : undefined} href="/riscos" />
            </dl>
            <p className="mt-4 text-caption text-text-secondary">
              {assessment?.status === "completed"
                ? `Diagnóstico ${assessment.mode === "short" ? "rápido" : "completo"} concluído em ${formatDate(assessment.completed_at)}.`
                : assessment?.status === "in_progress"
                  ? `Diagnóstico em andamento — ${assessment.answered} de ${assessment.total} perguntas.`
                  : "Diagnóstico não iniciado."}{" "}
              <Link href="/diagnostico" className="font-medium text-electric-blue hover:underline">Abrir</Link>
            </p>
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="text-body-sm font-medium">Tendência do score</h3>
              <div className="mt-2">
                <ScoreTrend points={trend} />
              </div>
            </div>
          </section>

          <section aria-labelledby="riscos-criticos" className="rounded-lg border border-border bg-surface-elevated p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="riscos-criticos" className="text-h3">Riscos críticos e altos</h2>
              <Link href="/riscos" className="text-body-sm text-info-text hover:underline">Ver todos</Link>
            </div>
            {!risks || risks.items.length === 0 ? (
              <p className="mt-3 text-body-sm text-text-secondary">Nenhum risco crítico ou alto em aberto.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {risks.items.map((r) => {
                  const sev = SEVERITY[r.severity]!;
                  const st = RISK_STATUS[r.status]!;
                  const closed = r.status === "resolvido" || r.status === "aceito";
                  return (
                    <li key={r.id} className="flex flex-col gap-1 py-2.5 text-body-sm">
                      <Link href={`/riscos/${r.id}`} className="font-medium text-text-primary hover:underline">{r.title}</Link>
                      <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                        <Badge label={sev.label} tone={sev.tone} icon={sev.icon} />
                        {r.status !== "aberto" ? <Badge label={st.label} tone={st.tone} icon={st.icon} /> : null}
                        <span>{r.owner?.name ?? "Sem responsável"}</span>
                        {r.due_date ? <span className={isOverdue(r.due_date, closed) ? "text-danger-text" : ""}>{formatDate(r.due_date)}</span> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="prioridades" className="rounded-lg border border-border bg-surface-elevated p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="prioridades" className="text-h3">O que fazer primeiro</h2>
              <Link href="/acoes?status=pendentes" className="text-body-sm text-info-text hover:underline">Ver todas</Link>
            </div>
            <p className="mt-1 text-caption text-text-secondary">Ordenado por risco reduzido, contexto do perfil, urgência e esforço. O número verde é o ganho estimado no score ao concluir com evidência.</p>
            {prio ? <PrioritiesList prio={prio} compact /> : <p className="mt-3 text-body-sm text-text-secondary">Prioridades indisponíveis no momento.</p>}
          </section>

          <section aria-labelledby="controles" className="rounded-lg border border-border bg-surface-elevated p-5 lg:col-span-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="controles" className="text-h3">Controles</h2>
              <Link href="/controles" className="text-body-sm text-info-text hover:underline">Ver todos</Link>
            </div>
            {!controls || controls.total === 0 ? (
              <p className="mt-3 text-body-sm text-text-secondary">
                Nenhum controle ainda. Abra um risco crítico ou alto e use <span className="font-medium">Planejar em um passo</span>: o controle recomendado é criado e vinculado — a escada de maturidade começa aí.
              </p>
            ) : (
              <ControlMaturity base={base} />
            )}
          </section>

          <section aria-labelledby="documentos" className="rounded-lg border border-border bg-surface-elevated p-5 lg:col-span-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="documentos" className="text-h3">Documentos</h2>
              <Link href="/documentos" className="text-body-sm text-info-text hover:underline">Ver todos</Link>
            </div>
            {!documents || documents.total === 0 ? (
              <p className="mt-3 text-body-sm text-text-secondary">
                Nenhum documento organizado. Políticas, procedimentos e registros com validade e responsável entram aqui —{" "}
                <Link href="/documentos/novo" className="font-medium text-electric-blue hover:underline">adicione o primeiro</Link>.
              </p>
            ) : (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm md:grid-cols-5">
                <Stat label="Atualizados" value={documents.atualizado} href="/documentos?status=atualizado" />
                <Stat label="Vencendo" value={documents.vencendo} tone={documents.vencendo ? "warning" : undefined} href="/documentos?status=vencendo" />
                <Stat label="Vencidos" value={documents.vencido} tone={documents.vencido ? "danger" : undefined} href="/documentos?status=vencido" />
                <Stat label="Faltantes" value={documents.faltante} tone={documents.faltante ? "danger" : undefined} href="/documentos?status=faltante" />
                <Stat label="Em revisão" value={documents.em_revisao} href="/documentos?status=em_revisao" />
              </dl>
            )}
          </section>

          {overview?.recent_activity ? (
            <section aria-labelledby="atividade" className="rounded-lg border border-border bg-surface-elevated p-5 lg:col-span-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="atividade" className="text-h3">Atividade recente</h2>
                <Link href="/historico" className="text-body-sm text-info-text hover:underline">Ver histórico</Link>
              </div>
              {overview.recent_activity.length === 0 ? (
                <p className="mt-3 text-body-sm text-text-secondary">Nenhuma atividade ainda.</p>
              ) : (
                <div className="mt-2">
                  <ActivityList entries={overview.recent_activity} compact />
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

/** Maturity ladder counts (planejado → parcial → implementado → verificado): four small
 * parallel calls to the list endpoint, which returns the total per status filter. */
async function ControlMaturity({ base }: { base: string }) {
  const steps = ["planejado", "parcial", "implementado", "verificado"] as const;
  const counts = await Promise.all(steps.map((s) => apiGet<ControlPage>(`${base}/controls?limit=1&status=${s}`)));
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm md:grid-cols-4">
      {steps.map((s, i) => (
        <Stat key={s} label={CONTROL_STATUS[s]!.label} value={counts[i]?.total ?? 0} href={`/controles?status=${s}`} tone={s === "planejado" && (counts[i]?.total ?? 0) > 0 ? "warning" : undefined} />
      ))}
    </dl>
  );
}

function Stat({ label, value, tone, href }: { label: string; value: number; tone?: "danger" | "warning"; href: string }) {
  const color = tone === "danger" && value > 0 ? "text-danger-text" : tone === "warning" && value > 0 ? "text-warning-text" : "text-text-primary";
  return (
    <div className="flex flex-col">
      <dt className="text-caption text-text-secondary">{label}</dt>
      <dd className={`text-h2 tabular-nums ${color}`}>
        <Link href={href} className="hover:underline">{value}</Link>
      </dd>
    </div>
  );
}
