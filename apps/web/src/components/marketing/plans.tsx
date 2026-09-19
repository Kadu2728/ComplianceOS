import { PLANS } from "@/lib/marketing/copy";
import { contactMailto } from "@/lib/marketing/site";
import { CtaLink } from "./cta";
import { Container, ControlDot, Section, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

/**
 * Planos without prices (03-ux-spec §2.11, brief §6): "Beta aberto" with what is included and
 * what is still off, and the human exit for larger companies. The contact button renders only
 * when a mailbox exists in `site.ts` — never a dead link.
 */
export function Plans() {
  const mailto = contactMailto(PLANS.contact.mailSubject);
  return (
    <Section id={PLANS.id}>
      <Container>
        <Reveal>
          <SectionHeading eyebrowLang="en" id={PLANS.id} eyebrow={PLANS.eyebrow} title={PLANS.title} lead={PLANS.lead} className="max-w-[720px]" />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-6 md:mt-12 lg:mt-16 lg:grid-cols-12 lg:items-start">
          <Reveal as="article" className="rounded-lg border border-border bg-surface-elevated p-6 md:p-8 lg:col-span-7">
            <h3 className="text-label uppercase tracking-[0.06em] text-text-secondary">{PLANS.open.eyebrow}</h3>
            <p className="mt-2 text-h2 text-text-primary">{PLANS.open.title}</p>
            <p className="mt-6 text-label uppercase tracking-[0.06em] text-text-secondary">{PLANS.open.includedLabel}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {PLANS.open.included.map((item) => (
                <li key={item} className="flex items-start gap-2 text-body-sm text-text-primary">
                  <ControlDot filled className="mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-label uppercase tracking-[0.06em] text-text-secondary">{PLANS.open.unavailableLabel}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {PLANS.open.unavailable.map((item) => (
                <li key={item} className="flex items-start gap-2 text-body-sm text-text-secondary">
                  <ControlDot className="mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-body-sm font-medium text-text-primary">{PLANS.open.microcopy}</p>
            <div className="mt-6">
              <CtaLink href={PLANS.open.cta.href} variant="primary" size="md" className="w-full sm:w-auto">
                {PLANS.open.cta.label}
              </CtaLink>
            </div>
          </Reveal>

          <Reveal as="article" delay={80} className="rounded-lg border border-border bg-surface-base p-6 md:p-8 lg:col-span-5">
            <h3 className="text-h3 text-text-primary">{PLANS.contact.title}</h3>
            <p className="mt-3 text-body-sm text-text-secondary">{PLANS.contact.text}</p>
            {mailto ? (
              <div className="mt-5">
                <CtaLink href={mailto} variant="tertiary" size="sm" className="px-0">
                  {PLANS.contact.ctaLabel}
                </CtaLink>
              </div>
            ) : null}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
