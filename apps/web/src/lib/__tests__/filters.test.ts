import { describe, expect, it } from "vitest";
import { actionQuery, filterHref, hasFilters, parseActionFilters, parseRiskFilters, riskQuery } from "../domain/filters";

const OWNER = "8f4d2a1e-3c5b-4e7f-9a1b-2c3d4e5f6a7b";

describe("risk filters", () => {
  it("parses only known values and expands status groups for the API", () => {
    const f = parseRiskFilters({ status: "abertos", severity: "critico", owner: OWNER, page: "2" });
    expect(f).toEqual({ status: "abertos", severity: "critico", owner: OWNER });
    expect(riskQuery(f)).toBe(`&status=aberto&status=em_andamento&status=em_revisao&severity=critico&owner_membership_id=${OWNER}`);
    expect(filterHref("/riscos", f)).toBe(`/riscos?status=abertos&severity=critico&owner=${OWNER}`);
  });

  it("ignores unknown or malformed values", () => {
    const f = parseRiskFilters({ status: "drop table", severity: ["x"], owner: "not-a-uuid" });
    expect(f).toEqual({ status: undefined, severity: undefined, owner: undefined });
    expect(riskQuery(f)).toBe("");
    expect(hasFilters(f)).toBe(false);
    expect(filterHref("/riscos", f)).toBe("/riscos");
  });
});

describe("action filters", () => {
  it("maps the overdue toggle and pending group", () => {
    const f = parseActionFilters({ status: "pendentes", overdue: "1" });
    expect(f).toEqual({ status: "pendentes", overdue: true, owner: undefined });
    expect(actionQuery(f)).toBe("&status=a_fazer&status=em_andamento&status=em_revisao&status=bloqueada&overdue=true");
    expect(filterHref("/acoes", f)).toBe("/acoes?status=pendentes&overdue=1");
    expect(hasFilters(f)).toBe(true);
    expect(parseActionFilters({ overdue: "0" }).overdue).toBeUndefined();
  });
});
