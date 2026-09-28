import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Three colour blocks (D39, D40): the app's light (`@theme`) and dark (`html[data-theme="dark"]`)
 * palettes, and the landing's `:where(.landing)` pin — the app-dark values for every visitor with
 * one deeper canvas. This test reads `globals.css` and keeps the three in step.
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
  for (const m of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]!] = m[2]!.replace(/\/\*.*\*\//, "").trim();
  return vars;
}

const colors = (vars: Record<string, string>) => Object.keys(vars).filter((k) => k.startsWith("--color-"));

describe("globals.css theme scopes", () => {
  const theme = block("@theme {");
  const appDark = block('html[data-theme="dark"] {');
  const landing = block(":where(.landing) {");

  it("declares every themed colour in @theme too (the app light values)", () => {
    expect(colors(appDark).length).toBeGreaterThanOrEqual(27);
    for (const k of colors(appDark)) expect(theme[k], `@theme ${k}`).toBeDefined();
  });

  it("pins the landing to the app-dark values, with the deeper canvas as the only difference", () => {
    for (const k of colors(appDark)) {
      const expected = k === "--color-surface-base" ? "#030712" : appDark[k];
      expect(landing[k], `:where(.landing) ${k}`).toBe(expected);
    }
    expect(landing["--color-primary"]).toBe("#06b6d4");
    expect(landing["--color-primary-foreground"]).toBe("#0b0f14");
  });

  it("no longer carries the brand v1 landing scopes", () => {
    expect(css).not.toContain(".theme-light {");
    expect(css).not.toContain(".theme-dark {");
    expect(css).not.toContain("--color-electric-blue");
  });

  it("declares the marketing tokens", () => {
    for (const k of ["--text-display-xl", "--text-display-l", "--text-display-m", "--text-display-s", "--duration-story"]) {
      expect(theme[k], k).toBeDefined();
    }
  });
});
