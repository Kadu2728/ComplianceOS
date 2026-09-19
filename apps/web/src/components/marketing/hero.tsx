import type { CSSProperties } from "react";
import { PrioritiesPanel } from "@/components/domain/priorities-panel";
import { RadarPanel } from "@/components/domain/radar-panel";
import { ScoreCard } from "@/components/score/score-card";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { HERO } from "@/lib/marketing/copy";
import { demoPriorities, demoRadar, demoScore } from "@/lib/marketing/fixtures";
import { CtaLink } from "./cta";
import { Container, Eyebrow } from "./primitives";
import { ProductFigure } from "./product-figure";

export const HERO_SENTINEL_ID = "hero-sentinel";

const i = (n: number): CSSProperties => ({ ["--i" as string]: n });
const delay = (ms: number): CSSProperties => ({ ["--delay" as string]: `${ms}ms` });

/**
 * Hero (03-ux-spec §2.2, §3): editorial text column, then the real Visão geral composed from the
 * product's own components on an illustrative fixture (visible caption says so). The frame
 * bleeds 80 / 48 / 0 px into the next section; Problem compensates in its padding-top. Load
 * sequence is CSS (`hero-seq`, `hero-frame`, `hero-stage`), no observer above the fold.
 */
export function Hero({ now }: { now: Date }) {
  return (
    <section id="hero" aria-labelledby="hero-title" className="bg-surface-base pt-12 md:pt-16 lg:pt-20">
      <Container>
        <div className="hero-seq max-w-[800px]">
          <Eyebrow className="mb-4" style={i(0)}>
            {HERO.eyebrow}
          </Eyebrow>
          <h1 id="hero-title" lang="en" className="text-hero text-text-primary" style={i(1)}>
            <span className="block">{HERO.title[0]}</span>
            <span className="block">{HERO.title[1]}</span>
          </h1>
          <p className="mt-6 max-w-[60ch] text-pretty text-body-lg text-text-secondary" style={i(2)}>
            {HERO.lead}
          </p>
          <p className="mt-4 text-body-sm text-text-secondary" style={i(3)}>
            {HERO.audience}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row" style={i(4)}>
            <CtaLink href={HERO.primary.href} variant="primary" size="lg">
              {HERO.primary.label}
            </CtaLink>
            <CtaLink href={HERO.secondary.href} variant="secondary" size="lg">
              {HERO.secondary.label}
            </CtaLink>
          </div>
          <p className="mt-4 text-label text-text-secondary" style={i(5)}>
            {HERO.microcopy.map((item, idx) => (
              <span key={item} className="inline-block">
                {idx > 0 ? <span aria-hidden className="mx-2">·</span> : null}
                {item}
              </span>
            ))}
          </p>
        </div>

        <HeroShowcase now={now} />
      </Container>
      <div id={HERO_SENTINEL_ID} aria-hidden className="h-px" />
    </section>
  );
}

function HeroShowcase({ now }: { now: Date }) {
  const score = demoScore(now);
  const radar = demoRadar(now);
  const prio = demoPriorities(now, 3);
  return (
    <ProductFigure
      id="hero-showcase"
      alt={HERO.showcaseAlt}
      caption={HERO.showcaseCaption}
      className="hero-frame relative z-[1] mt-12 md:-mb-12 md:mt-16 lg:-mb-20"
      stageClassName="hero-stage grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-6"
    >
      <div className="lg:col-span-12" style={delay(350)}>
        <PageHeader
          titleTag="p"
          title="Visão geral"
          description="Onde sua empresa está, o que precisa de atenção hoje e o que fazer a seguir."
          action={
            <span className="hidden md:inline-flex">
              <ButtonLink href="/resumo" variant="secondary">Resumo executivo</ButtonLink>
            </span>
          }
        />
      </div>
      <div className="rounded-lg lg:col-span-7 lg:row-start-2 lg:shadow-popover xl:col-span-8" style={delay(450)}>
        <ScoreCard score={score} />
      </div>
      <div className="lg:col-span-12 lg:row-start-3" style={delay(650)}>
        <RadarPanel radar={radar} />
      </div>
      {/* Not shown below md (03-ux-spec §3.2): hidden by CSS — a server component cannot branch on the viewport. */}
      <div className="hidden rounded-lg md:block lg:col-span-5 lg:row-start-2 lg:mt-12 lg:shadow-popover xl:col-span-4" style={delay(550)}>
        <PrioritiesPanel prio={prio} compact />
      </div>
    </ProductFigure>
  );
}
