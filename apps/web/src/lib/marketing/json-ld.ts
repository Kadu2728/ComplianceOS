import { PLANS, SEO } from "@/lib/marketing/copy";
import type { SiteConfig } from "@/lib/marketing/site";

/**
 * Structured data for the landing (02-copy.md §C): Organization + SoftwareApplication. Keys
 * without a real value are omitted (no `logo` until D15 has a public URL decision, no `sameAs`
 * without networks, no `contactPoint` without a mailbox). `offers` mirrors the plan matrix (08-plans.md §7) —
 * real monthly prices, never a zero-price offer for the trial.
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
    // Mirrors PLANS.tiers (08-plans.md §7): real monthly prices, no zero-price offer for the trial,
    // no checkout `url` until billing exists. Change prices here and in copy.ts in the same commit.
    offers: PLANS.tiers.map((tier) => ({
      "@type": "Offer",
      name: tier.name,
      price: `${tier.price}.00`,
      priceCurrency: "BRL",
      description: "Por organização, por mês. Primeiro mês grátis, sem cartão.",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: `${tier.price}.00`,
        priceCurrency: "BRL",
        billingIncrement: 1,
        unitCode: "MON",
      },
    })),
    publisher: { "@id": `${root}#organization` },
  };

  return { "@context": "https://schema.org", "@graph": [organization, software] };
}

/** Serialized for an inline script: `<` escaped so no content can close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
