import { describe, expect, it } from "vitest";
import { relativeTime } from "../domain/time";

const now = new Date("2026-09-26T15:00:00-03:00");

describe("relativeTime (pt-BR, São Paulo)", () => {
  it("counts minutes, hours, then calendar days", () => {
    expect(relativeTime("2026-09-26T14:59:40-03:00", now)).toBe("agora");
    expect(relativeTime("2026-09-26T14:55:00-03:00", now)).toBe("há 5 minutos");
    expect(relativeTime("2026-09-26T12:00:00-03:00", now)).toBe("há 3 horas");
    expect(relativeTime("2026-09-25T23:00:00-03:00", now)).toBe("ontem");
    expect(relativeTime("2026-09-24T10:00:00-03:00", now)).toBe("anteontem");
    expect(relativeTime("2026-09-21T10:00:00-03:00", now)).toBe("há 5 dias");
  });

  it("switches to the date after 30 days", () => {
    expect(relativeTime("2026-08-01T10:00:00-03:00", now)).toBe("01/08/2026");
  });
});
