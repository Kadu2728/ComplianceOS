import { formatInstantDay } from "@/lib/domain/score";

type Point = { score: number; computed_at: string; preliminary: boolean };

const MONTH = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" });
const DAY_MONTH = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
const DAY = 24 * 60 * 60 * 1000;

function monthLabel(d: Date): string {
  const m = MONTH.format(d).replace(".", "");
  return m.charAt(0).toUpperCase() + m.slice(1);
}

/** Y domain padded to tens, at least 20 points tall, inside 0–100 (visual-v2 §5.2). */
export function trendDomain(scores: number[]): [number, number] {
  if (scores.length === 0) return [0, 100];
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  let lo = Math.max(0, Math.floor((min - 5) / 10) * 10);
  let hi = Math.min(100, Math.ceil((max + 5) / 10) * 10);
  while (hi - lo < 20) {
    if (lo > 0) lo = Math.max(0, lo - 10);
    if (hi - lo < 20 && hi < 100) hi = Math.min(100, hi + 10);
  }
  return [lo, hi];
}

/**
 * "Evolução" chart (visual-v2 §5.2): the score over time, time-proportional on x (not
 * index-spaced), a padded y domain whose bounds are printed (a truncated axis must be visible),
 * teal line + faint area, round HTML markers so they never stretch. Preliminary (short-mode)
 * snapshots are hollow. No tooltip, no client JS; the wrapper carries the text equivalent.
 */
export function TrendChart({ points }: { points: Point[] }) {
  if (points.length < 2) {
    return (
      <p className="flex h-[140px] items-center text-caption text-text-secondary max-sm:h-[116px]">
        A evolução aparece a partir do segundo registro do score.
      </p>
    );
  }
  const times = points.map((p) => new Date(p.computed_at).getTime());
  const t0 = times[0]!;
  const span = Math.max(times[times.length - 1]! - t0, 1);
  const [lo, hi] = trendDomain(points.map((p) => p.score));
  const x = (t: number) => ((t - t0) / span) * 100;
  const y = (s: number) => ((hi - s) / (hi - lo)) * 100;
  const coords = points.map((p, i) => [x(times[i]!) * 10, y(p.score)] as const);
  const line = coords.map(([cx, cy], i) => `${i === 0 ? "M" : "L"}${cx.toFixed(1)},${cy.toFixed(2)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1]![0].toFixed(1)},100 L0,100 Z`;

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const min = Math.min(...points.map((p) => p.score));
  const max = Math.max(...points.map((p) => p.score));
  const label = `Score de ${first.score} em ${formatInstantDay(first.computed_at)} para ${last.score} em ${formatInstantDay(last.computed_at)}; mínimo ${min}, máximo ${max}, ${points.length} registros.`;

  // Up to 6 ticks evenly spaced in time; months when the span is ≥ 90 days, else dd/mm.
  const byMonth = span >= 90 * DAY;
  const ticks = Array.from({ length: 6 }, (_, i) => t0 + (span * i) / 5);
  const fmt = (t: number) => (byMonth ? monthLabel(new Date(t)) : DAY_MONTH.format(new Date(t)));
  // A short span repeats the same day on every tick: keep each label once (the first occurrence).
  const labels = ticks.map((t, i) => (i > 0 && fmt(t) === fmt(ticks[i - 1]!) ? null : fmt(t)));
  const preliminary = points.some((p) => p.preliminary);

  return (
    <div role="img" aria-label={label} className="flex gap-2">
      <div aria-hidden className="flex h-[120px] w-7 shrink-0 flex-col justify-between text-caption text-text-muted tabular-nums max-sm:h-24">
        <span className="-translate-y-1/2">{hi}</span>
        <span className="translate-y-1/2">{lo}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div aria-hidden className="relative h-[120px] max-sm:h-24">
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <linearGradient id="score-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" className="[stop-color:var(--color-score-fill)] [stop-opacity:var(--trend-area)]" />
                <stop offset="1" className="[stop-color:var(--color-score-fill)] [stop-opacity:0]" />
              </linearGradient>
            </defs>
            <line x1="0" x2="1000" y1="100" y2="100" className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <path d={area} fill="url(#score-area)" className="trend-area" />
            <path
              d={line}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="trend-line stroke-score-fill"
            />
          </svg>
          {points.map((p, i) =>
            p.preliminary || i === points.length - 1 ? (
              <span
                key={p.computed_at}
                className={`trend-marker absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-pill ${
                  p.preliminary ? "border-[1.5px] border-score-fill bg-surface-elevated" : "bg-score-fill shadow-[0_0_0_2px_var(--color-surface-elevated)]"
                }`}
                style={{ left: `${x(times[i]!)}%`, top: `${y(p.score)}%` }}
              />
            ) : null,
          )}
        </div>
        <div aria-hidden className="relative mt-1 h-5 text-caption text-text-muted tabular-nums">
          {ticks.map((t, i) =>
            labels[i] == null ? null : (
            <span
              key={i}
              className={`absolute top-0 whitespace-nowrap ${i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${
                i === 0 || i === ticks.length - 1 || i === 2 ? "" : "max-sm:hidden"
              }`}
              style={{ left: `${(i / 5) * 100}%` }}
            >
              {labels[i]}
            </span>
            ),
          )}
        </div>
        {preliminary ? <p className="text-right text-caption text-text-muted">○ preliminar</p> : null}
      </div>
    </div>
  );
}
