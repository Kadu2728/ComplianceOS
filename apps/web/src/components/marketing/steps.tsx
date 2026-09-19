import type { CSSProperties } from "react";
import { HOW_IT_WORKS } from "@/lib/marketing/copy";
import { Container, Section, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

const d = (ms: number): CSSProperties => ({ ["--d" as string]: `${ms}ms` });

/**
 * How it works as a vertical ledger (03-ux-spec §2.6): sticky heading on the left (≥ lg), six
 * steps on a rail whose blue segment grows as each step enters (PROGRESS). Destination of the
 * hero's secondary CTA (`#como-funciona`).
 */
export function Steps() {
  const steps = HOW_IT_WORKS.steps;
  return (
    <Section id={HOW_IT_WORKS.id} tone="dark">
      <Container className="lg:grid lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
          <SectionHeading eyebrowLang="en" id={HOW_IT_WORKS.id} eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} lead={HOW_IT_WORKS.lead} />
        </Reveal>
        <ol className="mt-10 md:mt-12 lg:col-span-7 lg:mt-0">
          {steps.map((step, idx) => {
            const last = idx === steps.length - 1;
            return (
              <Reveal as="li" key={step.number} className={`relative grid grid-cols-[40px_1fr] gap-x-4 lg:grid-cols-[56px_1fr] lg:gap-x-6 ${last ? "" : "pb-10"}`}>
                <div className="relative">
                  <span aria-hidden className="m-dot absolute top-1 left-0 flex size-4 items-center justify-center rounded-full border-[1.5px] border-text-primary bg-surface-base">
                    <span className="m-dot-fill size-1.5 rounded-full" />
                  </span>
                  <span className="absolute top-1 left-6 text-label tabular-nums text-text-secondary lg:left-7">{step.number}</span>
                  {!last ? (
                    <>
                      <span aria-hidden className="absolute top-6 bottom-0 left-[7.5px] w-px bg-border" />
                      <span aria-hidden className="m-draw-y absolute top-6 bottom-0 left-[7px] w-[1.5px] bg-electric-blue" style={d(100)} />
                    </>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h3 className="text-h3 text-text-primary">{step.title}</h3>
                  <p className="mt-2 max-w-[60ch] text-pretty text-body-sm text-text-secondary">{step.text}</p>
                  {"note" in step ? <p className="mt-2 max-w-[60ch] text-caption text-text-secondary">{step.note}</p> : null}
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}
