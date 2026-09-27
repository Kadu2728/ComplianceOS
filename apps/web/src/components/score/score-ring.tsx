import type { CSSProperties } from "react";

const GEOMETRY = {
  lg: { size: 160, stroke: 12, text: "text-score" },
  sm: { size: 128, stroke: 10, text: "text-score-compact" },
} as const;

/**
 * Score ring (visual-v2 §5.1): teal arc over its track, numeral in the centre with "/100" below.
 * The colour never changes with the band — teal is "level of control"; the band badge carries the
 * judgement. The SVG is decorative; the numeral is real text. `score` null → track only and "—"
 * (never "0/100"). Server component: the draw-in is a CSS animation of stroke-dashoffset.
 */
export function ScoreRing({ score, size = "lg" }: { score: number | null; size?: keyof typeof GEOMETRY }) {
  const g = GEOMETRY[size];
  const c = g.size / 2;
  const r = c - g.stroke / 2 - 1;
  const circumference = 2 * Math.PI * r;
  const value = score == null ? null : Math.max(0, Math.min(100, score));
  const arcStyle = { "--ring-c": circumference.toFixed(2) } as CSSProperties;
  return (
    <div className="relative shrink-0" style={{ width: g.size, height: g.size }}>
      <svg aria-hidden viewBox={`0 0 ${g.size} ${g.size}`} width={g.size} height={g.size} className="block">
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={g.stroke} className="stroke-score-track" />
        {value != null && value > 0 ? (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            strokeWidth={g.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference.toFixed(2)}
            strokeDashoffset={(circumference * (1 - value / 100)).toFixed(2)}
            transform={`rotate(-90 ${c} ${c})`}
            className="score-arc stroke-score-fill"
            style={arcStyle}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${g.text} tabular-nums ${value == null ? "text-text-muted" : "text-text-primary"}`}>
          {value ?? "—"}
          {value != null ? <span className="sr-only"> de 100</span> : null}
        </span>
        {value != null ? (
          <span aria-hidden className="mt-0.5 text-caption font-medium text-text-secondary">
            /100
          </span>
        ) : null}
      </div>
    </div>
  );
}
