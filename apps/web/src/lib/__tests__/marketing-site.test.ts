import { describe, expect, it } from "vitest";
import { buildSiteConfig, normalizeSiteUrl, site } from "../marketing/site";

const base = { contactEmail: null, legalEntity: null, linkedinUrl: null, instagramUrl: null };

describe("site config", () => {
  it("is legalReady only with both a mailbox and a legal entity", () => {
    expect(buildSiteConfig({ ...base }).legalReady).toBe(false);
    expect(buildSiteConfig({ ...base, contactEmail: "x@example.com" }).legalReady).toBe(false);
    expect(buildSiteConfig({ ...base, legalEntity: "Acme Ltda." }).legalReady).toBe(false);
    expect(buildSiteConfig({ ...base, contactEmail: "x@example.com", legalEntity: "Acme Ltda." }).legalReady).toBe(true);
  });

  it("treats blank strings as absent (no placeholder ever reaches the page)", () => {
    const cfg = buildSiteConfig({ ...base, contactEmail: "  ", legalEntity: "", linkedinUrl: " ", instagramUrl: "" });
    expect(cfg.contactEmail).toBeNull();
    expect(cfg.legalEntity).toBeNull();
    expect(cfg.linkedinUrl).toBeNull();
    expect(cfg.instagramUrl).toBeNull();
    expect(cfg.legalReady).toBe(false);
  });

  it("normalizes the site URL and falls back to the provisional domain", () => {
    expect(normalizeSiteUrl(undefined)).toBe("https://compliance-os-web-gilt.vercel.app");
    expect(normalizeSiteUrl("")).toBe("https://compliance-os-web-gilt.vercel.app");
    expect(normalizeSiteUrl("https://example.com/")).toBe("https://example.com");
    expect(normalizeSiteUrl(" https://example.com// ")).toBe("https://example.com");
    // Malformed or non-http values fall back instead of throwing inside the root layout.
    expect(normalizeSiteUrl("not a url")).toBe("https://compliance-os-web-gilt.vercel.app");
    expect(normalizeSiteUrl("ftp://example.com")).toBe("https://compliance-os-web-gilt.vercel.app");
  });

  it("reflects today's state: contact and responsible person set, legal pages published", () => {
    expect(site.contactEmail).toBe("complianceos1199@gmail.com");
    expect(site.legalEntity).toBe("Carlos Eduardo Diogo");
    expect(site.legalReady).toBe(true);
  });
});
