import type { CSSProperties } from "react";
import { PROBLEM } from "@/lib/marketing/copy";
import { Container, Section, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

const d = (ms: number): CSSProperties => ({ ["--d" as string]: `${ms}ms` });

/** Five hollow points, scattered (fixed positions) — the "before": no connection, no order. */
const SCATTER: [number, number][] = [
  [60, 30],
  [190, 70],
  [300, 22],
  [420, 62],
  [520, 38],
];

/** Five points on one line with blue centres and four connectors — the "after". */
const LINE_X = [56, 168, 280, 392, 504];

/**
 * Problem + transformation (03-ux-spec §4.3): dark beat right after the hero. Padding-top absorbs
 * the showcase bleed (128 + 80 / 96 + 48 / 64). Geometry only — no spreadsheet/folder icons.
 */
export function BeforeAfter() {
  return (
    <Section id={PROBLEM.id} tone="dark" className="lg:pt-52 md:pt-36">
      <Container>
        <Reveal>
          <SectionHeading eyebrowLang="en" id={PROBLEM.id} eyebrow={PROBLEM.eyebrow} title={PROBLEM.title} lead={PROBLEM.lead} className="max-w-[720px]" />
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-12 md:mt-12 md:grid-cols-2 lg:mt-16">
          <Reveal>
            <p className="text-label uppercase tracking-[0.06em] text-text-secondary">{PROBLEM.before.label}</p>
            <svg aria-hidden viewBox="0 0 560 96" className="mt-4 h-auto w-full text-text-muted">
              {SCATTER.map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r={7} className="stroke-current" strokeWidth={1.5} fill="none" />
              ))}
            </svg>
            <ul className="mt-6 flex flex-col gap-3 text-body text-text-secondary">
              {PROBLEM.before.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80}>
            <p className="text-label uppercase tracking-[0.06em] text-text-secondary">{PROBLEM.after.label}</p>
            <svg role="img" aria-label={PROBLEM.figureAlt} viewBox="0 0 560 96" className="mt-4 h-auto w-full text-text-primary">
              {LINE_X.slice(0, -1).map((x, idx) => (
                <rect
                  key={x}
                  x={x + 7}
                  y={47.25}
                  width={LINE_X[idx + 1]! - x - 14}
                  height={1.5}
                  className="m-draw-x fill-electric-blue"
                  style={d(100 * idx)}
                />
              ))}
              {LINE_X.map((x) => (
                <g key={x}>
                  <circle cx={x} cy={48} r={7} className="stroke-current" strokeWidth={1.5} fill="none" />
                  <circle cx={x} cy={48} r={2.5} className="fill-electric-blue" />
                </g>
              ))}
            </svg>
            <ul className="mt-6 flex flex-col gap-3 text-body text-text-primary">
              {PROBLEM.after.items.map((item, idx) => (
                <li key={item} className="m-rise" style={d(60 * idx)}>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <p className="max-w-[60ch] text-pretty text-body-lg text-text-secondary">{PROBLEM.cost}</p>
          <p className="mt-8 max-w-[36ch] text-pretty text-h2 font-display text-text-primary lg:text-[1.75rem] lg:leading-[1.25]">{PROBLEM.closing}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
