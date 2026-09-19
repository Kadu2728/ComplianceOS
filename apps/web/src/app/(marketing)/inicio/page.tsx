import type { Metadata } from "next";
import { headers } from "next/headers";
import { BeforeAfter } from "@/components/marketing/before-after";
import { ControlChain } from "@/components/marketing/control-chain";
import { Faq } from "@/components/marketing/faq";
import { FeatureStories } from "@/components/marketing/feature-story";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero, HERO_SENTINEL_ID } from "@/components/marketing/hero";
import { Plans } from "@/components/marketing/plans";
import { RoomShowcase } from "@/components/marketing/room-showcase";
import { ScoreExplainer } from "@/components/marketing/score-explainer";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Steps } from "@/components/marketing/steps";
import { TrustGrid } from "@/components/marketing/trust-grid";
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
  // Fixture dates are relative to the request: nothing on the page ever reads as overdue.
  const now = new Date();
  return (
    <>
      <script type="application/ld+json" nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: serializeJsonLd(landingJsonLd(site)) }} />
      <SiteHeader items={NAV_ITEMS} login={NAV.login} cta={NAV.cta} sentinelId={HERO_SENTINEL_ID} />
      <main id="conteudo" tabIndex={-1} className="focus-visible:outline-none">
        <Hero now={now} />
        <BeforeAfter />
        <ControlChain />
        <Steps />
        <FeatureStories now={now} />
        <ScoreExplainer now={now} />
        <RoomShowcase now={now} />
        <TrustGrid />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter productItems={NAV_ITEMS} />
    </>
  );
}
