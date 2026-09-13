import { formatInstantDay } from "@/lib/domain/score";

type Point = { score: number; computed_at: string; preliminary: boolean };

/**
 * Score trend as an inline SVG sparkline (brand §29: clarity over decoration; no chart library, D22).
 * Points are snapshots oldest → newest; preliminary (short-mode) snapshots are hollow so trends never
 * mix preliminary and consolidated values silently (score proposal §6).
 */
export function ScoreTrend({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return (
      <p className="text-caption text-text-secondary">
        A tendência aparece a partir do segundo registro do score.
      </p>
    );
  }
  const w = 320;
  const h = 64;
  const pad = 6;
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / (points.length - 1));
  const ys = points.map((p) => pad + ((100 - p.score) * (h - 2 * pad)) / 100);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(" ");
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const min = Math.min(...points.map((p) => p.score));
  const max = Math.max(...points.map((p) => p.score));
  const label = `Score de ${first.score} em ${formatInstantDay(first.computed_at)} para ${last.score} em ${formatInstantDay(last.computed_at)}; mínimo ${min}, máximo ${max}, ${points.length} registros.`;
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="h-16 w-full max-w-[320px] overflow-visible">
        <line x1={pad} x2={w - pad} y1={pad + (h - 2 * pad) * 0.6} y2={pad + (h - 2 * pad) * 0.6} className="stroke-border" strokeDasharray="2 3" />
        <path d={d} fill="none" className="stroke-electric-blue" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.computed_at} cx={xs[i]} cy={ys[i]} r={2.5} className={p.preliminary ? "fill-surface-elevated stroke-electric-blue" : "fill-electric-blue stroke-electric-blue"} strokeWidth={1.5} />
        ))}
      </svg>
      <figcaption className="flex justify-between text-caption text-text-secondary tabular-nums">
        <span>{formatInstantDay(first.computed_at)}</span>
        <span>{points.some((p) => p.preliminary) ? "○ preliminar" : ""}</span>
        <span>{formatInstantDay(last.computed_at)}</span>
      </figcaption>
    </figure>
  );
}
