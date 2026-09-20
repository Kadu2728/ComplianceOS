/**
 * Single source of the public site's facts (landing, legal notices, robots, sitemap, JSON-LD).
 * Everything that may not exist yet is `null`, and every consumer renders nothing for `null`:
 * no `{PLACEHOLDER}` ever reaches the HTML. Values are compile-time constants except `siteUrl`,
 * which follows the deployment (decision D3 pending: provisional Vercel domain today).
 */
export type SiteConfig = {
  /** Canonical origin without trailing slash. */
  siteUrl: string;
  /** Support / contact mailbox; `null` hides every "Fale com a gente" and the JSON-LD contactPoint. */
  contactEmail: string | null;
  /** Legal entity behind the service; `null` hides the copyright owner and blocks the legal notices. */
  legalEntity: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  /** Interim legal notices (D13) may only be published with a real controller and a real mailbox. */
  legalReady: boolean;
};

const FALLBACK_SITE_URL = "https://compliance-os-web-gilt.vercel.app";

/**
 * Trims a trailing slash so `siteUrl + "/path"` never doubles it. A malformed value falls back to
 * the default instead of reaching `new URL()` in the root layout, where it would take every route
 * down with it (QA P3).
 */
export function normalizeSiteUrl(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return FALLBACK_SITE_URL;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return FALLBACK_SITE_URL;
    return url.origin + url.pathname.replace(/\/+$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/** Pure builder so the readiness rule is unit-testable without touching `process.env`. */
export function buildSiteConfig(input: {
  siteUrl?: string;
  contactEmail: string | null;
  legalEntity: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
}): SiteConfig {
  const contactEmail = input.contactEmail?.trim() || null;
  const legalEntity = input.legalEntity?.trim() || null;
  return {
    siteUrl: normalizeSiteUrl(input.siteUrl),
    contactEmail,
    legalEntity,
    linkedinUrl: input.linkedinUrl?.trim() || null,
    instagramUrl: input.instagramUrl?.trim() || null,
    legalReady: Boolean(contactEmail && legalEntity),
  };
}

export const site: SiteConfig = buildSiteConfig({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  // Provided by the owner (Orchestrator, 2026-09-19). Subject of the "Fale com a gente" mailto.
  contactEmail: "complianceos1199@gmail.com",
  // Responsible person named in the owner-approved Termos de Uso / Política de Privacidade (D13, 2026-09-19).
  legalEntity: "Carlos Eduardo Diogo",
  linkedinUrl: null,
  // Provided by the owner (2026-09-19); rendered in the footer "Contato" column and in JSON-LD `sameAs`.
  instagramUrl: "https://www.instagram.com/compliance_os/",
});

/** `mailto:` with an encoded subject; `null` when there is no mailbox. */
export function contactMailto(subject: string): string | null {
  if (!site.contactEmail) return null;
  return `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}`;
}
