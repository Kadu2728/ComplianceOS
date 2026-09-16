import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PrioritiesList } from "@/components/domain/priorities-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import { CATEGORY, SEVERITY, formatDate } from "@/lib/domain/labels";
import type { ExecutiveSummary } from "@/lib/domain/queries";
import { BAND_TONE, formatInstantDay } from "@/lib/domain/score";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Resumo executivo" };

/**
 * CEO mode foundation (D33): where we are exposed, what matters most, what improved, what
 * worsened, what needs a decision, the next 30 days. Server-rendered, print-friendly, no charts.
 */
export default async function ResumoPage() {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const s = await apiGet<ExecutiveSummary>(`/api/v1/orgs/${orgId}/executive-summary`);
  if (!s) {
    return (
      <>
        <PageHeader eyebrow="Visão geral" title="Resumo executivo" />
        <p className="text-body-sm text-text-secondary">Resumo indisponível no momento. Tente novamente em instantes.</p>
      </>
    );
  }
  const score = s.score as { available?: boolean; score?: number | null; band?: { key: string; label: string } | null; preliminary?: boolean };
  const trend = s.trend;
  const n = (v: number | undefined) => v ?? 0;
  const gains: [string, number][] = [
    ["Riscos resolvidos", n(s.improved.risks_resolved)],
    ["Ações concluídas", n(s.improved.actions_done)],
    ["Controles implementados", n(s.improved.controls_implemented)],
    ["Evidências adicionadas", n(s.improved.evidence_added)],
  ];
  const losses: [string, number][] = [
    ["Riscos novos", n(s.worsened.risks_created)],
    ["Ações atrasadas hoje", n(s.worsened.actions_overdue)],
    ["Documentos vencidos", n(s.worsened.documents_expired)],
    ["Riscos reabertos", n(s.worsened.risks_reopened)],
  ];

  return (
    <>
      <PageHeader
        eyebrow={session.membership.organization.name}
        title="Resumo executivo"
        description={`Últimos ${s.window_days} dias. Leitura para decisão: onde estamos expostos, o que mudou e o que precisa de você.`}
        action={<ButtonLink href="/" variant="secondary">Voltar à visão geral</ButtonLink>}
      />
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-surface-elevated p-6 md:grid-cols-[auto_1fr] md:items-center">
          <div>
            <span className="text-label uppercase text-text-secondary">Score de Compliance</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-score tabular-nums">{score.available && score.score != null ? score.score : "—"}</span>
              <span className="text-body-sm text-text-secondary">/ 100</span>
              {score.band ? <Badge label={score.band.label} tone={BAND_TONE[score.band.key] ?? "neutral"} /> : null}
            </div>
          </div>
          <div className="text-body-sm text-text-secondary">
            {trend ? (
              <p className="flex items-center gap-1.5">
                {trend.diff > 0 ? <ArrowUpRight aria-hidden size={16} strokeWidth={1.5} className="text-success-text" /> : trend.diff < 0 ? <ArrowDownRight aria-hidden size={16} strokeWidth={1.5} className="text-danger-text" /> : <Minus aria-hidden size={16} strokeWidth={1.5} />}
                <span className={`tabular-nums font-medium ${trend.diff > 0 ? "text-success-text" : trend.diff < 0 ? "text-danger-text" : ""}`}>{trend.diff > 0 ? `+${trend.diff}` : trend.diff}</span>
                <span>desde {formatInstantDay(trend.since)} (de {trend.from_} para {trend.to})</span>
              </p>
            ) : (
              <p>Sem registro anterior nesta versão do score para comparar.</p>
            )}
            <p className="mt-2">
              Controles: {s.controls.total} no total · {s.controls.verificado} verificados · {s.controls.implementado} implementados · {s.controls.parcial} parciais · {s.controls.planejado} planejados · {s.controls.risks_linked} riscos cobertos.
            </p>
            <p className="mt-1">Documentos: {s.documents.total} · {s.documents.vencido} vencidos · {s.documents.vencendo} vencendo · {s.documents.faltante} faltantes.</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section aria-labelledby="exposicao" className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 id="exposicao" className="text-h3">Onde estamos expostos</h2>
            {s.exposures.length === 0 ? (
              <p className="mt-3 text-body-sm text-text-secondary">Nenhum risco crítico ou alto em aberto.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {s.exposures.map((e) => {
                  const sev = SEVERITY[e.severity]!;
                  return (
                    <li key={e.risk_id} className="flex flex-col gap-1 py-2.5 text-body-sm">
                      <Link href={`/riscos/${e.risk_id}`} className="font-medium text-text-primary hover:underline">{e.title}</Link>
                      <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                        <Badge label={sev.label} tone={sev.tone} icon={sev.icon} />
                        <span>{CATEGORY[e.category]}</span>
                        <span>{e.owner?.name ?? "sem responsável"}</span>
                        <span>{e.planned ? "com ação" : "sem ação"}</span>
                        <span>{e.coverage >= 1 ? "controle implementado" : e.coverage > 0 ? "controle parcial" : "sem controle"}</span>
                        {e.due_date ? <span>até {formatDate(e.due_date)}</span> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="decisoes" className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 id="decisoes" className="text-h3">O que precisa de decisão</h2>
            {s.decisions.length === 0 ? (
              <p className="mt-3 text-body-sm text-text-secondary">Nada bloqueado, sem dono ou vencido.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {s.decisions.map((d) => (
                  <li key={`${d.kind}-${d.id}`} className="flex items-center justify-between gap-3 py-2.5 text-body-sm">
                    <Link href={d.kind === "action" ? `/acoes/${d.id}` : d.kind === "risk" ? `/riscos/${d.id}` : `/documentos/${d.id}`} className="font-medium text-text-primary hover:underline">{d.title}</Link>
                    <span className="shrink-0 text-caption text-warning-text">{d.why}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="melhorou" className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 id="melhorou" className="text-h3">O que melhorou</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
              {gains.map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <dt className="text-caption text-text-secondary">{label}</dt>
                  <dd className={`text-h2 tabular-nums ${value > 0 ? "text-success-text" : "text-text-primary"}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="piorou" className="rounded-lg border border-border bg-surface-elevated p-5">
            <h2 id="piorou" className="text-h3">O que piorou ou pressiona</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
              {losses.map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <dt className="text-caption text-text-secondary">{label}</dt>
                  <dd className={`text-h2 tabular-nums ${value > 0 ? "text-danger-text" : "text-text-primary"}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <section aria-labelledby="proximos" className="rounded-lg border border-border bg-surface-elevated p-5">
          <h2 id="proximos" className="text-h3">Próximos 30 dias</h2>
          <p className="mt-1 text-caption text-text-secondary">As ações com maior redução de risco por esforço, e os riscos altos que ainda não têm plano.</p>
          <PrioritiesList prio={{ items: s.next_30_days, unplanned: s.unplanned, computed_at: s.computed_at, current_score: score.score ?? null, profile_complete: true, total_pending: s.next_30_days.length, due_soon_days: 7 }} />
        </section>

        <p className="text-caption text-text-secondary">{s.caveat} Gerado em {formatInstantDay(s.computed_at)}.</p>
      </div>
    </>
  );
}
