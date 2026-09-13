import type { Metadata } from "next";
import Link from "next/link";
import { ReopenButton } from "@/components/assessment/reopen-button";
import { AssessmentRunner } from "@/components/assessment/runner";
import { AssessmentStart } from "@/components/assessment/start";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiGet } from "@/lib/api/server";
import type { paths } from "@/lib/api/schema";
import { RISK_STATUS, SEVERITY, formatDate } from "@/lib/domain/labels";
import { BAND_TONE, type Score } from "@/lib/domain/score";
import { getSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Diagnóstico" };

type State = paths["/api/v1/orgs/{org_id}/assessment"]["get"]["responses"]["200"]["content"]["application/json"];
type Questions = paths["/api/v1/orgs/{org_id}/assessment/questions"]["get"]["responses"]["200"]["content"]["application/json"];
type Result = paths["/api/v1/orgs/{org_id}/assessment/result"]["get"]["responses"]["200"]["content"]["application/json"];

const ORDER = ["critico", "alto", "medio", "baixo"] as const;

export default async function DiagnosticoPage() {
  const session = await getSession();
  if (!session) return null;
  const orgId = session.membership.organization.id;
  const base = `/api/v1/orgs/${orgId}/assessment`;
  const state = await apiGet<State>(base);
  const canAnswer = session.membership.role !== "viewer";
  if (!state) return null;

  if (state.status === "none") {
    return (
      <>
        <PageHeader title="Diagnóstico" description="Responda por seção para identificar riscos e gerar seu score." />
        <AssessmentStart orgId={orgId} shortSize={state.short_mode_size} fullSize={state.full_mode_size} canAnswer={canAnswer} />
      </>
    );
  }

  if (state.status === "in_progress") {
    const data = await apiGet<Questions>(`${base}/questions`);
    if (!data) return null;
    return (
      <>
        <PageHeader
          title="Diagnóstico"
          description={state.mode === "short" ? "Diagnóstico rápido — as perguntas de maior impacto." : "Diagnóstico completo — sete seções. Cada resposta é salva automaticamente."}
        />
        <AssessmentRunner orgId={orgId} data={data} canAnswer={canAnswer} />
      </>
    );
  }

  const [result, score] = await Promise.all([
    apiGet<Result>(`${base}/result`),
    apiGet<Score>(`/api/v1/orgs/${orgId}/score`),
  ]);
  const counts = result?.open_by_severity ?? {};
  const totalOpen = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <>
      <PageHeader
        title="Diagnóstico concluído"
        description={`${state.mode === "short" ? "Diagnóstico rápido" : "Diagnóstico completo"} · concluído em ${formatDate(state.completed_at)}`}
        action={<ButtonLink href="/riscos">Ver riscos</ButtonLink>}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface-elevated p-6">
            <h2 className="text-h3">O que o diagnóstico identificou</h2>
            <p className="mt-1 text-body-sm text-text-secondary">
              {totalOpen === 0 ? "Nenhum risco aberto derivado das respostas." : `${totalOpen} ${totalOpen === 1 ? "risco aberto" : "riscos abertos"} derivados das suas respostas.`}
              {result && result.uncertain > 0 ? ` ${result.uncertain} com resposta "não sei" — confirme quando puder.` : ""}
              {result && result.in_review > 0 ? ` ${result.in_review} em revisão — você respondeu “Sim”; feche com evidência.` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ORDER.filter((k) => counts[k]).map((k) => (
                <span key={k} className="inline-flex items-center gap-2">
                  <Badge label={`${counts[k]} ${SEVERITY[k]!.label}`} tone={SEVERITY[k]!.tone} icon={SEVERITY[k]!.icon} />
                </span>
              ))}
            </div>
            {result && result.risks.length > 0 ? (
              <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
                {result.risks.slice(0, 8).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-body-sm">
                    <Link href={`/riscos/${r.id}`} className="font-medium text-text-primary hover:underline">{r.title}</Link>
                    <span className="flex shrink-0 items-center gap-2">
                      {r.status !== "aberto" ? <Badge label={RISK_STATUS[r.status]!.label} tone={RISK_STATUS[r.status]!.tone} icon={RISK_STATUS[r.status]!.icon} /> : null}
                      <Badge label={SEVERITY[r.severity]!.label} tone={SEVERITY[r.severity]!.tone} icon={SEVERITY[r.severity]!.icon} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
          <p className="text-caption text-text-secondary">
            Diagnóstico baseado nas suas respostas — não é uma avaliação jurídica. Evidências anexadas aos riscos e ações fortalecem o score.
          </p>
        </div>
        <aside className="flex flex-col gap-3 rounded-lg border border-border bg-surface-elevated p-5">
          {score?.available && score.score != null && score.band ? (
            <Link href="/" className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3 hover:bg-surface-hover">
              <span className="flex flex-col">
                <span className="text-label uppercase text-text-secondary">{score.preliminary ? "Score preliminar" : "Score de Compliance"}</span>
                <span className="text-caption text-text-secondary">Ver explicação na Visão geral</span>
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-h2 tabular-nums">{score.score}</span>
                <Badge label={score.band.label} tone={BAND_TONE[score.band.key] ?? "neutral"} />
              </span>
            </Link>
          ) : null}
          <h2 className="text-h3">Próximos passos</h2>
          <p className="text-body-sm text-text-secondary">Abra cada risco, defina responsável e crie a primeira ação.</p>
          {canAnswer ? (
            <>
              {state.mode === "short" ? <ReopenButton orgId={orgId} mode="full" label="Continuar diagnóstico completo" variant="primary" /> : null}
              <ReopenButton orgId={orgId} label="Revisar respostas" />
            </>
          ) : null}
          <p className="text-caption text-text-secondary">Revisar respostas atualiza os riscos existentes; nunca cria duplicados. Uma resposta “Sim” envia o risco para revisão — ele é fechado com evidência.</p>
        </aside>
      </div>
    </>
  );
}
