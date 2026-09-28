import { Plus } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { FAQ } from "@/lib/marketing/copy";
import { site } from "@/lib/marketing/site";
import { Container, Section, SectionIntro } from "./primitives";
import { Reveal } from "./reveal";

const LINK = "text-primary-text underline decoration-1 underline-offset-2 hover:text-primary-text-hover";
const TOKEN = "{contactEmail}";

type Item = (typeof FAQ.items)[number];

/** `{contactEmail}` becomes a mailto link; without a mailbox the sentence keeps the plain word. */
function withEmail(text: string): ReactNode {
  if (!text.includes(TOKEN)) return text;
  const parts = text.split(TOKEN);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? (
        site.contactEmail ? (
          <a href={`mailto:${site.contactEmail}`} className={LINK}>
            {site.contactEmail}
          </a>
        ) : (
          "o e-mail de contato"
        )
      ) : null}
    </Fragment>
  ));
}

function Answer({ item }: { item: Item }) {
  return (
    <div className="px-4 pb-4 text-body-sm leading-relaxed text-text-secondary">
      {withEmail(item.a)}
      {"link" in item && item.link && site.legalReady ? (
        <>
          {" "}
          {item.link.prefix}{" "}
          <Link href={item.link.href} className={LINK}>
            {item.link.label}
          </Link>
          {"suffix" in item.link ? item.link.suffix : "."}
        </>
      ) : null}
      {"privacyLink" in item && item.privacyLink && site.legalReady ? (
        <>
          {" "}
          {FAQ.privacyLink.prefix}{" "}
          <Link href={FAQ.privacyLink.href} className={LINK}>
            {FAQ.privacyLink.label}
          </Link>
          .
        </>
      ) : null}
    </div>
  );
}

/** Column-major split so DOM order = reading order: 14 questions → 5 / 5 / 4 (landing-v2 §4.10). */
function columns<T>(items: readonly T[], count: number): T[][] {
  const size = Math.ceil(items.length / count);
  return Array.from({ length: count }, (_, i) => items.slice(i * size, (i + 1) * size)).filter((c) => c.length > 0);
}

/**
 * FAQ v2 on native <details>/<summary>: no JavaScript, keyboard-operable, several open at once.
 * Intro left, three column boxes right (≥ 1280); every question visible, no second disclosure.
 */
export function Faq() {
  return (
    <Section id={FAQ.id}>
      <Container className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] xl:items-start xl:gap-8">
        <Reveal className="max-w-[720px]">
          <SectionIntro id={FAQ.id} eyebrow={FAQ.eyebrow} title={FAQ.title} lead={FAQ.lead} />
        </Reveal>
        <div>
          <Reveal className="grid grid-cols-1 items-start gap-3 lg:grid-cols-3 lg:gap-4">
            {columns(FAQ.items, 3).map((column, c) => (
              <div key={c} className="m-rise overflow-hidden rounded-lg border border-border bg-surface-elevated" style={{ ["--d" as string]: `${c * 60}ms` }}>
                {column.map((item, i) => (
                  <details key={item.q} className={`group ${i > 0 ? "border-t border-border" : ""}`}>
                    <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-3 p-4 transition-colors duration-(--duration-fast) hover:bg-surface-hover focus-visible:outline-offset-[-2px]">
                      <h3 className="text-body font-medium text-text-primary lg:text-body-sm">{item.q}</h3>
                      <Plus
                        aria-hidden
                        size={16}
                        strokeWidth={1.5}
                        className="mt-0.5 shrink-0 text-text-secondary transition-transform duration-(--duration-base) ease-(--ease-out) group-open:rotate-45 group-open:text-primary-text"
                      />
                    </summary>
                    <Answer item={item} />
                  </details>
                ))}
              </div>
            ))}
          </Reveal>
          {site.contactEmail ? <p className="mt-6 text-body-sm text-text-secondary">{withEmail(FAQ.more)}</p> : null}
        </div>
      </Container>
    </Section>
  );
}
