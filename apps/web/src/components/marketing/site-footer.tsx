import Link from "next/link";
import { Lockup } from "@/components/ui/brand-symbol";
import { FOOTER } from "@/lib/marketing/copy";
import { site } from "@/lib/marketing/site";
import { Container } from "./primitives";
import type { NavItem } from "./site-header";

const LINK = "inline-flex min-h-11 items-center text-body-sm text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary lg:min-h-10";

/** Instagram glyph drawn in the Lucide idiom (lucide 1.x ships no brand icons; no new dependency). */
function InstagramGlyph() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

/**
 * Footer v2 (landing-v2 §4.12): the reference's one row (lockup · anchors · social), then the
 * legal row — the page's limit statement, Termos/Privacidade (only when published), contact and
 * copyright. Instagram only; LinkedIn when `site.linkedinUrl` exists.
 */
export function SiteFooter({ productItems }: { productItems: NavItem[] }) {
  const year = new Date().getFullYear();
  return (
    <footer id="rodape" className="border-t border-border pt-10 pb-8 text-text-primary lg:pt-12 print:hidden">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <Lockup />
          <nav aria-label="Rodapé">
            <ul className="grid grid-cols-2 gap-x-6 md:flex md:gap-6">
              {productItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={LINK}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-1">
            {site.instagramUrl ? (
              <a
                href={site.instagramUrl}
                rel="noopener"
                aria-label="Instagram do Compliance OS"
                className="flex size-11 items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-surface-hover hover:text-text-primary lg:size-10"
              >
                <InstagramGlyph />
              </a>
            ) : null}
            {site.linkedinUrl ? (
              <a href={site.linkedinUrl} rel="noopener" className={`${LINK} px-2`}>
                {FOOTER.linkedin}
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
          <ul className="flex flex-col md:flex-row md:flex-wrap md:gap-x-6 lg:order-2 lg:self-start">
            {site.legalReady
              ? FOOTER.legal.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={LINK}>
                      {item.label}
                    </Link>
                  </li>
                ))
              : null}
            {site.contactEmail ? (
              <li>
                <a href={`mailto:${site.contactEmail}`} className={LINK}>
                  Contato: {site.contactEmail}
                </a>
              </li>
            ) : null}
          </ul>
          <div className="lg:order-1">
            <p className="max-w-[72ch] text-caption text-text-muted">{FOOTER.statement}</p>
            <p className="mt-2 text-caption text-text-muted">
              © {year} Compliance OS{site.legalEntity ? ` · ${site.legalEntity}` : ""}. {FOOTER.rights}
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
