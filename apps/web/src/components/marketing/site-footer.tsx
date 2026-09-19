import Link from "next/link";
import type { ReactNode } from "react";
import { Lockup } from "@/components/ui/brand-symbol";
import { FOOTER } from "@/lib/marketing/copy";
import { contactMailto, site } from "@/lib/marketing/site";
import { Container } from "./primitives";
import type { NavItem } from "./site-header";

const LINK = "inline-flex min-h-10 items-center text-body-sm text-text-secondary transition-colors duration-(--duration-fast) hover:text-text-primary lg:min-h-8";

function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-label uppercase tracking-[0.06em] text-text-secondary">{label}</p>
      <ul className="mt-3 flex flex-col">{children}</ul>
    </div>
  );
}

/**
 * Footer (03-ux-spec §2.14): brand + product statement, Produto / Conta / Legal / Contato.
 * Legal renders only when the interim notices are publishable (`site.legalReady`); Contato only
 * with a mailbox or a network URL. No headings (copy §C); `<nav aria-label="Rodapé">`.
 */
export function SiteFooter({ productItems }: { productItems: NavItem[] }) {
  const mailto = contactMailto("Compliance OS");
  const hasContact = Boolean(mailto || site.linkedinUrl || site.instagramUrl);
  const year = new Date().getFullYear();
  return (
    <footer id="rodape" className="theme-dark border-t border-border bg-surface-base py-12 text-text-primary lg:py-16">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Lockup size={32} />
            <p className="mt-4 max-w-[40ch] text-body-sm text-text-secondary">{FOOTER.statement}</p>
          </div>
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8 lg:col-span-8 lg:grid-cols-4">
            <Column label={FOOTER.columns.product}>
              {productItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={LINK}>
                    {item.label}
                  </a>
                </li>
              ))}
            </Column>
            <Column label={FOOTER.columns.account}>
              {FOOTER.account.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </Column>
            {site.legalReady ? (
              <Column label={FOOTER.columns.legal}>
                {FOOTER.legal.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={LINK}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </Column>
            ) : null}
            {hasContact ? (
              <Column label={FOOTER.columns.contact}>
                {mailto ? (
                  <li>
                    <a href={mailto} className={LINK}>
                      {FOOTER.contactLabel}
                    </a>
                  </li>
                ) : null}
                {site.linkedinUrl ? (
                  <li>
                    <a href={site.linkedinUrl} rel="noopener" className={LINK}>
                      {FOOTER.linkedin}
                    </a>
                  </li>
                ) : null}
                {site.instagramUrl ? (
                  <li>
                    <a href={site.instagramUrl} rel="noopener" className={LINK}>
                      {FOOTER.instagram}
                    </a>
                  </li>
                ) : null}
              </Column>
            ) : null}
          </nav>
        </div>
        <p className="mt-12 border-t border-border pt-6 text-caption text-text-secondary">
          © {year} {site.legalEntity ? `${site.legalEntity} · ` : ""}Compliance OS
        </p>
      </Container>
    </footer>
  );
}
