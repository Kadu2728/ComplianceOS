import { ListChecks, type LucideIcon, MessageSquareText, Radar, TrendingUp } from "lucide-react";
import { AUTOMATION } from "@/lib/marketing/copy";
import { CtaLink } from "./cta";
import { Container, IconTile, Section, SectionIntro } from "./primitives";
import { Reveal } from "./reveal";

const ICONS: Record<string, LucideIcon> = { brain: MessageSquareText, radar: Radar, checks: ListChecks, trend: TrendingUp };

/**
 * "Menos trabalho manual" (landing-v2 §4.8) — the reference's "IA + Automação" slot with honest
 * copy (owner decision 2, 2026-09-27): only deterministic work that exists; no AI symbol, no
 * sparkles (brand §63). Intro left, four rows right, then the rules footnote.
 */
export function AiAutomation() {
  return (
    <Section id={AUTOMATION.id}>
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-10 xl:gap-12">
        <Reveal>
          <SectionIntro id={AUTOMATION.id} eyebrow={AUTOMATION.eyebrow} eyebrowLang="en" title={AUTOMATION.title} lead={AUTOMATION.lead}>
            <CtaLink href={AUTOMATION.cta.href} variant="outline" size="md" arrow="forward">
              {AUTOMATION.cta.label}
            </CtaLink>
          </SectionIntro>
        </Reveal>
        <Reveal>
          <ul className="flex flex-col">
            {AUTOMATION.items.map((item, i) => {
              const Icon = ICONS[item.icon] ?? ListChecks;
              return (
                <li
                  key={item.title}
                  className="m-rise grid grid-cols-[40px_1fr] gap-4 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0"
                  style={{ ["--d" as string]: `${i * 60}ms` }}
                >
                  <IconTile>
                    <Icon size={20} strokeWidth={1.5} />
                  </IconTile>
                  <div>
                    <h3 className="text-h3 text-text-primary">{item.title}</h3>
                    <p className="mt-1 text-body-sm text-text-secondary">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-caption text-text-muted">{AUTOMATION.footnote}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
