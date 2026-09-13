import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BAND_TONE, formatDelta, formatInstantDay, formatPercent, formatPoints, refHref, type Score } from "@/lib/domain/score";

/**
 * Score de Compliance (brand §28, UX §13, D10): the number is never shown alone — band, delta,
 * "Por que N?" factor breakdown, what reduces it most, and the next concrete steps. Server
 * component: everything here is a projection of the API payload.
 */
export function ScoreCard({ score }: { score: Score }) {
  if (!score.available || score.score == null || !score.band) {
    return (
      <section aria-label="Score de Compliance" className="rounded-lg border border-border bg-surface-elevated p-6">
        <span className="text-label uppercase text-text-secondary">Score de Compliance</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-score tabular-nums">—</span>
          <span className="text-body-sm text-text-secondary">/ 100</span>
        </div>
        <p className="mt-2 text-caption text-text-secondary">{score.message ?? "Score disponível após o diagnóstico."}</p>
      </section>
    );
  }

  const factors = score.factors ?? [];
  const reducers = score.top_reducers ?? [];
  const steps = score.next_actions ?? [];
  const delta = score.delta;
  return (
    <section aria-labelledby="score-title" className="rounded-lg border border-border bg-surface-elevated">
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 id="score-title" className="text-label uppercase text-text-secondary">Score de Compliance</h2>
          <p className="text-caption text-text-secondary">Indicador de maturidade</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="text-score tabular-nums">{score.score}</span>
            <span className="text-body-sm text-text-secondary">/ 100</span>
            <Badge label={score.band.label} tone={BAND_TONE[score.band.key] ?? "neutral"} />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-body-sm text-text-secondary">
            {delta ? (
              <>
                {delta.diff > 0 ? (
                  <ArrowUpRight aria-hidden size={16} strokeWidth={1.5} className="text-success-text" />
                ) : delta.diff < 0 ? (
                  <ArrowDownRight aria-hidden size={16} strokeWidth={1.5} className="text-danger-text" />
                ) : (
                  <Minus aria-hidden size={16} strokeWidth={1.5} />
                )}
                <span className={`tabular-nums font-medium ${delta.diff > 0 ? "text-success-text" : delta.diff < 0 ? "text-danger-text" : "text-text-primary"}`}>
                  {formatDelta(delta.diff)}
                </span>
                <span>desde {formatInstantDay(delta.previous_at)}</span>
              </>
            ) : (
              <span>Primeiro registro — a variação aparece a partir de amanhã.</span>
            )}
          </p>
          {score.preliminary ? (
            <p className="mt-3 max-w-md text-caption text-text-secondary">
              Score preliminar — baseado no diagnóstico rápido.{" "}
              <Link href="/diagnostico" className="font-medium text-electric-blue hover:underline">Responda o diagnóstico completo</Link> para consolidar.
            </p>
          ) : score.assessment_completed === false ? (
            <p className="mt-3 max-w-md text-caption text-text-secondary">
              Diagnóstico em andamento — <Link href="/diagnostico" className="font-medium text-electric-blue hover:underline">conclua</Link> para consolidar o score.
            </p>
          ) : null}
        </div>

        <div className="lg:w-[420px]">
          <h3 className="text-body font-medium">Por que {score.score}?</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {factors.map((f) => (
              <li key={f.key}>
                <div className="flex items-baseline justify-between gap-3 text-body-sm">
                  <span className="font-medium text-text-primary">
                    {f.label} <span className="font-normal text-text-secondary">· peso {formatPercent(f.weight)}</span>
                  </span>
                  <span className="tabular-nums text-text-secondary">
                    <span className="font-medium text-text-primary">{formatPoints(f.contribution)}</span> de {formatPercent(f.weight).replace("%", "")} pts
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface-hover" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(f.value)} aria-label={`${f.label}: ${formatPoints(f.value)} de 100`}>
                  <div className="h-full bg-electric-blue transition-[width] duration-(--duration-complex) ease-(--ease-out)" style={{ width: `${f.value}%` }} />
                </div>
                <p className="mt-1 text-caption text-text-secondary">{f.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {reducers.length > 0 || steps.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 border-t border-border p-6 md:grid-cols-2">
          <div>
            <h3 className="text-body font-medium">O que mais reduz o score</h3>
            {reducers.length === 0 ? (
              <p className="mt-2 text-body-sm text-text-secondary">Nada reduz o score no momento.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-3">
                {reducers.map((r) => (
                  <li key={r.reason} className="text-body-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-text-primary">{r.title}</span>
                      <span className="shrink-0 tabular-nums text-danger-text">−{formatPoints(r.points)} pts</span>
                    </div>
                    {r.refs.some((x) => x.id) ? (
                      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-caption">
                        {r.refs.filter((x) => x.id).map((x) => (
                          <li key={x.id}>
                            <Link href={refHref(x)} className="text-text-secondary hover:text-text-primary hover:underline">{x.title}</Link>
                          </li>
                        ))}
                        {r.count > r.refs.length ? <li className="text-text-secondary">+{r.count - r.refs.length}</li> : null}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div>
            <h3 className="text-body font-medium">Próximos passos</h3>
            {steps.length === 0 ? (
              <p className="mt-2 text-body-sm text-text-secondary">Continue registrando evidências e mantendo as ações em dia.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {steps.map((a, i) => (
                  <li key={`${a.kind}-${a.id ?? i}`}>
                    <Link href={refHref(a)} className="flex min-h-10 items-center gap-3 rounded-md border border-border px-3 py-2 text-body-sm text-text-primary hover:bg-surface-hover">
                      <span className="tabular-nums text-text-secondary">{i + 1}.</span>
                      <span className="font-medium">{a.label}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}
      <p className="border-t border-border px-6 py-3 text-caption text-text-secondary">
        Indicador de maturidade calculado a partir dos seus registros (versão {score.score_version}). Não é uma medida de conformidade legal.
      </p>
    </section>
  );
}
