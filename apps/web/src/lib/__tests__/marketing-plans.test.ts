import { describe, expect, it } from "vitest";
import { PLANS } from "../marketing/copy";
import { landingJsonLd } from "../marketing/json-ld";
import { site } from "../marketing/site";

type Offer = { name: string; url: string; price: string; description: string };

function offers(): Offer[] {
  const graph = landingJsonLd(site)["@graph"] as Array<Record<string, unknown>>;
  const software = graph.find((node) => node["@type"] === "SoftwareApplication");
  return software?.offers as Offer[];
}

describe("plans (D38)", () => {
  it("sends every tier to its own Kiwify checkout", () => {
    const urls = PLANS.tiers.map((tier) => tier.checkoutUrl);
    for (const url of urls) expect(url).toMatch(/^https:\/\/pay\.kiwify\.com\.br\/[A-Za-z0-9]+$/);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("mirrors each tier in the JSON-LD offers: same price, same checkout", () => {
    expect(offers()).toHaveLength(PLANS.tiers.length);
    PLANS.tiers.forEach((tier, i) => {
      expect(offers()[i]).toMatchObject({ name: tier.name, url: tier.checkoutUrl, price: `${tier.price}.00` });
    });
  });

  it("never attaches the free month to an offer whose checkout charges on purchase", () => {
    for (const offer of offers()) expect(offer.description).not.toMatch(/gr[aá]tis|sem cart[aã]o/i);
  });
});
