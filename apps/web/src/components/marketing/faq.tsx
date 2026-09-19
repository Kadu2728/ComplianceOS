import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { FAQ } from "@/lib/marketing/copy";
import { site } from "@/lib/marketing/site";
import { Container, Section, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

/**
 * FAQ on native <details>/<summary> (03-ux-spec §2.12): no JavaScript, keyboard-operable,
 * several may be open at once. The privacy-notice sentence in answer 7 renders only while the
 * interim notice is published (`site.legalReady`).
 */
export function Faq() {
  return (
    <Section id={FAQ.id} className="border-t border-border">
      <Container>
        <Reveal>
          <SectionHeading id={FAQ.id} eyebrow={FAQ.eyebrow} title={FAQ.title} lead={FAQ.lead} />
        </Reveal>
        <Reveal className="mt-10 max-w-[760px] md:mt-12">
          <div className="divide-y divide-border border-y border-border">
            {FAQ.items.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-start justify-between gap-4 py-4">
                  <h3 className="text-body font-medium text-text-primary">{item.q}</h3>
                  <ChevronDown aria-hidden size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-secondary transition-transform duration-(--duration-base) ease-(--ease-out) group-open:rotate-180" />
                </summary>
                <div className="max-w-[60ch] pb-5 text-body-sm text-text-secondary">
                  {item.a}
                  {"privacyLink" in item && item.privacyLink && site.legalReady ? (
                    <>
                      {" "}
                      {FAQ.privacyLink.prefix}{" "}
                      <Link href={FAQ.privacyLink.href} className="text-info-text underline decoration-1 underline-offset-2 hover:text-info-fill">
                        {FAQ.privacyLink.label}
                      </Link>
                      .
                    </>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
