import { PRODUCT } from "@/lib/marketing/copy";
import { Container, ControlDot, Section, SectionHeading } from "./primitives";
import { ProductFigure } from "./product-figure";
import { Reveal } from "./reveal";
import { StoryFigure } from "./story-figures";

/**
 * Product storytelling (03-ux-spec §2.7): five stories, text 5 / figure 7 alternating sides at
 * ≥ xl, stacked below. The Problema / Valor / Ação labels are not printed — typography carries
 * the structure; the "Ação" line gets the blue control dot (next step, brand §12).
 */
export function FeatureStories({ now }: { now: Date }) {
  return (
    <Section id={PRODUCT.id}>
      <Container>
        <Reveal>
          <SectionHeading eyebrowLang="en" id={PRODUCT.id} eyebrow={PRODUCT.eyebrow} title={PRODUCT.title} lead={PRODUCT.lead} className="max-w-[720px]" />
        </Reveal>
        <div className="mt-10 flex flex-col gap-16 md:mt-12 md:gap-24 lg:mt-16 lg:gap-32">
          {PRODUCT.stories.map((story, idx) => {
            const flip = idx % 2 === 1;
            return (
              <article key={story.key} className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-12 xl:items-start xl:gap-12">
                <Reveal className={`max-w-[640px] xl:col-span-5 ${flip ? "xl:order-2" : ""}`}>
                  <h3 className="text-h2 tracking-[-0.02em] text-text-primary lg:text-[1.75rem] lg:leading-[1.25]">{story.title}</h3>
                  <p className="mt-2 text-label uppercase tracking-[0.06em] text-text-secondary">{story.modules}</p>
                  <p className="mt-6 text-pretty text-body text-text-secondary">{story.problem}</p>
                  <p className="mt-4 text-pretty text-body text-text-primary">{story.value}</p>
                  <p className="mt-6 flex items-start gap-2 text-body-sm font-medium text-text-primary">
                    <ControlDot filled className="mt-1" />
                    <span>{story.action}</span>
                  </p>
                </Reveal>
                <Reveal delay={80} className={`min-w-0 xl:col-span-7 ${flip ? "xl:order-1" : ""}`}>
                  <ProductFigure id={`story-${story.key}`} alt={story.alt}>
                    <StoryFigure story={story.key} now={now} />
                  </ProductFigure>
                </Reveal>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
