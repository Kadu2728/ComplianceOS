import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * `.theme-light` re-declares the light @theme values so the landing ignores the app's theme
 * toggle. The two lists must never drift: this test reads `globals.css` and compares them.
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

describe("globals.css theme scopes", () => {
  const theme = block("@theme {");
  const light = block(".theme-light {");
  const dark = block('html[data-theme="dark"],\n  .theme-dark {');

  it("re-applies every light color it declares with the exact @theme value", () => {
    const colors = Object.keys(light).filter((k) => k.startsWith("--color-"));
    expect(colors.length).toBeGreaterThanOrEqual(23);
    for (const k of colors) expect(light[k], k).toBe(theme[k]);
  });

  it("covers every variable the dark scope overrides (so no dark value can leak into the landing)", () => {
    for (const k of Object.keys(dark).filter((k) => k.startsWith("--color-"))) expect(light[k], k).toBeDefined();
  });

  it("declares the six marketing tokens", () => {
    for (const k of ["--text-display-xl", "--text-display-l", "--text-display-m", "--text-display-s", "--duration-story"]) {
      expect(theme[k], k).toBeDefined();
    }
    expect(css).toContain("--font-display: var(--font-geist), var(--font-sans);");
  });
});
