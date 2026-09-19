import { SEO } from "@/lib/marketing/copy";
import type { SiteConfig } from "@/lib/marketing/site";

/**
 * Structured data for the landing (02-copy.md §C): Organization + SoftwareApplication. Keys
 * without a real value are omitted (no `logo` until D15 has a public URL decision, no `sameAs`
 * without networks, no `contactPoint` without a mailbox). `offers` is kept as in the copy; the
 * legal review recommends dropping it when billing exists (04-legal-review.md line 58).
 */
export function landingJsonLd(site: SiteConfig): Record<string, unknown> {
  const root = `${site.siteUrl}/`;
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${root}#organization`,
    name: "Compliance OS",
    url: root,
  };
  if (site.contactEmail) {
    organization.contactPoint = [
      { "@type": "ContactPoint", contactType: "customer support", email: site.contactEmail, availableLanguage: ["pt-BR"] },
    ];
  }
  const sameAs = [site.linkedinUrl, site.instagramUrl].filter((u): u is string => Boolean(u));
  if (sameAs.length) organization.sameAs = sameAs;

  const software: Record<string, unknown> = {
    "@type": "SoftwareApplication",
    "@id": `${root}#software`,
    name: "Compliance OS",
    url: root,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    description: SEO.softwareDescription,
    featureList: [...SEO.featureList],
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL", description: "Acesso gratuito durante o beta. Sem cartão de crédito." },
    publisher: { "@id": `${root}#organization` },
  };

  return { "@context": "https://schema.org", "@graph": [organization, software] };
}

/** Serialized for an inline script: `<` escaped so no content can close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
