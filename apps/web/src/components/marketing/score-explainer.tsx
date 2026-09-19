import type { CSSProperties } from "react";
import { ScoreCard } from "@/components/score/score-card";
import { Badge } from "@/components/ui/badge";
import { SCORE } from "@/lib/marketing/copy";
import { demoScore } from "@/lib/marketing/fixtures";
import { Container, Section, SectionHeading } from "./primitives";
import { ProductFigure } from "./product-figure";
import { Reveal } from "./reveal";

const d = (ms: number): CSSProperties => ({ ["--d" as string]: `${ms}ms` });

/**
 * Score de Compliance (03-ux-spec §2.8): the real `ScoreCard` on the same fixture as the hero
 * (the number never changes between blocks), the five factors with weight bars (the card already
 * shows the values), the four bands and the mandatory limit sentence — visible, not a footnote.
 */
export function ScoreExplainer({ now }: { now: Date }) {
  const score = demoScore(now);
  return (
    <Section id={SCORE.id} tone="dark">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-16">
        <Reveal className="lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <SectionHeading eyebrowLang="en" id={SCORE.id} eyebrow={SCORE.eyebrow} title={SCORE.title} lead={SCORE.lead} />
        </Reveal>

        <Reveal delay={80} className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <ProductFigure id="score-card-figure" alt={SCORE.alt} frame={false}>
            <ScoreCard score={score} />
          </ProductFigure>
        </Reveal>

        <Reveal className="lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <h3 className="text-h3 text-text-primary">{SCORE.factorsTitle}</h3>
          <ul className="mt-5 flex flex-col gap-5">
            {SCORE.factors.map((f, idx) => (
              <li key={f.label} className="m-rise" style={d(60 * idx)}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-body font-medium text-text-primary">{f.label}</span>
                  <span className="text-body-sm tabular-nums text-text-secondary">peso {Math.round(f.weight * 100)}%</span>
                </div>
                <div role="img" aria-label={`${f.label}: peso ${Math.round(f.weight * 100)}%`} className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface-hover">
                  <div className="m-bar h-full rounded-pill bg-electric-blue" style={{ width: `${Math.min(100, f.weight * 250)}%`, ...d(200 + 60 * idx) }} />
                </div>
                <p className="mt-1.5 text-body-sm text-text-secondary">{f.text}</p>
              </li>
            ))}
          </ul>

          <h3 className="mt-10 text-h3 text-text-primary">{SCORE.bandsTitle}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SCORE.bands.map((b) => (
              <li key={b.label}>
                <Badge label={`${b.label} · ${b.range}`} tone={"active" in b && b.active ? "info" : "neutral"} />
              </li>
            ))}
          </ul>

          <ul className="mt-8 flex flex-col gap-2 text-body-sm text-text-secondary">
            {SCORE.card.map((c) => (
              <li key={c.title}>
                <span className="font-medium text-text-primary">{c.title}</span> — {c.text}
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-[52ch] text-pretty text-body text-text-primary">{SCORE.limit}</p>
        </Reveal>

        <Reveal className="lg:col-span-12 lg:row-start-3">
          <p className="max-w-[40ch] text-pretty text-h2 font-display text-text-primary lg:text-[2rem] lg:leading-[1.2]">{SCORE.closing}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
