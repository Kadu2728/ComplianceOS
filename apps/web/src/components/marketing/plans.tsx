import { CalendarCheck } from "lucide-react";
import { PLANS } from "@/lib/marketing/copy";
import { contactMailto } from "@/lib/marketing/site";
import { CtaLink } from "./cta";
import { Container, ControlDot, Eyebrow, IconTile, Section, SectionIntro } from "./primitives";
import { Reveal } from "./reveal";

const TAG = "inline-flex h-6 items-center rounded-pill border border-border-strong px-2.5 text-caption font-medium text-text-secondary";

/**
 * Planos (decision D38, landing-v2 §4.9): the free-month band — the section's only filled button —
 * three priced tiers per organization whose buttons go to their Kiwify checkouts (charged on
 * purchase, so the free month is the link under each), the footnotes with what is still off, and
 * the human exit for larger companies. Prices and checkout URLs live in `copy.ts` and are mirrored
 * by the JSON-LD offers. The contact link renders only when a mailbox exists.
 */
export function Plans() {
  const mailto = contactMailto(PLANS.contact.mailSubject);
  return (
    <Section id={PLANS.id}>
      <Container>
        <Reveal className="max-w-[720px]">
          <SectionIntro id={PLANS.id} eyebrow={PLANS.eyebrow} title={PLANS.title} lead={PLANS.lead} />
        </Reveal>

        <Reveal className="m-wash mt-10 flex flex-col gap-5 rounded-lg border border-info-border bg-surface-elevated p-5 md:p-6 lg:flex-row lg:items-center lg:gap-8 lg:p-8">
          <IconTile>
            <CalendarCheck size={20} strokeWidth={1.5} />
          </IconTile>
          <div className="min-w-0 flex-1">
            <Eyebrow>{PLANS.trial.eyebrow}</Eyebrow>
            <p className="mt-1 text-h2 text-text-primary">{PLANS.trial.title}</p>
            <p className="mt-2 max-w-[64ch] text-body-sm text-text-secondary">{PLANS.trial.text}</p>
          </div>
          <CtaLink href={PLANS.trial.cta.href} variant="primary" size="md" arrow="forward" className="w-full shrink-0 sm:w-auto">
            {PLANS.trial.cta.label}
          </CtaLink>
        </Reveal>

        <Reveal as="ul" aria-label="Planos" className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {PLANS.tiers.map((tier, i) => (
            <li
              key={tier.slug}
              className={`m-rise flex flex-col rounded-lg border bg-surface-elevated p-6 xl:p-8 ${tier.recommended ? "border-primary-text" : "border-border"}`}
              style={{ ["--d" as string]: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-h2 text-text-primary">{tier.name}</h3>
                {tier.recommended ? (
                  <span className="inline-flex h-6 items-center rounded-pill bg-primary-tint px-2.5 text-caption font-medium text-primary-text">{PLANS.recommendedLabel}</span>
                ) : null}
              </div>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-body-sm font-medium text-text-secondary">{PLANS.currency}</span>
                <span className="text-score-compact text-text-primary tabular-nums">{tier.price}</span>
                <span className="text-body-sm text-text-secondary">{PLANS.period}</span>
              </p>
              <p className="text-caption text-text-muted">{PLANS.unit}</p>
              <p className="mt-4 text-body-sm text-text-secondary">{tier.audience}</p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Limites">
                {tier.limits.map((limit) => (
                  <li key={limit} className={TAG}>
                    {limit}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-1 flex-col border-t border-border pt-6">
                <p className="text-label uppercase tracking-[0.08em] text-text-muted">{"includedLabel" in tier ? tier.includedLabel : "Inclui"}</p>
                <ul className="mt-3 flex flex-1 flex-col gap-2.5">
                  {tier.included.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-body-sm text-text-primary">
                      <ControlDot className="mt-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 flex flex-col items-center gap-3">
                <CtaLink href={tier.checkoutUrl} variant="outline" size="md" arrow="external" className="w-full">
                  {PLANS.subscribeLabel} {tier.name}
                </CtaLink>
                <CtaLink href={`/criar-conta?plano=${tier.slug}`} variant="tertiary" size="sm" className="min-h-11 text-body-sm">
                  {PLANS.trialLinkLabel}
                </CtaLink>
              </div>
            </li>
          ))}
        </Reveal>

        <Reveal className="mt-6 flex max-w-[80ch] flex-col gap-2">
          {PLANS.footnotes.map((note) => (
            <p key={note} className="text-body-sm text-text-secondary">
              {note}
            </p>
          ))}
        </Reveal>

        <Reveal className="mt-10 flex flex-col gap-4 rounded-lg border border-border p-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[640px]">
            <h3 className="text-h3 text-text-primary">{PLANS.contact.title}</h3>
            <p className="mt-2 text-body-sm text-text-secondary">{PLANS.contact.text}</p>
          </div>
          {mailto ? (
            <CtaLink href={mailto} variant="tertiary" size="sm" className="min-h-11 shrink-0 self-start text-body-sm md:self-auto">
              {PLANS.contact.ctaLabel}
            </CtaLink>
          ) : null}
        </Reveal>
      </Container>
    </Section>
  );
}
