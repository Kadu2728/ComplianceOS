import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/score/score-ring";
import { TrendChart } from "@/components/score/trend-chart";
import { Badge } from "@/components/ui/badge";
import type { ScoreHistory } from "@/lib/domain/queries";
import { BAND_TONE, formatDelta, formatInstantDay, formatPoints, type Score } from "@/lib/domain/score";
import { CardError, DashCard } from "./card";

function Delta({ score }: { score: Score }) {
  const delta = score.delta;
  if (!delta) return <span className="text-caption text-text-muted">Primeiro registro</span>;
  const Icon = delta.diff > 0 ? ArrowUpRight : delta.diff < 0 ? ArrowDownRight : Minus;
  const color = delta.diff > 0 ? "text-success-text" : delta.diff < 0 ? "text-danger-text" : "text-text-secondary";
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className={`flex items-center gap-1 text-body-sm font-semibold tabular-nums ${color}`}>
        <Icon aria-hidden size={16} strokeWidth={1.5} />
        {formatDelta(delta.diff)} pts
      </span>
      <span className="text-caption text-text-muted">desde {formatInstantDay(delta.previous_at)}</span>
    </span>
  );
}

const LINK = "font-medium text-primary-text hover:text-primary-text-hover hover:underline";

/**
 * Card 1 — Score de Compliance (visual-v2 §4.5): ring + "Evolução" chart, band and delta in
 * points (never "%"), and a footer with the biggest reducer and the way to the full explanation
 * ("Por que N?") — the number is never shown without its reasons one click away.
 */
export function ScoreSummaryCard({ score, history, className = "" }: { score: Score | null; history: ScoreHistory | null; className?: string }) {
  if (!score) {
    return (
      <DashCard id="score-title" title="Score de Compliance" caption="Indicador de maturidade" className={className}>
        <CardError what="o score" />
      </DashCard>
    );
  }
  const available = score.available && score.score != null && !!score.band;
  const points = [...(history?.items ?? [])].reverse();
  const reducer = score.top_reducers?.[0];

  const footer = available ? (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="min-w-0 truncate">
          {reducer ? (
            <>
              Maior redutor: <span className="text-text-primary">{reducer.title}</span> (−{formatPoints(reducer.points)} pts)
            </>
          ) : (
            "Nada reduz o score no momento."
          )}
        </span>
        <a href="#por-que" className={`shrink-0 text-body-sm ${LINK}`}>
          Por que {score.score}?
        </a>
      </p>
      {score.preliminary ? (
        <p>
          Score preliminar — baseado no diagnóstico rápido.{" "}
          <Link href="/diagnostico" className={LINK}>
            Responder o diagnóstico completo
          </Link>
        </p>
      ) : score.assessment_completed === false ? (
        <p>
          Diagnóstico em andamento — conclua para consolidar o score.{" "}
          <Link href="/diagnostico" className={LINK}>
            Continuar
          </Link>
        </p>
      ) : null}
    </div>
  ) : undefined;

  return (
    <section aria-labelledby="score-title" className={`flex min-w-0 flex-col rounded-lg border border-border bg-surface-elevated p-4 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="score-title" className="text-h3 text-text-primary">
            Score de Compliance
          </h2>
          <p className="mt-0.5 text-caption text-text-secondary">Indicador de maturidade</p>
        </div>
        {available ? (
          <div className="flex items-start gap-3 max-sm:hidden">
            <Badge label={score.band!.label} tone={BAND_TONE[score.band!.key] ?? "neutral"} />
            <Delta score={score} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex items-center gap-4">
          <span className="max-sm:hidden">
            <ScoreRing score={available ? score.score! : null} />
          </span>
          <span className="sm:hidden">
            <ScoreRing score={available ? score.score! : null} size="sm" />
          </span>
          {available ? (
            <div className="flex flex-col items-start gap-2 sm:hidden">
              <Badge label={score.band!.label} tone={BAND_TONE[score.band!.key] ?? "neutral"} />
              <Delta score={score} />
            </div>
          ) : (
            <p className="max-w-[200px] text-caption text-text-secondary">{score.message ?? "Score disponível após o diagnóstico."}</p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="text-body-sm font-medium text-text-secondary">Evolução</h3>
            {available && points.length > 0 ? (
              <span className="text-caption text-text-muted tabular-nums">
                {points.length} {points.length === 1 ? "registro" : "registros"}
              </span>
            ) : null}
          </div>
          {!available ? (
            <p className="text-caption text-text-secondary">A evolução aparece depois do primeiro diagnóstico.</p>
          ) : history ? (
            <TrendChart points={points} />
          ) : (
            <p className="text-caption text-text-secondary">Evolução indisponível no momento.</p>
          )}
        </div>
      </div>

      {footer ? <div className="mt-4 border-t border-border pt-3 text-caption text-text-secondary">{footer}</div> : null}
    </section>
  );
}
