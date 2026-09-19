import { NAV } from "@/lib/marketing/copy";
import { Container } from "./primitives";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const NAV_ITEMS = NAV.items.map((item) => ({ label: item.label, href: `/${item.hash}` }));

/**
 * Frame for the interim legal notices (D13, 04-legal-review.md §3): same header and footer as
 * the landing (anchors point back to the root), one reading column. Rendered only when
 * `site.legalReady` — the pages call `notFound()` otherwise.
 */
export function LegalNotice({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  return (
    <>
      <SiteHeader items={NAV_ITEMS} login={NAV.login} cta={NAV.cta} />
      <main id="conteudo" tabIndex={-1} className="py-16 focus-visible:outline-none md:py-24">
        <Container>
          <article className="max-w-[60ch]">
            <h1 className="text-section text-text-primary">{title}</h1>
            <div className="mt-8 flex flex-col gap-5 text-body text-text-primary">
              {paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </article>
        </Container>
      </main>
      <SiteFooter productItems={NAV_ITEMS} />
    </>
  );
}
