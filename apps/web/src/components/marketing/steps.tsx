import { ArrowRight, ClipboardList, FileText, History, ListChecks, ListOrdered, type LucideIcon, ScanSearch } from "lucide-react";
import { HOW_IT_WORKS } from "@/lib/marketing/copy";
import { Container, IconTile, Section, SectionIntro } from "./primitives";
import { Reveal } from "./reveal";

const ICONS: Record<string, LucideIcon> = {
  clipboard: ClipboardList,
  scan: ScanSearch,
  order: ListOrdered,
  checks: ListChecks,
  file: FileText,
  history: History,
};

/**
 * Divider/padding per item (landing-v2 §4.6): 3 per row from 640, 6 in a row from 1280. An item
 * that starts a row has no left border or padding; one that ends a row has no right padding.
 */
function itemClass(i: number, count: number): string {
  const c: string[] = [];
  if (i % 3 !== 0) c.push("sm:border-l", "sm:pl-5");
  if (i % 3 !== 2) c.push("sm:pr-5");
  c.push(i === 0 ? "xl:border-l-0 xl:pl-0" : "xl:border-l xl:pl-5");
  c.push(i === count - 1 ? "xl:pr-0" : "xl:pr-5");
  return `relative sm:border-border ${c.join(" ")}`;
}

/**
 * Como funciona (landing-v2 §4.6): the core flow in six steps — a row of six from 1280, 3 × 2
 * from 640, a vertical timeline below. Arrow badges sit on the dividers; numbers are decorative.
 */
export function Steps() {
  const steps = HOW_IT_WORKS.steps;
  return (
    <Section id={HOW_IT_WORKS.id}>
      <Container>
        <Reveal className="max-w-[720px]">
          <SectionIntro id={HOW_IT_WORKS.id} eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} />
        </Reveal>
        <Reveal as="ol" className="mt-8 grid grid-cols-1 sm:mt-10 sm:grid-cols-3 sm:gap-y-10 xl:grid-cols-6">
          {steps.map((step, i) => {
            const Icon = ICONS[step.icon] ?? ClipboardList;
            const endOfRowSm = (i + 1) % 3 === 0;
            const last = i === steps.length - 1;
            return (
              <li key={step.title} className={`m-rise grid grid-cols-[40px_1fr] gap-x-4 pb-6 sm:block sm:pb-0 ${itemClass(i, steps.length)}`} style={{ ["--d" as string]: `${i * 60}ms` }}>
                <div className="relative">
                  <IconTile>
                    <Icon size={20} strokeWidth={1.5} />
                  </IconTile>
                  {/* Timeline connector below 640 */}
                  {!last ? <span aria-hidden className="m-draw-y absolute top-11 bottom-[-20px] left-5 w-px bg-border sm:hidden" style={{ ["--d" as string]: `${i * 60 + 120}ms` }} /> : null}
                </div>
                <div>
                  <span aria-hidden className="block text-label text-text-muted tabular-nums sm:mt-4">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 text-h3 text-text-primary">{step.title}</h3>
                  <p className="mt-2 text-body-sm text-text-secondary">{step.text}</p>
                </div>
                {!last ? (
                  <span
                    aria-hidden
                    className={`m-node absolute top-2 -right-3 z-[1] hidden size-6 items-center justify-center rounded-full bg-surface-base text-text-muted sm:flex ${
                      endOfRowSm ? "sm:hidden xl:flex" : ""
                    }`}
                    style={{ ["--d" as string]: `${i * 60 + 120}ms` }}
                  >
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </span>
                ) : null}
              </li>
            );
          })}
        </Reveal>
      </Container>
    </Section>
  );
}
