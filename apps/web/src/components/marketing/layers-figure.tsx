import type { CSSProperties } from "react";
import { CONTROL_LAYER } from "@/lib/marketing/copy";
import { Reveal } from "./reveal";

/* Geometry (landing-v2 §4.5.2): five isometric planes in a 560 × 412 box. */
const CX = 144;
const HW = 140;
const HH = 56;
const THICK = 6;
const cy = (i: number) => 88 + 64 * i;
const STROKE_OPACITY = [1, 0.72, 0.52, 0.38, 0.28];
const EDGE_OPACITY = [0.3, 0.18, 0.14, 0.1, 0.08];

const top = (y: number) => `M${CX},${y - HH} L${CX + HW},${y} L${CX},${y + HH} L${CX - HW},${y} Z`;
const edge = (y: number) =>
  `M${CX - HW},${y} L${CX},${y + HH} L${CX + HW},${y} L${CX + HW},${y + THICK} L${CX},${y + HH + THICK} L${CX - HW},${y + THICK} Z`;

/** Control points of the top plane: a 6 × 6 lattice between its top, right and left vertices. */
const LATTICE = (() => {
  const t = { x: CX, y: cy(0) - HH };
  const r = { x: CX + HW, y: cy(0) };
  const l = { x: CX - HW, y: cy(0) };
  const pts: { x: number; y: number }[] = [];
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      pts.push({ x: t.x + (a / 7) * (r.x - t.x) + (b / 7) * (l.x - t.x), y: t.y + (a / 7) * (r.y - t.y) + (b / 7) * (l.y - t.y) });
    }
  }
  return pts;
})();

const delay = (ms: number) => ({ ["--d" as string]: `${ms}ms` }) as CSSProperties;

/**
 * The Control Layer diagram (landing-v2 §4.5, owner decision 5): an inline SVG of stacked planes
 * — evidence at the base, visibility on top — with HTML labels. Colours come from tokens; one
 * static radial glow; no filter, no canvas, no loop. Reveal: planes rise bottom → top, then the
 * connectors draw (CSS, off with reduced motion).
 */
export function LayersFigure() {
  return (
    <Reveal as="figure" className="relative mx-auto w-full max-w-[292px] sm:max-w-[560px]">
      {/* Below 640 the box shows only the planes (x 0–292 of the viewBox); labels move under it (§4.5.3). */}
      <div className="relative aspect-[292/412] overflow-hidden sm:aspect-[560/412] sm:overflow-visible">
      <svg viewBox="0 0 560 412" aria-hidden className="absolute inset-y-0 left-0 h-full w-[191.8%] max-w-none overflow-visible sm:w-full">
        <defs>
          <radialGradient id="cl-glow">
            <stop offset="0" style={{ stopColor: "var(--color-primary)", stopOpacity: 0.22 }} />
            <stop offset="1" style={{ stopColor: "var(--color-primary)", stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id="cl-face" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-primary-tint)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-surface-base)" }} />
          </linearGradient>
        </defs>
        <ellipse cx={CX} cy={96} rx={200} ry={96} fill="url(#cl-glow)" className="m-fade" />
        {[4, 3, 2, 1, 0].map((i) => (
          <g key={i} className="m-rise" style={delay((4 - i) * 80)}>
            <path d={edge(cy(i))} className="fill-primary" fillOpacity={EDGE_OPACITY[i]} />
            <path
              d={top(cy(i))}
              fill="url(#cl-face)"
              fillOpacity={0.92}
              className="stroke-primary-text"
              strokeOpacity={STROKE_OPACITY[i]}
              strokeWidth={1.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {i === 0 ? (
              <>
                {LATTICE.map((p) => (
                  <circle key={`${p.x.toFixed(1)}-${p.y.toFixed(1)}`} cx={p.x} cy={p.y} r={1.25} className="fill-primary-text" fillOpacity={0.45} />
                ))}
                <circle cx={CX} cy={cy(0)} r={9} fill="none" className="stroke-primary-text" strokeOpacity={0.5} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <circle cx={CX} cy={cy(0)} r={3.5} className="fill-primary-text" />
              </>
            ) : null}
          </g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={`c${i}`}>
            <circle cx={CX + HW} cy={cy(i)} r={2.5} className={i === 0 ? "fill-primary-text" : "fill-text-muted"} />
            <line
              x1={292}
              x2={312}
              y1={cy(i)}
              y2={cy(i)}
              className="m-draw-x stroke-border-strong"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              style={delay(400 + (4 - i) * 80)}
            />
          </g>
        ))}
      </svg>
      <ol className="absolute inset-0 hidden sm:block">
        {CONTROL_LAYER.layers.map((layer, i) => (
          <li
            key={layer.label}
            className="m-rise absolute right-0 left-[57.14%] -mt-2.5"
            style={{ top: `${(cy(i) / 412) * 100}%`, ...delay(460 + (4 - i) * 80) }}
          >
            <span className={`block text-body-sm leading-5 ${i === 0 ? "font-medium text-text-primary" : "text-text-secondary"}`}>{layer.label}</span>
            <span className="mt-0.5 hidden text-caption text-text-muted lg:block">{layer.note}</span>
          </li>
        ))}
      </ol>
      </div>
      <ol className="mt-4 flex flex-col gap-2 sm:hidden">
        {CONTROL_LAYER.layers.map((layer, i) => (
          <li key={layer.label} className="flex items-center gap-3 text-body-sm">
            <span aria-hidden className={`size-2 shrink-0 rounded-full ${i === 0 ? "bg-primary-text" : "bg-text-muted"}`} />
            <span className={i === 0 ? "font-medium text-text-primary" : "text-text-secondary"}>{layer.label}</span>
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">{CONTROL_LAYER.figureCaption}</figcaption>
    </Reveal>
  );
}
