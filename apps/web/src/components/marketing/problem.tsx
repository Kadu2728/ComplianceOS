import { Clock, FolderOpen, Inbox, type LucideIcon } from "lucide-react";
import { PROBLEM } from "@/lib/marketing/copy";
import { Container, IconTile, Section, SectionIntro } from "./primitives";
import { Reveal } from "./reveal";

const ICONS: Record<string, LucideIcon> = { clock: Clock, folder: FolderOpen, inbox: Inbox };

/**
 * O problema (landing-v2 §4.4): intro left, three static cards right (5 : 7 at ≥ 1280). Operational
 * pain, never fear (brand §62). Below 640 the cards become rows.
 */
export function Problem() {
  return (
    <Section id={PROBLEM.id}>
      <Container className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:items-center xl:gap-12">
        <Reveal>
          <SectionIntro id={PROBLEM.id} eyebrow={PROBLEM.eyebrow} title={PROBLEM.title} lead={PROBLEM.lead} />
        </Reveal>
        <Reveal as="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {PROBLEM.cards.map((card, i) => {
            const Icon = ICONS[card.icon] ?? Clock;
            return (
              <li
                key={card.title}
                className="m-rise flex gap-4 rounded-lg border border-border bg-surface-elevated p-4 sm:flex-col sm:gap-0 sm:p-6"
                style={{ ["--d" as string]: `${i * 60}ms` }}
              >
                <IconTile>
                  <Icon size={20} strokeWidth={1.5} />
                </IconTile>
                <div>
                  <h3 className="text-h3 text-text-primary sm:mt-4">{card.title}</h3>
                  <p className="mt-2 text-body-sm text-text-secondary">{card.text}</p>
                </div>
              </li>
            );
          })}
        </Reveal>
      </Container>
    </Section>
  );
}
