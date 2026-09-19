import { BrandSymbol } from "@/components/ui/brand-symbol";
import { FINAL } from "@/lib/marketing/copy";
import { CtaLink } from "./cta";
import { Container, Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

/**
 * Closing CTA (03-ux-spec §2.13): symbol, eyebrow, the three results, the Portuguese signature
 * in two lines, one primary button, microcopy and the login link. Dark beat; the footer follows
 * on the same Obsidian separated by a hairline.
 */
export function FinalCta() {
  return (
    <section id={FINAL.id} aria-labelledby={`${FINAL.id}-heading`} className="theme-dark scroll-mt-20 bg-surface-base py-16 text-text-primary md:py-24 lg:py-32">
      <Container>
        <Reveal className="mx-auto flex max-w-[800px] flex-col items-center text-center">
          <BrandSymbol size={40} label="Compliance OS" />
          <Eyebrow lang="en" className="mt-6">
            {FINAL.eyebrow}
          </Eyebrow>
          <p className="mt-6 text-body-lg text-text-secondary">
            {FINAL.results.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <h2 id={`${FINAL.id}-heading`} className="text-final mt-6 text-text-primary">
            <span className="block">{FINAL.title[0]}</span>
            <span className="block">{FINAL.title[1]}</span>
          </h2>
          <CtaLink href={FINAL.cta.href} variant="primary" size="lg" className="mt-10 w-full px-8 sm:w-auto">
            {FINAL.cta.label}
          </CtaLink>
          <p className="mt-4 text-label text-text-secondary">
            {FINAL.microcopy.map((item, idx) => (
              <span key={item} className="inline-block">
                {idx > 0 ? <span aria-hidden className="mx-2">·</span> : null}
                {item}
              </span>
            ))}
          </p>
          <p className="mt-6 text-body-sm text-text-secondary">
            {FINAL.loginPrompt}{" "}
            <CtaLink href={FINAL.login.href} variant="tertiary" size="sm" className="h-auto px-0">
              {FINAL.login.label}
            </CtaLink>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
