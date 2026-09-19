import { describe, expect, it } from "vitest";
import { LANDING_PATH, shouldShowLanding } from "../marketing/entry";

describe("shouldShowLanding (root route decision)", () => {
  it("shows the landing to an anonymous visitor at the root", () => {
    expect(shouldShowLanding("/", false)).toBe(true);
  });

  it("keeps the application at the root for anyone carrying the access cookie", () => {
    expect(shouldShowLanding("/", true)).toBe(false);
  });

  it("never rewrites anything but the root", () => {
    for (const path of ["/inicio", "/entrar", "/criar-conta", "/riscos", "/api/v1/me", "/sala/abc", "/privacidade", ""]) {
      expect(shouldShowLanding(path, false)).toBe(false);
      expect(shouldShowLanding(path, true)).toBe(false);
    }
  });

  it("rewrites to the landing route", () => {
    expect(LANDING_PATH).toBe("/inicio");
  });
});
