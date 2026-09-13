# COMPLIANCE OS — SCORE v1 PROPOSAL

Owner: Product Strategist. Status: DRAFT — requires Compliance Researcher review (naming, language) and Engineering confirmation (determinism, persistence). Implements decision D10's recommendation; `Control` and `Document` dimensions are excluded from v1 (D5, D9).

The score is a **maturity indicator computed from the organization's own data**. It is not a measure of legal compliance and must never be presented as one (CLAUDE.md §8; Compliance Researcher file §17).

---

## 1. Design constraints (from governance)

Explainable · traceable to records · deterministic (same input → same output) · versioned (`score_version`) · never arbitrary · never a legal claim · empty state before the first assessment is "—", not 0 (brand §28, D10).

## 2. Factors

| Factor | Name (pt-BR) | Weight | What it measures | Source records |
|---|---|---|---|---|
| A | Diagnóstico | 0.15 | Completeness of the assessment on the current template version | `AssessmentResponse` count / question count |
| B | Riscos | 0.50 | Risk posture: how much open-risk weight remains vs. the worst case | open `Risk` rows (derived + manual), severity |
| C | Execução | 0.20 | Whether critical/high risks have assigned actions and whether actions are on time | `Risk`, `Action` (owner, due_date, status) |
| D | Evidências | 0.15 | Whether closed critical/high risks and completed actions carry evidence | `Evidence` linked to `Risk` / `Action` |

Weights sum to 1.0. Rationale: risk posture dominates because it is the product's core promise (brand §29); execution and evidence together weigh 0.35 so that the score cannot be maxed by answering "sim" — proof matters (brand §6 "Evidence over claims").

## 3. Formulas

Severity weights `w`: Crítico 12 · Alto 6 · Médio 3 · Baixo 1 (same P×I scale as the assessment derivation; a Crítico is worth two Altos, four Médios).

- **A = 100 × answered / total_questions** (answers of any type count; `nao_sei` is reported separately as "incerto %").
- **B = max(0, 100 × (1 − Σ w(open risks) / MaxPenalty))**, where `MaxPenalty` = Σ over template questions of `w(severity(P=3, I_q))` — the penalty if every question were answered "não". For template v1: **MaxPenalty = 250** (full) and **120** (short mode). Manual risks add to the numerator only; a heavily loaded org can reach B = 0 but not below.
- **C = 0.5 × coverage + 0.5 × on_time**, where `coverage` = % of open Crítico/Alto risks that have at least one action with an owner and a due date; `on_time` = % of non-done actions not past due plus done actions, over all actions. Special cases: no open Crítico/Alto and no actions → C = 100 (nothing to execute); open Crítico/Alto but zero actions → C = 0.
- **D = 100 × (closed Crítico/Alto risks with evidence + done actions with evidence) / (closed Crítico/Alto risks + done actions)**; if the denominator is 0 → D = 0 with the explanation "Nenhuma evidência registrada ainda".
- **Score = round(0.15·A + 0.50·B + 0.20·C + 0.15·D)**, integer 0–100.

Definitions: "open" risk = status not in {Resolvido, Aceito}; "closed" = Resolvido; a risk moved to `Em revisão` by a re-assessment is still open. "Done" action = status Concluída. Dates compare against the organization's timezone day (America/Sao_Paulo).

## 4. Explanation payload

Returned with every score and persisted in the snapshot:

```
score: 69, score_version: "v1", computed_at, preliminary: false,
band: {key: "organizado", label: "Organizado"},
factors: [
  {key:"B", label:"Riscos", weight:0.50, value:72.8, contribution:36.4,
   items:[{type:"risk", id, title:"Sistemas críticos sem MFA", severity:"critico", weight:12}, …]},
  {key:"C", label:"Execução", weight:0.20, value:90, contribution:18,
   items:[{type:"action", id, title:"…", status:"atrasada", due_date}]},
  {key:"A", label:"Diagnóstico", weight:0.15, value:100, contribution:15, items:[]},
  {key:"D", label:"Evidências", weight:0.15, value:0, contribution:0,
   items:[{type:"hint", text:"Nenhuma evidência registrada ainda"}]}
],
top_reducers: [ …3 items with the largest weight… ],
next_actions: [ …up to 3 suggested actions derived from top_reducers… ],
delta: {previous_score: 51, previous_at, diff: +18}
```

The UI renders "Por que 69?" from `factors` and "O que mais reduz o score" from `top_reducers` (UX file §13). Every item links to its record.

## 5. Bands (labels need Compliance Researcher review)

| Range | Key | Label (proposal) | Not allowed |
|---|---|---|---|
| 0–39 | inicial | Inicial | — |
| 40–59 | estruturando | Em estruturação | — |
| 60–79 | organizado | Organizado | "Conforme" |
| 80–100 | maduro | Maduro | "Compliant", "Adequado à LGPD" |

Brand §28's example "74 / 100 — Good" maps to "Organizado". Brand §69's copy "Seu compliance está 74% controlado" is **flagged**: "controlado" can read as a compliance claim. Proposed dashboard line: "Score de maturidade: 74 — Organizado". Naming of the product feature stays "Score de Compliance" (brand §55 nav label) with the subtitle "indicador de maturidade" on first view; the Researcher decides whether the public name itself must change.

## 6. Preliminary score (short mode)

After short mode only: `preliminary: true`; A and B are computed over the 12 short-mode questions (MaxPenalty 120); C and D as usual. UI label: "Score preliminar — responda o diagnóstico completo para consolidar". Snapshots record `preliminary` so trends do not mix preliminary and full values (the first full score becomes the new baseline for `delta`).

## 7. Snapshots and versioning

- `ScoreSnapshot(organization_id, score, breakdown_json, score_version, preliminary, computed_at)` written on every recalculation trigger: assessment completion, risk create/status/severity change, action status/due change, evidence add/remove; at most one snapshot per org per hour is kept for the trend (latest wins), plus the first of each day.
- `score_version` bumps when weights, formulas or severity weights change; old snapshots are never recomputed. The trend chart labels version boundaries.

## 8. Determinism and testing (for QA)

Same records → same score. Test boundaries: no assessment (→ "—"), 0/42 answered, all "sim" (A 100, B 100, C 100, D 0 → 85 — the honest ceiling without evidence), all "não" (B 0), all `nao_se_aplica` (B undefined → score "—" with explanation), one Crítico open without action (C 0), evidence toggles (D), overdue boundary at midnight America/Sao_Paulo, manual risk pushing B below 0 (clamped).

## 9. Anti-gaming

- "Sim" without evidence creates no risk (inherent to self-assessment) but D stays 0 until evidence exists → ceiling 85. The dashboard shows "Sem evidências" as the top reducer.
- Completing actions without evidence raises C, not D.
- Re-answering "sim" on a question with an open derived risk does not close the risk (assessment §7.7).
- Deleting a risk is audit-logged and shown in the trend explanation ("1 risco removido em 12/09").

## 10. Worked examples (computed with the reference script; all rounded to one decimal)

**Example 1 — short mode just completed.** 12/12 answered; 4 "não" on impact-4 questions (4 Críticos), 3 "parcial" on impact-3 (3 Médios), 5 "sim"; no actions yet.
A = 100 · B = 100 × (1 − (4×12 + 3×3)/120) = 100 × (1 − 57/120) = **52.5** · C = 0 (4 Crítico/Alto open, none with action) · D = 0.
Score = 0.15×100 + 0.50×52.5 + 0.20×0 + 0.15×0 = 15 + 26.25 = **41 (preliminar, Em estruturação)**.
Explanation shown: "4 riscos críticos sem ação planejada" (top reducer), "Nenhuma evidência registrada ainda".

**Example 2 — full assessment, first action plan.** 42/42 answered; open: 2 Crítico, 4 Alto, 6 Médio, 2 Baixo; all 6 Crítico/Alto have actions; 10 actions, 2 overdue; nothing closed.
A = 100 · B = 100 × (1 − (24 + 24 + 18 + 2)/250) = 100 × (1 − 68/250) = **72.8** · C = 0.5×100 + 0.5×80 = **90** · D = 0.
Score = 15 + 36.4 + 18 + 0 = **69 (Organizado)**. Top reducers: the 2 Críticos (12 each), then "2 ações atrasadas", then "Nenhuma evidência".

**Example 3 — one month later.** 1 Crítico closed with evidence; 2 Altos closed (1 with evidence); open: 1 Crítico, 2 Alto, 6 Médio, 2 Baixo, all Crítico/Alto with actions; 10 actions: 5 done (4 with evidence), none overdue.
A = 100 · B = 100 × (1 − (12 + 12 + 18 + 2)/250) = **82.4** · C = 0.5×100 + 0.5×100 = **100** · D = 100 × (2 + 4)/(3 + 5) = **75**.
Score = 15 + 41.2 + 20 + 11.25 = **87 (Maduro)**; delta **+18** vs Example 2. Explanation: "+ 1 risco crítico resolvido com evidência", "+ 5 ações concluídas", "− 1 risco alto resolvido sem evidência".

---

## HANDOFF TO ORCHESTRATOR

**STATUS:** NEEDS_REVIEW
**DECISION:** Adopt the four-factor model (0.15 / 0.50 / 0.20 / 0.15), P×I severity weights 12/6/3/1, honest ceiling 85 without evidence, snapshots with `score_version`.
**RATIONALE:** Every number traces to a record; the formula fits on one screen; evidence and execution cannot be bypassed.
**EVIDENCE:** Worked examples computed by script (`max_penalty` 250/120 from the v1 question impacts).
**ASSUMPTIONS:** Template v1 impacts as drafted; `Resolvido`/`Aceito` as closed statuses (Engineering to align with the Risk state machine).
**RISKS:** Band labels or the "% controlado" copy being read as legal claims (Researcher gate); weights perceived as arbitrary if not shown (mitigated by the payload); MaxPenalty must be recomputed per template version.
**DEPENDENCIES:** Compliance Researcher (naming/bands/copy); Senior Software Engineer (state machine, snapshot cadence, timezone); UX/UI Engineer (breakdown layout on Visão geral).
**NEXT STEP:** Researcher review of §5 wording; then D10 can move from PENDING to DEFAULT.
