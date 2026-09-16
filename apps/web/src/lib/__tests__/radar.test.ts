import { describe, expect, it } from "vitest";
import { RADAR_ROUTES, radarHref } from "../domain/radar";
import { refHref } from "../domain/score";

describe("radar route hints", () => {
  it("maps every known hint to an app route and never breaks on unknown ones", () => {
    expect(radarHref("risks:critical")).toBe("/riscos?status=abertos&severity=critico");
    expect(radarHref("actions:overdue")).toBe("/acoes?overdue=1");
    expect(radarHref("documents:faltante")).toBe("/documentos?status=faltante");
    expect(radarHref("profile")).toBe("/configuracoes#perfil");
    expect(radarHref("something:new")).toBe("/");
    for (const href of Object.values(RADAR_ROUTES)) expect(href.startsWith("/")).toBe(true);
  });

  it("score refs know controls and documents", () => {
    expect(refHref({ kind: "control", id: "c1" })).toBe("/controles/c1");
    expect(refHref({ kind: "control" })).toBe("/controles");
    expect(refHref({ kind: "document", id: "d1" })).toBe("/documentos/d1");
  });
});
