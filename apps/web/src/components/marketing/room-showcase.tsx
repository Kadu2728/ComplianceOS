import { RoomView } from "@/components/room/room-view";
import { Lockup } from "@/components/ui/brand-symbol";
import { ROOM } from "@/lib/marketing/copy";
import { demoRoom } from "@/lib/marketing/fixtures";
import { Container, Section, SectionHeading } from "./primitives";
import { ProductFigure } from "./product-figure";
import { Reveal } from "./reveal";

/**
 * Sala de compliance (03-ux-spec §2.9): the public visitor page, rendered by the real `RoomView`
 * inside the real visitor frame (56px bar with the lockup, as `(public)/layout.tsx`). The
 * product's own caveat is visible in the figure; the copy's paraphrase sits next to the H2 so
 * "preparada / provar" never travel without the limit (04-legal-review.md lines 19, 22, 23).
 */
export function RoomShowcase({ now }: { now: Date }) {
  const room = demoRoom(now);
  return (
    <Section id={ROOM.id}>
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-10">
        <Reveal className="lg:col-span-5 lg:col-start-1 lg:row-start-1">
          <SectionHeading eyebrowLang="en" id={ROOM.id} eyebrow={ROOM.eyebrow} title={ROOM.title} lead={ROOM.lead} size="s" />
        </Reveal>

        <Reveal delay={80} className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <ProductFigure id="room-figure" alt={ROOM.alt} className="relative" stageClassName="max-h-[560px] overflow-hidden rounded-lg border border-border bg-surface-base lg:max-h-[720px]">
            <div className="border-b border-border bg-surface-elevated">
              <div className="flex h-14 items-center px-4 md:px-6">
                <Lockup />
              </div>
            </div>
            <div className="px-4 py-8 md:px-6 md:py-10">
              <RoomView room={room} downloadBase={null} titleTag="p" />
            </div>
            {/* Cut, not decoration: fades the clipped bottom into the frame's Off-white. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-4 bottom-4 h-12 bg-linear-to-t from-surface-base to-transparent md:inset-x-6 md:bottom-6" />
          </ProductFigure>
        </Reveal>

        <Reveal className="lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <ul className="flex flex-col gap-5">
            {ROOM.items.map((item) => (
              <li key={item.title}>
                <h3 className="text-body font-medium text-text-primary">{item.title}</h3>
                <p className="mt-1 text-body-sm text-text-secondary">{item.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-label uppercase tracking-[0.06em] text-text-secondary">{ROOM.uses.join(" · ")}</p>
          <p className="mt-6 max-w-[36ch] text-pretty text-h3 font-display text-text-primary">{ROOM.acquisition}</p>
          <p className="mt-4 max-w-[52ch] text-pretty text-body-sm text-text-primary">{ROOM.caveat}</p>
        </Reveal>
      </Container>
    </Section>
  );
}
