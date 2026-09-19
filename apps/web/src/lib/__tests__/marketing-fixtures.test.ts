import { describe, expect, it } from "vitest";
import { demoActivity, demoPriorities, demoRadar, demoRisks, demoRoom, demoScore } from "../marketing/fixtures";

/** Same arithmetic as `apps/api/app/services/score.py` v2. */
const WEIGHTS: Record<string, number> = { A: 0.1, B: 0.4, K: 0.2, C: 0.15, D: 0.15 };
const SEVERITY_WEIGHT: Record<string, number> = { critico: 12, alto: 6, medio: 3, baixo: 1 };
const round1 = (n: number) => Math.round(n * 10) / 10;
const roundHalfUp = (n: number) => Math.floor(n + 0.5);
const bandFor = (s: number) => (s < 40 ? "inicial" : s < 60 ? "estruturando" : s < 80 ? "organizado" : "maduro");

const now = new Date("2026-09-19T12:00:00Z");
const day = (iso: string) => iso.slice(0, 10);
const today = day(now.toISOString());

describe("landing fixture — Score coherence with score.py", () => {
  const score = demoScore(now);
  const factors = score.factors ?? [];

  it("uses the five v2 factors in service order with weights summing to 1", () => {
    expect(factors.map((f) => f.key)).toEqual(["B", "K", "C", "A", "D"]);
    expect(factors.reduce((acc, f) => acc + f.weight, 0)).toBeCloseTo(1, 10);
    for (const f of factors) expect(f.weight).toBe(WEIGHTS[f.key]);
  });

  it("derives every contribution from weight × value with the service's rounding", () => {
    for (const f of factors) {
      expect(f.value).toBe(round1(f.value));
      expect(f.contribution).toBe(round1(f.weight * f.value));
    }
  });

  it("sums the contributions to the displayed score (half-up) and lands in the displayed band", () => {
    const total = factors.reduce((acc, f) => acc + f.contribution, 0);
    expect(roundHalfUp(total)).toBe(score.score);
    expect(score.score).toBe(74);
    expect(bandFor(score.score!)).toBe(score.band?.key);
  });

  it("makes the Riscos value follow the penalty in its own summary (44 of 128)", () => {
    const b = factors.find((f) => f.key === "B")!;
    expect(b.summary).toContain("peso 44 de 128");
    expect(b.value).toBe(round1(100 * (1 - 44 / 128)));
  });

  it("prices each reducer exactly as the service would", () => {
    const reducers = score.top_reducers ?? [];
    const points: Record<string, (count: number) => number> = {
      open_critico: (n) => n * WEIGHTS.B! * 100 * SEVERITY_WEIGHT.critico! / 128,
      open_alto: (n) => n * WEIGHTS.B! * 100 * SEVERITY_WEIGHT.alto! / 128,
      missing_evidence: (n) => n * WEIGHTS.D! * 100 / 20, // "12 de 20 itens fechados" → denominator 20
    };
    for (const r of reducers) {
      expect(r.points).toBeCloseTo(points[r.reason]!(r.count), 2);
      expect(r.refs.length).toBeLessThanOrEqual(3);
      expect(r.refs.length).toBeLessThanOrEqual(r.count);
    }
    const sorted = [...reducers].sort((a, b) => b.points - a.points);
    expect(reducers.map((r) => r.reason)).toEqual(sorted.map((r) => r.reason));
  });

  it("proposes one next step per reducer, in reducer order, pointing at that reducer's first record", () => {
    const reducers = score.top_reducers ?? [];
    const steps = score.next_actions ?? [];
    expect(steps).toHaveLength(reducers.length);
    steps.forEach((s, i) => {
      const ref = reducers[i]!.refs[0]!;
      expect(s.kind).toBe(ref.kind);
      expect(s.id).toBe(ref.id);
      expect(s.label).toContain(ref.title);
    });
  });

  it("keeps the delta arithmetic honest and the dates relative to the render", () => {
    expect(score.delta!.previous_score + score.delta!.diff).toBe(score.score);
    expect(day(score.computed_at!)).toBe(today);
    expect(new Date(score.delta!.previous_at).getTime()).toBeLessThan(now.getTime());
    expect(score.preliminary).toBe(false);
    expect(score.assessment_completed).toBe(true);
  });
});

describe("landing fixture — radar, priorities, risks, activity and room agree with the score", () => {
  const score = demoScore(now);
  const radar = demoRadar(now);

  it("counts radar items per tone and mirrors the overdue/critical numbers of the score", () => {
    const counted = radar.items.reduce<Record<string, number>>((acc, it) => ({ ...acc, [it.tone]: (acc[it.tone] ?? 0) + 1 }), {});
    for (const tone of ["danger", "warning", "info"]) expect(radar.counts[tone] ?? 0).toBe(counted[tone] ?? 0);
    const overdue = radar.items.find((it) => it.kind === "action_overdue")!;
    expect(score.factors!.find((f) => f.key === "C")!.summary).toContain(`${overdue.count} ações atrasadas`);
    const critical = radar.items.find((it) => it.kind === "risk_critical")!;
    expect(score.top_reducers!.find((r) => r.reason === "open_critico")!.count).toBe(critical.count);
    expect(radar.all_clear).toBe(false);
  });

  it("orders priorities by decreasing gain, with future deadlines and known risks", () => {
    const prio = demoPriorities(now, 4);
    const riskIds = new Set(demoRisks(now).map((r) => r.id));
    expect(prio.items).toHaveLength(4);
    expect(demoPriorities(now, 3).items).toHaveLength(3);
    expect(prio.current_score).toBe(score.score);
    expect(prio.unplanned).toEqual([]);
    const gains = prio.items.map((it) => it.score_gain!);
    expect([...gains].sort((a, b) => b - a)).toEqual(gains);
    for (const it of prio.items) {
      expect(it.due_date! > today).toBe(true);
      expect(riskIds.has(it.risk_id!)).toBe(true);
      expect(it.reasons.length).toBeGreaterThan(0);
    }
  });

  it("dates open risks in the future and only the resolved risk in the past", () => {
    for (const r of demoRisks(now)) {
      const closed = r.status === "resolvido" || r.status === "aceito";
      if (closed) {
        expect(r.due_date! < today).toBe(true);
        expect(r.resolved_at).not.toBeNull();
      } else {
        expect(r.due_date! > today).toBe(true);
        expect(r.resolved_at).toBeNull();
      }
    }
  });

  it("lists activity newest first, without links (entity_id null)", () => {
    const entries = demoActivity(now);
    for (let i = 1; i < entries.length; i++) {
      expect(new Date(entries[i - 1]!.created_at).getTime()).toBeGreaterThan(new Date(entries[i]!.created_at).getTime());
    }
    for (const e of entries) expect(e.entity_id).toBeNull();
  });

  it("shows the same score in the Compliance Room and a link that has not expired", () => {
    const room = demoRoom(now);
    expect(room.score!.score).toBe(score.score);
    expect(room.score!.band.key).toBe(score.band!.key);
    expect(new Date(room.link!.expires_at).getTime()).toBeGreaterThan(now.getTime());
    expect(room.caveat).toContain("Não constituem certificação");
    for (const d of room.documents) expect(d.status).not.toBe("faltante");
    for (const c of room.controls) expect(["implementado", "verificado"]).toContain(c.status);
  });
});
