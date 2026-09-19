import type { CSSProperties } from "react";
import { TRUST } from "@/lib/marketing/copy";
import { Container, ControlDot, Section, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

const d = (ms: number): CSSProperties => ({ ["--d" as string]: `${ms}ms` });

/**
 * Segurança e confiança (03-ux-spec §2.10): three groups as hairline rows — title on the left,
 * items in two columns — with the empty control dot (no blue in this block, brand §12). No
 * icons, no seals, no shields (brand §20).
 */
export function TrustGrid() {
  return (
    <Section id={TRUST.id} tone="dark">
      <Container>
        <Reveal>
          <SectionHeading eyebrowLang="en" id={TRUST.id} eyebrow={TRUST.eyebrow} title={TRUST.title} lead={TRUST.lead} className="max-w-[720px]" />
        </Reveal>
        <div className="mt-10 flex flex-col md:mt-12 lg:mt-16">
          {TRUST.groups.map((group) => (
            <Reveal key={group.title} className="grid grid-cols-1 gap-6 border-t border-border py-8 lg:grid-cols-12 lg:gap-8 lg:py-10">
              <h3 className="text-h3 text-text-primary lg:col-span-3">{group.title}</h3>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 md:gap-y-6 lg:col-span-9">
                {group.items.map((item, idx) => (
                  <li key={item.lead} className="m-rise" style={d(60 * Math.min(idx, 7))}>
                    <p className="flex items-start gap-2 text-body font-medium text-text-primary">
                      <ControlDot className="mt-1.5" />
                      <span>{item.lead}</span>
                    </p>
                    <p className="mt-1 pl-5 text-body-sm text-text-secondary">{item.text}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
