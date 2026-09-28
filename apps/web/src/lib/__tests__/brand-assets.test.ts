import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SYMBOL_PATH, SYMBOL_VIEWBOX } from "@/components/ui/brand-geometry";

/**
 * The symbol has one geometry (brand-system §07): the inline component, the public vector master
 * and the favicon sizes must not drift apart.
 */
const file = (path: string) => fileURLToPath(new URL(path, import.meta.url));

describe("brand symbol", () => {
  it("public/brand/symbol.svg carries the component's path and viewBox", () => {
    const svg = readFileSync(file("../../../public/brand/symbol.svg"), "utf8");
    expect(svg).toContain(`viewBox="${SYMBOL_VIEWBOX}"`);
    expect(svg).toContain(`d="${SYMBOL_PATH}"`);
  });

  it("every path point sits on a ring edge (outer radius 50, stroke 7.8) around (50, 50)", () => {
    const edges = [50, 42.2, 37.2, 16.8, 29.4, 24.6]; // ring 3 out/in, hairpin out/in, gap out/in
    const points = [...SYMBOL_PATH.matchAll(/[ML]([\d.]+) ([\d.]+)|A[\d.]+ [\d.]+ 0 1 [01] ([\d.]+) ([\d.]+)/g)].map((m) =>
      m[1] ? [Number(m[1]), Number(m[2])] : [Number(m[3]), Number(m[4])],
    );
    expect(points).toHaveLength(12);
    for (const [x, y] of points) {
      const r = Math.hypot(x! - 50, y! - 50);
      expect(edges.some((e) => Math.abs(e - r) < 0.02), `radius ${r.toFixed(3)}`).toBe(true);
    }
  });

  it("favicon.ico holds the 16, 32 and 48 px sizes", () => {
    const ico = readFileSync(file("../../app/favicon.ico"));
    expect(ico.readUInt16LE(2)).toBe(1); // type: icon
    const count = ico.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => ico[6 + i * 16] || 256).sort((a, b) => a - b);
    expect(sizes).toEqual([16, 32, 48]);
  });
});
