import { DoorOpen, FileText, Layers, ListChecks, type LucideIcon, MessageSquareText, Radar } from "lucide-react";
import { getImageProps } from "next/image";
import heroPhone from "@/assets/marketing/hero-phone.webp";
import { PRODUCT } from "@/lib/marketing/copy";
import { CtaLink } from "./cta";
import { Container, IconTile, Section, SectionIntro } from "./primitives";
import { Reveal } from "./reveal";

/** The app's own module icons (visual-v2 §4.5-4). */
const ICONS: Record<string, LucideIcon> = {
  brain: MessageSquareText,
  graph: Layers,
  radar: Radar,
  plan: ListChecks,
  vault: FileText,
  room: DoorOpen,
};

/**
 * Produto (landing-v2 §4.7): intro · six static module cards · a crop of the real phone capture
 * with a floating chip (≥ 1024 only — below that the hero already shows the same screen).
 * Cards are not links: the landing has no module pages, so no false affordance.
 */
export function Product() {
  const preview = getImageProps({ src: heroPhone, alt: PRODUCT.previewAlt, sizes: "(min-width: 1280px) 268px, 372px", quality: 80 }).props;
  return (
    <Section id={PRODUCT.id}>
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-6 xl:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_minmax(0,3fr)] xl:items-start xl:gap-8">
        <Reveal className="lg:col-span-2 xl:col-span-1">
          <SectionIntro id={PRODUCT.id} eyebrow={PRODUCT.eyebrow} title={PRODUCT.title} lead={PRODUCT.lead}>
            <CtaLink href={PRODUCT.cta.href} variant="outline" size="md" arrow="forward">
              {PRODUCT.cta.label}
            </CtaLink>
          </SectionIntro>
        </Reveal>
        <Reveal as="ul" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-2">
          {PRODUCT.modules.map((m, i) => {
            const Icon = ICONS[m.icon] ?? Layers;
            return (
              <li
                key={m.name}
                className="m-rise flex gap-4 rounded-lg border border-border bg-surface-elevated p-4 sm:flex-col sm:gap-3 sm:p-5"
                style={{ ["--d" as string]: `${i * 60}ms` }}
              >
                <IconTile>
                  <Icon size={20} strokeWidth={1.5} />
                </IconTile>
                <div>
                  <h3 lang="en" className="text-h3 text-text-primary">
                    {m.name}
                  </h3>
                  {"tag" in m ? (
                    <span className="mt-2 inline-flex h-6 items-center rounded-pill border border-border-strong px-2.5 text-caption font-medium text-text-secondary">
                      {m.tag}
                    </span>
                  ) : null}
                  <p className="mt-1 text-body-sm text-text-secondary sm:mt-2">{m.text}</p>
                </div>
              </li>
            );
          })}
        </Reveal>
        <Reveal as="figure" className="relative hidden lg:block">
          <div className="aspect-[390/652] overflow-hidden rounded-lg border border-border-strong bg-surface-elevated">
            {/* eslint-disable-next-line @next/next/no-img-element -- getImageProps keeps the optimizer without client JS */}
            <img {...preview} alt={preview.alt} loading="lazy" className="block w-full object-cover object-top" />
          </div>
          {/* The chip is the caption: it carries the demo-data disclosure (§4.7.3). */}
          <figcaption className="absolute right-3 bottom-10 flex h-8 items-center gap-2 rounded-pill border border-border-strong bg-surface-elevated px-3 text-caption font-medium whitespace-nowrap text-text-primary shadow-popover xl:-right-4">
            <span aria-hidden className="size-2 rounded-full bg-primary-text" />
            {PRODUCT.chip}
          </figcaption>
        </Reveal>
      </Container>
    </Section>
  );
}
