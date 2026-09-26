import { PLANS } from "@/lib/marketing/copy";
import { contactMailto } from "@/lib/marketing/site";
import { CtaLink } from "./cta";
import { Container, ControlDot, Section, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

/**
 * Planos (decision D38, 08-plans.md): a trial band (30 days of Ultimate, no card), three priced
 * tiers per organization, footnotes with what is still off, and the human exit for larger
 * companies. Each tier's primary CTA goes to its Kiwify checkout, which charges on the day of
 * purchase; the free month is the link under it (account first, `?plano=` records the intent
 * until a plan entity exists). Prices and checkout URLs live in `copy.ts` and are mirrored by the
 * JSON-LD offers. The contact button renders only when a mailbox exists.
 */
export function Plans() {
  const mailto = contactMailto(PLANS.contact.mailSubject);
  return (
    <Section id={PLANS.id}>
      <Container>
        <Reveal>
          <SectionHeading eyebrowLang="en" id={PLANS.id} eyebrow={PLANS.eyebrow} title={PLANS.title} lead={PLANS.lead} className="max-w-[760px]" />
        </Reveal>

        <Reveal as="div" className="mt-10 rounded-lg border border-electric-blue/40 bg-info-tint/40 p-6 md:mt-12 md:p-8 lg:mt-16">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[640px]">
              <p className="text-label uppercase tracking-[0.06em] text-text-secondary">{PLANS.trial.eyebrow}</p>
              <p className="mt-2 text-h2 text-text-primary">{PLANS.trial.title}</p>
              <p className="mt-3 text-body-sm text-text-secondary">{PLANS.trial.text}</p>
            </div>
            <CtaLink href={PLANS.trial.cta.href} variant="primary" size="md" className="w-full sm:w-auto lg:shrink-0">
              {PLANS.trial.cta.label}
            </CtaLink>
          </div>
        </Reveal>

        <ul className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch" aria-label="Planos">
          {PLANS.tiers.map((tier, i) => (
            <Reveal
              key={tier.slug}
              as="li"
              delay={i * 80}
              className={`flex flex-col rounded-lg border p-6 md:p-8 ${
                tier.recommended ? "border-text-primary bg-surface-elevated" : "border-border bg-surface-elevated"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-h3 text-text-primary">{tier.name}</h3>
                {tier.recommended ? (
                  <span className="rounded-pill border border-text-primary px-2.5 py-1 text-caption font-medium text-text-primary">
                    {PLANS.recommendedLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 flex items-baseline gap-1 text-text-primary">
                <span className="text-body-sm font-medium">{PLANS.currency}</span>
                <span className="text-score font-display tabular-nums">{tier.price}</span>
                <span className="text-body-sm text-text-secondary">{PLANS.period}</span>
              </p>
              <p className="text-caption text-text-secondary">{PLANS.unit}</p>
              <p className="mt-4 text-body-sm text-text-secondary">{tier.audience}</p>

              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Limites">
                {tier.limits.map((limit) => (
                  <li key={limit} className="rounded-pill border border-border px-2.5 py-1 text-caption text-text-secondary">
                    {limit}
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-label uppercase tracking-[0.06em] text-text-secondary">
                {"includedLabel" in tier ? tier.includedLabel : "Inclui"}
              </p>
              <ul className="mt-3 flex flex-1 flex-col gap-2.5">
                {tier.included.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-body-sm text-text-primary">
                    <ControlDot filled className="mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col items-center gap-3">
                <CtaLink
                  href={tier.checkoutUrl}
                  variant={tier.recommended ? "primary" : "secondary"}
                  size="md"
                  className="w-full"
                >
                  {PLANS.subscribeLabel} {tier.name}
                </CtaLink>
                <CtaLink href={`/criar-conta?plano=${tier.slug}`} variant="tertiary" size="sm" className="px-0">
                  {PLANS.trialLinkLabel}
                </CtaLink>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal as="div" className="mt-6 flex flex-col gap-2">
          {PLANS.footnotes.map((note) => (
            <p key={note} className="text-body-sm text-text-secondary">
              {note}
            </p>
          ))}
        </Reveal>

        <Reveal as="article" delay={80} className="mt-10 rounded-lg border border-border bg-surface-base p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[640px]">
              <h3 className="text-h3 text-text-primary">{PLANS.contact.title}</h3>
              <p className="mt-2 text-body-sm text-text-secondary">{PLANS.contact.text}</p>
            </div>
            {mailto ? (
              <CtaLink href={mailto} variant="tertiary" size="sm" className="px-0 md:shrink-0">
                {PLANS.contact.ctaLabel}
              </CtaLink>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
