import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The app has its own palette (light in `@theme`, dark in `html[data-theme="dark"]`, D39) while
 * the landing is pinned to the brand v1 palette by `.theme-light` / `.theme-dark`. Any color the
 * app themes set must be re-declared by both landing scopes, or the app palette leaks into the
 * landing. This test reads `globals.css` and enforces that.
 */
const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  expect(start, `selector ${selector} present`).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
  const body = css.slice(open + 1, end);
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]!] = m[2]!.trim();
  return vars;
}

const colors = (vars: Record<string, string>) => Object.keys(vars).filter((k) => k.startsWith("--color-"));

describe("globals.css theme scopes", () => {
  const theme = block("@theme {");
  const appDark = block('html[data-theme="dark"] {');
  const landingLight = block(".theme-light {");
  const landingDark = block(".theme-dark {");

  it("pins, in both landing scopes, every color the app dark theme overrides", () => {
    expect(colors(appDark).length).toBeGreaterThanOrEqual(27);
    for (const k of colors(appDark)) {
      expect(landingLight[k], `.theme-light ${k}`).toBeDefined();
      expect(landingDark[k], `.theme-dark ${k}`).toBeDefined();
    }
  });

  it("declares every themed color in @theme too (the app light values)", () => {
    for (const k of colors(appDark)) expect(theme[k], `@theme ${k}`).toBeDefined();
  });

  it("keeps the landing on the brand v1 primary", () => {
    expect(landingLight["--color-primary"]).toBe("#356ae6");
    expect(landingDark["--color-primary"]).toBe("#356ae6");
    expect(landingLight["--color-primary-foreground"]).toBe("#ffffff");
  });

  it("pins the landing's non-colour tokens to the v1 values (only family and display sizes change)", () => {
    const landing = block(".landing {");
    expect(landing["--radius-md"]).toBe("6px");
    expect(landing["--radius-lg"]).toBe("8px");
    expect(landing["--text-h1"]).toBe("2rem");
    expect(landing["--text-caption"]).toBe("0.6875rem");
    expect(landing["--shadow-modal"]).toBe("0 16px 40px rgb(11 13 15 / 0.16)");
  });

  it("declares the marketing tokens", () => {
    for (const k of ["--text-display-xl", "--text-display-l", "--text-display-m", "--text-display-s", "--duration-story"]) {
      expect(theme[k], k).toBeDefined();
    }
  });
});
