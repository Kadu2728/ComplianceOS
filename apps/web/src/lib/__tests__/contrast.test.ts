import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Machine check of the v2 contrast table (docs/design/visual-v2.md §7.2, §7.3): the figures in the
 * spec were computed by hand; this recomputes every pair from the hex values in `globals.css`
 * (WCAG 2.x relative luminance) for both app themes, so a token edit cannot silently break AA.
 */
const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");

function colors(selector: string): Record<string, string> {
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
  const out: Record<string, string> = {};
  for (const m of css.slice(open + 1, end).matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)) out[m[1]!] = m[2]!;
  return out;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = ["text-primary", "text-secondary", "text-muted", "primary-text", "info-text", "success-text", "warning-text", "danger-text", "focus"];
const SURFACES = ["surface-base", "surface-elevated", "surface-hover"];

const THEMES = {
  dark: colors('html[data-theme="dark"] {'),
  light: colors("@theme {"),
  landing: colors(":where(.landing) {"),
};

describe.each(Object.entries(THEMES))("contrast, app %s theme (AA)", (_name, c) => {
  it("text tokens reach 4.5:1 on every surface", () => {
    for (const fg of TEXT) for (const bg of SURFACES) expect(ratio(c[fg]!, c[bg]!), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it("semantic text reaches 4.5:1 on its own tint (badges)", () => {
    for (const tone of ["info", "success", "warning", "danger"]) {
      expect(ratio(c[`${tone}-text`]!, c[`${tone}-tint`]!), tone).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(c["primary-text"]!, c["primary-tint"]!), "primary-text on primary-tint").toBeGreaterThanOrEqual(4.5);
    expect(ratio(c["text-primary"]!, c["primary-tint"]!), "text-primary on primary-tint").toBeGreaterThanOrEqual(4.5);
  });

  it("labels on bright fills reach 4.5:1", () => {
    for (const bg of ["primary", "primary-hover", "primary-active"]) {
      expect(ratio(c["primary-foreground"]!, c[bg]!), `primary-foreground on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
    for (const bg of ["danger-fill", "warning-fill", "success-fill"]) {
      expect(ratio(c["on-fill"]!, c[bg]!), `on-fill on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("non-text UI reaches 3:1 (inputs, focus, score, severity)", () => {
    for (const bg of ["surface-base", "surface-elevated"]) {
      expect(ratio(c["border-input"]!, c[bg]!), `border-input vs ${bg}`).toBeGreaterThanOrEqual(3);
      expect(ratio(c.focus!, c[bg]!), `focus vs ${bg}`).toBeGreaterThanOrEqual(3);
      expect(ratio(c.outline!, c[bg]!), `outline vs ${bg}`).toBeGreaterThanOrEqual(3);
    }
    expect(ratio(c["score-fill"]!, c["score-track"]!), "score vs track").toBeGreaterThanOrEqual(3);
    expect(ratio(c["score-fill"]!, c["surface-elevated"]!), "score vs elevated").toBeGreaterThanOrEqual(3);
    for (const sev of ["sev-critical", "sev-high", "sev-medium", "sev-low"]) {
      for (const bg of SURFACES) expect(ratio(c[sev]!, c[bg]!), `${sev} vs ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });
});
