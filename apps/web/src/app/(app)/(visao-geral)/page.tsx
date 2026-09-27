import type { Metadata } from "next";
import Link from "next/link";
import { CardError, CardLink, DashCard } from "@/components/dashboard/card";
import { ModuleCards } from "@/components/dashboard/module-cards";
import { NextStepCard } from "@/components/dashboard/next-step";
import { RecentActionsCard } from "@/components/dashboard/recent-actions";
import { RisksAttentionCard } from "@/components/dashboard/risks-attention";
import { RisksByCategoryCard } from "@/components/dashboard/risks-by-category";
import { ScoreSummaryCard } from "@/components/dashboard/score-summary";
import { ActivityList } from "@/components/domain/activity-list";
import { AgentPanel } from "@/components/domain/agent-panel";
import { PrioritiesPanel } from "@/components/domain/priorities-panel";
import { RadarPanel } from "@/components/domain/radar-panel";
import { ScoreCard } from "@/components/score/score-card";
import { Badge, SeverityBadge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { apiGetSafe } from "@/lib/api/server";
import { CONTROL_STATUS, RISK_STATUS, formatDate, isOverdue } from "@/lib/domain/labels";
import type { AgentQuestion, AgentStatus, ControlPage, Overview, Priorities, Radar, Room, ScoreHistory } from "@/lib/domain/queries";
import type { Score } from "@/lib/domain/score";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Visão geral" };

const LADDER = ["planejado", "parcial", "implementado", "verificado"] as const;
const LINK = "font-medium text-primary-text hover:text-primary-text-hover hover:underline";

/**
 * Visão geral v2 (visual-v2 §4) — the Company Control Room: "how protected am I?" (score, risks in
 * attention) and "what do I do next?" (Próximo passo) in the first row, the product's modules as
 * live status, then risks by area and the latest actions; below the fold everything v1 showed
 * (radar, priorities, critical risks, the score's full explanation, controls, documents, agent,
 * activity). Every block reads its own source: one failing source never hides the others.
 */
export default async function OverviewPage() {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const role = session.membership.role;
  const base = `/api/v1/orgs/${orgId}`;
  const [score, overview, history, radar, prio, questions, agentStatus, controls, room, ...ladder] = await Promise.all([
    apiGetSafe<Score>(`${base}/score`),
    apiGetSafe<Overview>(`${base}/overview`),
    apiGetSafe<ScoreHistory>(`${base}/score/history?limit=30`),
    apiGetSafe<Radar>(`${base}/radar`),
    apiGetSafe<Priorities>(`${base}/priorities?limit=5`),
    apiGetSafe<AgentQuestion[]>(`${base}/agent/questions`),
    apiGetSafe<AgentStatus>(`${base}/agent/status`),
    apiGetSafe<ControlPage>(`${base}/controls?limit=1`),
    role === "owner" ? apiGetSafe<Room>(`${base}/room`) : Promise.resolve(null),
    ...LADDER.map((s) => apiGetSafe<ControlPage>(`${base}/controls?limit=1&status=${s}`)),
  ]);

  if (!score && !overview && !history && !radar && !prio) {
    return (
      <section aria-labelledby="erro" className="mx-auto flex max-w-[480px] flex-col items-center gap-4 rounded-lg border border-border bg-surface-elevated px-6 py-16 text-center">
        <h1 id="erro" className="text-h3">Não foi possível carregar a visão geral.</h1>
        <p className="text-body text-text-secondary">Verifique sua conexão e tente novamente. Seus dados não foram alterados.</p>
        <Link href="/" prefetch={false} className={buttonClass("primary")}>
          Tentar de novo
        </Link>
      </section>
    );
  }

  const assessment = overview?.assessment ?? null;
  const noAssessment = assessment?.status === "none" || (score?.available === false && score.reason === "no_assessment");
  const risks = overview?.risks ?? null;
  const actions = overview?.actions ?? null;
  const documents = overview?.documents ?? null;
  const ladderCounts = ladder.map((p) => p?.total ?? null);
  const firstName = session.user.name.trim().split(/\s+/)[0] || session.user.name;

  const status =
    assessment?.status === "completed" ? (
      <>
        Diagnóstico {assessment.mode === "short" ? "rápido" : "completo"} concluído em {formatDate(assessment.completed_at)}.{" "}
        <Link href="/diagnostico" className={LINK}>
          Abrir diagnóstico
        </Link>
      </>
    ) : assessment?.status === "in_progress" ? (
      <>
        Diagnóstico em andamento — {assessment.answered} de {assessment.total} perguntas.{" "}
        <Link href="/diagnostico" className={LINK}>
          Continuar
        </Link>
      </>
    ) : assessment?.status === "none" ? (
      "Comece pelo diagnóstico para gerar seu score e seus primeiros riscos."
    ) : (
      "Veja onde sua empresa está e o que precisa de atenção hoje."
    );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-h1-compact sm:text-h1">
          <span className="sr-only">Visão geral — </span>Olá, {firstName}
        </h1>
        <p className="mt-1 text-body-sm text-text-secondary">{status}</p>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-4 lg:gap-6">
        <ScoreSummaryCard score={score} history={history} className="col-span-12 xl:col-span-6" />
        <RisksAttentionCard risks={risks} assessed={!noAssessment} className="col-span-12 sm:col-span-6 xl:col-span-3" />
        <NextStepCard assessment={assessment} prio={prio} score={score} role={role} className="col-span-12 sm:col-span-6 xl:col-span-3" />

        <ModuleCards
          className="col-span-12"
          data={{
            agent: agentStatus && questions ? { freeText: agentStatus.free_text, questions: questions.length } : null,
            controls: controls ? { total: controls.total, verificado: ladderCounts[3] ?? null } : null,
            radar: radar ? { allClear: radar.all_clear, danger: radar.counts.danger ?? 0, warning: radar.counts.warning ?? 0 } : null,
            actions: actions ? { pending: actions.pending, overdue: actions.overdue } : null,
            documents: documents
              ? { total: documents.total, atualizado: documents.atualizado, attention: documents.vencendo + documents.vencido + documents.faltante }
              : null,
            room: { owner: role === "owner", enabled: room ? room.enabled : null },
            assessed: !noAssessment,
          }}
        />

        {noAssessment ? (
          documents && documents.total > 0 ? <DocumentsCard documents={documents} className="col-span-12" /> : null
        ) : (
          <>
            <RisksByCategoryCard categories={risks?.by_category ?? null} assessed className="col-span-12 xl:col-span-6" />
            <RecentActionsCard actions={actions?.recent ?? null} className="col-span-12 xl:col-span-6" />

            {radar ? (
              <RadarPanel radar={radar} className="col-span-12" />
            ) : (
              <DashCard id="radar" eyebrow="Risk Radar" title="O que precisa de atenção hoje" className="col-span-12">
                <CardError what="o radar" />
              </DashCard>
            )}
            <PrioritiesPanel prio={prio} compact className="col-span-12 xl:col-span-7" />
            <CriticalRisksCard risks={risks} className="col-span-12 xl:col-span-5" />

            {score?.available && score.score != null ? <ScoreCard score={score} variant="breakdown" className="col-span-12" /> : null}

            <DashCard id="controles" title="Controles" link={{ href: "/controles", label: "Ver todos" }} className="col-span-12 sm:col-span-6">
              {!controls ? (
                <CardError what="os controles" />
              ) : controls.total === 0 ? (
                <p className="text-body-sm text-text-secondary">
                  Nenhum controle ainda. Abra um risco crítico ou alto e use <span className="font-medium text-text-primary">Planejar em um passo</span>: o controle recomendado é criado e vinculado — a escada de maturidade começa aí.
                </p>
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
                  {LADDER.map((s, i) => (
                    <Stat
                      key={s}
                      label={CONTROL_STATUS[s]!.label}
                      value={ladderCounts[i]}
                      href={`/controles?status=${s}`}
                      tone={s === "planejado" ? "warning" : undefined}
                    />
                  ))}
                </dl>
              )}
            </DashCard>
            {documents ? (
              <DocumentsCard documents={documents} className="col-span-12 sm:col-span-6" />
            ) : (
              <DashCard id="documentos" title="Documentos" className="col-span-12 sm:col-span-6">
                <CardError what="os documentos" />
              </DashCard>
            )}

            <AgentPanel orgId={orgId} questions={questions ?? []} status={agentStatus} className="col-span-12" />

            {overview?.recent_activity ? (
              <DashCard id="atividade" title="Atividade recente" link={{ href: "/historico", label: "Ver histórico" }} className="col-span-12">
                {overview.recent_activity.length === 0 ? (
                  <p className="text-body-sm text-text-secondary">Nenhuma atividade ainda.</p>
                ) : (
                  <ActivityList entries={overview.recent_activity} compact />
                )}
              </DashCard>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

/** Section 9 — Riscos críticos e altos (the v1 list, kept below the fold). */
function CriticalRisksCard({ risks, className }: { risks: Overview["risks"] | null; className: string }) {
  return (
    <DashCard id="riscos-criticos" title="Riscos críticos e altos" link={{ href: "/riscos", label: "Ver todos" }} className={className}>
      {!risks ? (
        <CardError what="os riscos" />
      ) : risks.items.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Nenhum risco crítico ou alto em aberto.</p>
      ) : (
        <ul className="-my-2.5 divide-y divide-border">
          {risks.items.map((r) => {
            const st = RISK_STATUS[r.status]!;
            const closed = r.status === "resolvido" || r.status === "aceito";
            return (
              <li key={r.id} className="flex flex-col gap-1.5 py-2.5 text-body-sm">
                <Link href={`/riscos/${r.id}`} className="font-medium text-text-primary hover:underline">
                  {r.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                  <SeverityBadge severity={r.severity} />
                  {r.status !== "aberto" ? <Badge label={st.label} tone={st.tone} icon={st.icon} /> : null}
                  <span>{r.owner?.name ?? "Sem responsável"}</span>
                  {r.due_date ? <span className={isOverdue(r.due_date, closed) ? "text-danger-text" : ""}>{formatDate(r.due_date)}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}

/** Section 12 — Documentos by derived status (v1 tones). */
function DocumentsCard({ documents, className }: { documents: Overview["documents"]; className: string }) {
  return (
    <DashCard id="documentos" title="Documentos" link={{ href: "/documentos", label: "Ver todos" }} className={className}>
      {documents.total === 0 ? (
        <p className="text-body-sm text-text-secondary">
          Nenhum documento organizado. Políticas, procedimentos e registros com validade e responsável entram aqui —{" "}
          <CardLink href="/documentos/novo">adicione o primeiro</CardLink>.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3 xl:grid-cols-5">
          <Stat label="Atualizados" value={documents.atualizado} href="/documentos?status=atualizado" />
          <Stat label="Vencendo" value={documents.vencendo} tone="warning" href="/documentos?status=vencendo" />
          <Stat label="Vencidos" value={documents.vencido} tone="danger" href="/documentos?status=vencido" />
          <Stat label="Faltantes" value={documents.faltante} tone="danger" href="/documentos?status=faltante" />
          <Stat label="Em revisão" value={documents.em_revisao} href="/documentos?status=em_revisao" />
        </dl>
      )}
    </DashCard>
  );
}

/** KPI (visual-v2 §5.15): tone only when it applies and the value is above zero. */
function Stat({ label, value, tone, href }: { label: string; value: number | null | undefined; tone?: "danger" | "warning"; href: string }) {
  const n = value ?? null;
  const color = n && tone === "danger" ? "text-danger-text" : n && tone === "warning" ? "text-warning-text" : "text-text-primary";
  return (
    <div className="flex flex-col">
      <dt className="text-caption text-text-secondary">{label}</dt>
      <dd className={`text-kpi tabular-nums ${color}`}>
        {n == null ? "—" : (
          <Link href={href} className="hover:underline">
            {n}
          </Link>
        )}
      </dd>
    </div>
  );
}
