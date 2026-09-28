import { CalendarCheck, ClipboardList, CreditCard, type LucideIcon } from "lucide-react";
import { getImageProps } from "next/image";
import { preload } from "react-dom";
import heroDesktop from "@/assets/marketing/hero-desktop.webp";
import heroPhone from "@/assets/marketing/hero-phone.webp";
import { HERO } from "@/lib/marketing/copy";
import { CtaLink } from "./cta";
import { LaptopFrame, PhoneFrame } from "./device-frames";
import { Container, Eyebrow } from "./primitives";

export const HERO_SENTINEL_ID = "hero-fim";

const FACT_ICONS: LucideIcon[] = [CalendarCheck, CreditCard, ClipboardList];

/*
 * Screenshots of the live app (dark theme, fictitious demo organization "Acme Tecnologia Ltda."),
 * captured 2026-09-27 at 1440×900 and 390×844 (landing-v2 §8.3). Re-capture when the dashboard
 * changes visibly: a landing showing an older UI than the product breaks trust.
 */
const DESKTOP_SIZES = "(min-width: 1280px) 490px, (min-width: 768px) 574px, calc(82vw - 38px)";
const PHONE_SIZES = "(min-width: 1280px) 114px, (min-width: 768px) 134px, calc(26vw - 16px)";

/**
 * Hero v2 (landing-v2 §4.3): text column and the real dashboard in a laptop + phone. Server
 * component; `getImageProps` keeps the image optimizer with no client JavaScript, and the desktop
 * capture is preloaded with high priority (LCP). Text and laptop are static; only the phone and
 * the callout layer in (CSS keyframes, off with reduced motion).
 */
export function Hero() {
  const desktop = getImageProps({ src: heroDesktop, alt: HERO.desktopAlt, sizes: DESKTOP_SIZES, priority: true, quality: 80 }).props;
  const phone = getImageProps({ src: heroPhone, alt: HERO.phoneAlt, sizes: PHONE_SIZES, quality: 80 }).props;
  preload(desktop.src, { as: "image", imageSrcSet: desktop.srcSet, imageSizes: desktop.sizes, fetchPriority: "high" });

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative pt-8 pb-12 md:pt-12 md:pb-16 xl:pt-16 xl:pb-20">
      <Container className="grid grid-cols-1 items-center xl:grid-cols-[520px_minmax(0,1fr)] xl:gap-12">
        <div className="md:mx-auto md:max-w-[720px] md:text-center xl:mx-0 xl:max-w-none xl:text-left">
          <Eyebrow>{HERO.eyebrow}</Eyebrow>
          <h1 id="hero-heading" className="mt-3 text-hero text-text-primary">
            <span className="block text-balance">{HERO.title[0]}</span>
            <span className="block text-balance text-primary-text">{HERO.title[1]}</span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-pretty text-body-lg text-text-secondary md:mx-auto xl:mx-0">{HERO.lead}</p>
          <p className="mt-4 max-w-[52ch] text-pretty text-body-sm text-text-muted md:mx-auto xl:mx-0">{HERO.audience}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:justify-center xl:justify-start">
            <CtaLink href={HERO.primary.href} variant="primary" size="lg" arrow="forward">
              {HERO.primary.label}
            </CtaLink>
            <CtaLink href={HERO.secondary.href} variant="outline" size="lg">
              {HERO.secondary.label}
            </CtaLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 md:justify-center xl:justify-start">
            {HERO.facts.map((fact, i) => {
              const Icon = FACT_ICONS[i] ?? CalendarCheck;
              return (
                <li key={fact} className="flex items-center gap-2 text-body-sm text-text-secondary">
                  <Icon aria-hidden size={16} strokeWidth={1.5} className="text-text-muted" />
                  {fact}
                </li>
              );
            })}
          </ul>
        </div>

        <figure className="relative mx-auto mt-10 w-full md:mt-12 md:max-w-[720px] xl:mt-0 xl:mr-[-48px] xl:max-w-none">
          <div className="relative md:pt-[72px]">
            <div aria-hidden className="m-glow pointer-events-none absolute inset-0 z-0" />
            <LaptopFrame>
              {/* eslint-disable-next-line @next/next/no-img-element -- getImageProps keeps the optimizer without client JS */}
              <img {...desktop} alt={desktop.alt} fetchPriority="high" loading="eager" className="block size-full object-cover object-top" />
            </LaptopFrame>
            <PhoneFrame
              className="hero-phone"
              overlay={
                <div className="hero-callout hidden md:block">
                  <span aria-hidden className="absolute bottom-full left-1/2 h-16 w-px bg-info-border" />
                  <span aria-hidden className="absolute -top-1 left-1/2 size-[7px] -translate-x-1/2 rounded-full border-[1.5px] border-primary-text bg-surface-base" />
                  <p className="absolute right-0 bottom-[calc(100%+64px)] z-[3] w-[168px] rounded-lg border border-border-strong bg-surface-elevated px-4 py-3 text-body-sm font-medium text-text-primary">
                    {HERO.callout.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- getImageProps keeps the optimizer without client JS */}
              <img {...phone} alt={phone.alt} className="block size-full object-cover object-top" />
            </PhoneFrame>
          </div>
          <figcaption className="mt-4 text-caption text-text-muted md:text-center xl:text-left">{HERO.caption}</figcaption>
        </figure>
      </Container>
      <div id={HERO_SENTINEL_ID} aria-hidden className="absolute bottom-0 h-px w-px" />
    </section>
  );
}
