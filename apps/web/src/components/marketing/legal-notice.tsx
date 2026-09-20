import { Fragment } from "react";
import { NAV } from "@/lib/marketing/copy";
import type { LegalBlock, LegalDocument } from "@/lib/marketing/legal";
import { Container } from "./primitives";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

const NAV_ITEMS = NAV.items.map((item) => ({ label: item.label, href: `/${item.hash}` }));

const EMAIL_RE = /([\w.+-]+@[\w-]+\.[\w.-]+)/g;

/** Plain text with e-mail addresses turned into `mailto:` links; nothing else is interpreted. */
function Text({ text }: { text: string }) {
  const parts = text.split(EMAIL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={`mailto:${part}`} className="text-info-text underline decoration-1 underline-offset-2 hover:text-info-fill">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "h3") return <h3 className="mt-2 text-h3 text-text-primary">{block.text}</h3>;
  if (block.type === "ul")
    return (
      <ul className="list-disc space-y-1 pl-6">
        {block.items.map((item) => (
          <li key={item}>
            <Text text={item} />
          </li>
        ))}
      </ul>
    );
  return (
    <p>
      <Text text={block.text} />
    </p>
  );
}

/**
 * Frame for the legal documents (D13): same header and footer as the landing (anchors point back
 * to the root), one reading column, numbered sections. Content comes verbatim from
 * `lib/marketing/legal.ts`; rendered only when `site.legalReady` — the pages call `notFound()`
 * otherwise.
 */
export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <>
      <SiteHeader items={NAV_ITEMS} login={NAV.login} cta={NAV.cta} />
      <main id="conteudo" tabIndex={-1} className="py-16 focus-visible:outline-none md:py-24">
        <Container>
          <article className="max-w-[68ch]">
            <h1 className="text-section text-text-primary">{document.title}</h1>
            <p className="mt-4 text-body-sm text-text-secondary">Última atualização: {document.updated}</p>
            <div className="mt-10 flex flex-col gap-10">
              {document.sections.map((section) => (
                <section key={section.heading} aria-labelledby={`legal-${slug(section.heading)}`}>
                  <h2 id={`legal-${slug(section.heading)}`} className="text-h2 text-text-primary">
                    {section.heading}
                  </h2>
                  <div className="mt-4 flex flex-col gap-4 text-body text-text-primary">
                    {section.blocks.map((block, i) => (
                      <Block key={i} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </Container>
      </main>
      <SiteFooter productItems={NAV_ITEMS} />
    </>
  );
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
