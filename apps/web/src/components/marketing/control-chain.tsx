import type { CSSProperties } from "react";
import { CONTROL_LAYER } from "@/lib/marketing/copy";
import { Container, ControlDot, Section, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

const d = (ms: number): CSSProperties => ({ ["--d" as string]: `${ms}ms` });

/** Length of the return-arc path in viewBox units (numerically integrated); drives the dash draw. */
const ARC_LENGTH = 138;

/**
 * The Control Layer as geometry (03-ux-spec §2.5): five nodes on a rail, four connectors that
 * draw, a return arc from MONITORING to RISK (≥ lg only), text under each node. Below lg the
 * chain is vertical with a left rail and no arc (brand §37). Motion is CSS driven by one Reveal.
 */
export function ControlChain() {
  const links = CONTROL_LAYER.links;
  return (
    <Section id={CONTROL_LAYER.id}>
      <Container>
        <Reveal>
          <SectionHeading eyebrowLang="en" id={CONTROL_LAYER.id} eyebrow={CONTROL_LAYER.eyebrow} title={CONTROL_LAYER.title} lead={CONTROL_LAYER.lead} className="max-w-[720px]" />
        </Reveal>

        <Reveal as="figure" className="mt-10 md:mt-12 lg:mt-24" aria-labelledby="control-chain-caption">
          <figcaption id="control-chain-caption" className="sr-only">
            {CONTROL_LAYER.figureAlt}
          </figcaption>
          <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-0">
            {/* Desktop rail, connectors and return arc (decorative; the list carries the meaning). */}
            <div aria-hidden className="pointer-events-none absolute inset-x-[10%] top-2 hidden h-px bg-border lg:block" />
            {links.slice(0, -1).map((link, idx) => (
              <div
                key={link.code}
                aria-hidden
                className="m-draw-x pointer-events-none absolute top-[7px] hidden h-[1.5px] bg-electric-blue lg:block"
                style={{ left: `${10 + 20 * idx}%`, width: "20%", ...d(100 + 120 * idx) }}
              />
            ))}
            <svg aria-hidden viewBox="0 0 100 48" preserveAspectRatio="none" className="pointer-events-none absolute left-[10%] top-2 hidden h-12 w-[80%] -translate-y-full overflow-visible lg:block">
              <path
                d="M100,48 C100,0 0,0 0,48"
                fill="none"
                className="m-arc stroke-electric-blue"
                strokeWidth={1.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ ["--arc-length" as string]: ARC_LENGTH, ...d(620) }}
              />
            </svg>

            {links.map((link, idx) => {
              const last = idx === links.length - 1;
              return (
                <li key={link.code} className="group relative min-w-0 pl-10 lg:flex lg:flex-col lg:items-center lg:px-3 lg:text-center">
                  {/* Mobile rail + vertical connector, between this node and the next. */}
                  {!last ? (
                    <>
                      <span aria-hidden className="absolute top-5 -bottom-8 left-[7.5px] w-px bg-border lg:hidden" />
                      <span aria-hidden className="m-draw-y absolute top-5 -bottom-8 left-[7px] w-[1.5px] bg-electric-blue lg:hidden" style={d(100 + 120 * idx)} />
                    </>
                  ) : null}
                  <ControlDot
                    size={16}
                    filled={last}
                    className="m-node absolute top-0.5 left-0 bg-surface-base text-text-primary lg:static lg:mb-6"
                    fillClassName={last ? "m-node" : "transition-colors duration-(--duration-fast) group-hover:bg-electric-blue"}
                    style={d(120 * idx)}
                    fillStyle={last ? d(1200) : undefined}
                  />
                  <div className="m-rise" style={d(60 + 120 * idx)}>
                    <p lang="en" className="text-label uppercase tracking-[0.06em] text-text-secondary transition-colors duration-(--duration-fast) group-hover:text-text-primary">
                      {link.code}
                    </p>
                    <h3 className="mt-2 text-h3 text-text-primary">{link.title}</h3>
                    <p className="mt-2 text-body-sm text-text-secondary">{link.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>

        <Reveal className="mt-16">
          <p className="max-w-[40ch] text-pretty text-h2 font-display text-text-primary lg:text-[2rem] lg:leading-[1.2]">{CONTROL_LAYER.closing}</p>
          <p className="mt-4 text-body-sm text-text-secondary">{CONTROL_LAYER.support}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
