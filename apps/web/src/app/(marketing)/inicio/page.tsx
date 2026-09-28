import type { Metadata } from "next";
import { headers } from "next/headers";
import { AiAutomation } from "@/components/marketing/ai-automation";
import { ControlLayer } from "@/components/marketing/control-layer";
import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero, HERO_SENTINEL_ID } from "@/components/marketing/hero";
import { Plans } from "@/components/marketing/plans";
import { Problem } from "@/components/marketing/problem";
import { Product } from "@/components/marketing/product";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Steps } from "@/components/marketing/steps";
import { NAV, SEO } from "@/lib/marketing/copy";
import { landingJsonLd, serializeJsonLd } from "@/lib/marketing/json-ld";
import { site } from "@/lib/marketing/site";
import ogImage from "../../opengraph-image.png";

/**
 * Commercial landing. Lives at `/inicio` and is what an anonymous visitor sees at `/` (middleware
 * rewrite, `lib/marketing/entry.ts`); the canonical URL is therefore the site root. Icons come
 * from the `app/` file conventions; the Open Graph image is referenced explicitly because a
 * page-level `openGraph` object replaces the root's resolved one (file image included).
 */
const OG_IMAGE = { url: ogImage.src, width: ogImage.width, height: ogImage.height, alt: SEO.ogImageAlt };

export const metadata: Metadata = {
  title: { absolute: SEO.title },
  description: SEO.description,
  alternates: { canonical: `${site.siteUrl}/` },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${site.siteUrl}/`,
    siteName: "Compliance OS",
    title: SEO.ogTitle,
    description: SEO.ogDescription,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", title: SEO.ogTitle, description: SEO.ogDescription, images: [OG_IMAGE] },
  robots: { index: true, follow: true },
};

const NAV_ITEMS = NAV.items.map((item) => ({ label: item.label, href: item.hash }));

export default async function LandingPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <>
      <script type="application/ld+json" nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: serializeJsonLd(landingJsonLd(site)) }} />
      <SiteHeader items={NAV_ITEMS} login={NAV.login} cta={NAV.cta} sentinelId={HERO_SENTINEL_ID} />
      <main id="conteudo" tabIndex={-1} className="focus-visible:outline-none">
        <Hero />
        <Problem />
        <ControlLayer />
        <Steps />
        <Product />
        <AiAutomation />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter productItems={NAV_ITEMS} />
    </>
  );
}
