import { BrandSymbol } from "@/components/ui/brand-symbol";
import { FINAL } from "@/lib/marketing/copy";
import { contactMailto } from "@/lib/marketing/site";
import { CtaLink } from "./cta";
import { Container, Section } from "./primitives";
import { Reveal } from "./reveal";

/**
 * Final CTA card (landing-v2 §4.11): lockup · divider · text · buttons in one card with a faint
 * cyan wash. The lockup is decorative (the h2 follows). Without a mailbox the secondary button
 * becomes "Entrar".
 */
export function FinalCta() {
  const mailto = contactMailto(FINAL.contact.mailSubject);
  return (
    <Section id={FINAL.id}>
      <Container>
        <Reveal className="m-wash grid grid-cols-1 gap-5 rounded-xl border border-border-strong bg-surface-elevated p-6 md:grid-cols-[auto_1px_minmax(0,1fr)] md:items-center md:gap-x-8 md:p-8 lg:px-10 xl:grid-cols-[auto_1px_minmax(0,1fr)_auto]">
          <span aria-hidden className="flex items-center gap-3 text-text-primary">
            <span className="text-primary-text">
              <BrandSymbol size={32} className="md:hidden" />
              <BrandSymbol size={40} className="hidden md:inline-block" />
            </span>
            <span className="text-[18px] font-semibold tracking-[-0.012em] whitespace-nowrap md:text-[20px]">Compliance OS</span>
          </span>
          <span aria-hidden className="hidden self-stretch bg-border-strong md:block" />
          <div className="min-w-0">
            <h2 id={`${FINAL.id}-heading`} className="text-h1-compact text-text-primary xl:text-h1">
              {FINAL.title}
            </h2>
            <p className="mt-2 text-body text-text-secondary">{FINAL.text}</p>
            <p className="mt-2 text-caption text-text-muted">{FINAL.microcopy}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:hidden">
              <Buttons mailto={mailto} />
            </div>
          </div>
          <div className="hidden gap-3 xl:flex">
            <Buttons mailto={mailto} />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function Buttons({ mailto }: { mailto: string | null }) {
  return (
    <>
      <CtaLink href={FINAL.cta.href} variant="primary" size="md" arrow="forward">
        {FINAL.cta.label}
      </CtaLink>
      {mailto ? (
        <CtaLink href={mailto} variant="outline" size="md">
          {FINAL.contact.label}
        </CtaLink>
      ) : (
        <CtaLink href={FINAL.login.href} variant="outline" size="md">
          {FINAL.login.label}
        </CtaLink>
      )}
    </>
  );
}
