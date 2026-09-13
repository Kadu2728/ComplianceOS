import { describe, expect, it } from "vitest";
import { formatDelta, formatInstantDay, formatPercent, formatPoints, refHref } from "../domain/score";

describe("score helpers", () => {
  it("maps API record kinds to app routes", () => {
    expect(refHref({ kind: "risk", id: "r1" })).toBe("/riscos/r1");
    expect(refHref({ kind: "action", id: "a1" })).toBe("/acoes/a1");
    expect(refHref({ kind: "risk", id: null })).toBe("/riscos");
    expect(refHref({ kind: "assessment" })).toBe("/diagnostico");
    expect(refHref({ kind: "evidence" })).toBe("/riscos");
  });

  it("formats numbers in pt-BR and deltas with a real minus sign", () => {
    expect(formatPoints(36.25)).toBe("36,3");
    expect(formatPoints(15)).toBe("15");
    expect(formatPercent(0.5)).toBe("50%");
    expect(formatDelta(8)).toBe("+8");
    expect(formatDelta(-3)).toBe("−3");
    expect(formatDelta(0)).toBe("0");
  });

  it("shows the organization's calendar day for an instant", () => {
    // 01:45 UTC on the 13th is still the 12th in São Paulo.
    expect(formatInstantDay("2026-09-13T01:45:21Z")).toBe("12/09/2026");
  });
});
