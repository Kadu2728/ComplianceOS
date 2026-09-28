import { CONTROL_LAYER } from "@/lib/marketing/copy";
import { CtaLink } from "./cta";
import { LayersFigure } from "./layers-figure";
import { Container, Section, SectionIntro } from "./primitives";
import { Reveal } from "./reveal";

/** The Control Layer (landing-v2 §4.5): intro + outline CTA left, the layers diagram right. */
export function ControlLayer() {
  return (
    <Section id={CONTROL_LAYER.id}>
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-10 xl:gap-12">
        <Reveal>
          <SectionIntro id={CONTROL_LAYER.id} eyebrow={CONTROL_LAYER.eyebrow} eyebrowLang="en" title={CONTROL_LAYER.title} lead={CONTROL_LAYER.lead} size="m">
            <CtaLink href={CONTROL_LAYER.cta.href} variant="outline" size="md" arrow="forward">
              {CONTROL_LAYER.cta.label}
            </CtaLink>
          </SectionIntro>
        </Reveal>
        <LayersFigure />
      </Container>
    </Section>
  );
}
