import type { MetadataRoute } from "next";
import { site } from "@/lib/marketing/site";

/** The root (landing) and, only while published, the two interim legal notices. */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [{ url: `${site.siteUrl}/`, changeFrequency: "weekly", priority: 1 }];
  if (site.legalReady) {
    entries.push(
      { url: `${site.siteUrl}/privacidade`, changeFrequency: "monthly", priority: 0.3 },
      { url: `${site.siteUrl}/termos`, changeFrequency: "monthly", priority: 0.3 },
    );
  }
  return entries;
}
