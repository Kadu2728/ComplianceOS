# COMPLIANCE OS — CONTROL LAYER EVOLUTION (Phase 11)

Owner: Orchestrator (main session), with the Product Strategist, Compliance Researcher, UX/UI Engineer,
Senior Software Engineer and QA & Security roles played inline. Status: applied as DEFAULT decisions
D27–D34 in `docs/decisions.md`; the user's brief of 2026-09-15 is the explicit instruction that
authorizes this evolution (source-of-truth level 1). Nothing here is a legal claim.

## 1. Diagnosis of the domain as it exists (verified in code, not in docs)

| Concept | Where it lives today | Verdict |
|---|---|---|
| Organization, User, Membership, roles, tenant isolation (composite FKs, 404 on foreign ids) | `models/organization.py`, `membership.py`, `core/permissions.py`, `api/deps.py`, `tests/test_tenancy.py` (40 routes × 2) | Solid. Every new tenant-owned table follows the `(organization_id, id)` pattern. |
| Assessment (template versions, 42 questions, derivation rules) | `models/assessment.py`, `services/assessment.py`, `content/assessment_v1.json` | Solid, but it is the **only** source of risk intelligence: answers → risks. No organizational context. |
| Risk (P × I → severity, source, `suggested_action`, `expected_evidence`, treatment, owner) | `models/domain.py`, `services/domain.py` | Solid. The remediation hint is text on the risk; nothing turns it into an action, nothing represents the *control* that mitigates the risk. |
| Action (owner, due date, state machine, `risk_id`) | same | Solid. No effort, no link to a control. |
| Evidence (note/link/file/document, on risk or action) | same, `api/v1/evidence.py` | Solid upload pipeline. No validity, no context beyond risk/action. |
| Document (derived status, one file, citation as evidence) | `models/document.py`, `services/documents.py` | Solid. Not linked to the control it formalizes. |
| Score v1 (A/B/C/D, snapshots, reducers, next steps) | `services/score.py` | Explainable and pinned by tests. Has no notion of controls. |
| Overview (`/overview`), filters, reminders, audit, CSP | Phases 6–10 | Solid operational surface. Reactive: counts, not "what needs attention and why". |
| Control | — | **Absent** (D5 default: "no Control entity in v1"). The brand grammar Risk → Control → Action → Evidence is therefore not representable. |

## 2. Gap map against the strategic differentiators

| # | Differentiator | Status today | Decision for this phase |
|---|---|---|---|
| 1 | Risk Brain | Answers → risks only | **Foundation now**: organization profile (D28) feeding prioritization, radar and agent context. Assessment content stays universal (no legal branching). |
| 2 | Risk-to-Action Engine | `suggested_action` text; manual action creation | **Implement now** (D29): recommendation per risk + one-click plan (control link + action with owner/due date). |
| 3 | Control Graph | Absent | **Implement now** (D27): `Control` entity, `risk_controls`, action/evidence/document links, navigable UI. |
| 4 | Compliance Agent | Absent | **Foundation now** (D32): context bundle + deterministic answers to the canonical questions, no LLM, guardrails documented. |
| 5 | Risk Radar | Counters on `/overview` | **Implement now** (D30): computed attention items with reasons and deep links; "what needs attention today" on the overview. |
| 6 | Control Score | Score v1 | **Evolve now** (D31): v2 adds a Controles factor; snapshots keep their version; "what gets me to N" through per-action score gain. |
| 7 | Compliance DNA | Absent | v1 = organization profile (D28); the "DNA" grows as more context is used by the engine. |
| 8 | Compliance Autopilot | — | Future: needs LLM decision (D35) and usage data. |
| 9 | Evidence Vault | Evidence without validity/context | **Partial now** (D34): validity + control link + derived status; radar surfaces expired/expiring evidence. |
| 10 | Company Control Room | Overview | **Evolve now**: overview restructured around Radar + priorities + score (no new page). |
| 11 | CEO Mode | — | **Foundation now** (D33): `executive-summary` endpoint + `/resumo` page. |
| 12 | Compliance Room | — | **Design only** (D33): permissions reserved, data boundaries documented, no public surface. |
| 13 | Continuous loop | Assessment reopen | Represented by radar + reminders; documented. |
| 14–23 | Benchmarking, maturity map, executive brief, audit mode, timeline, change detection, one-click review, network, learning engine | — | Future. Control timeline = audit entries per control (available now). Change detection needs persisted radar snapshots (later). |

## 3. Smallest change set (architecture before UI)

New entities: `OrganizationProfile` (1:1), `Control` (tenant-owned), `RiskControl` (M:N). Evolved
entities: `Action` (+`control_id`, +`effort`), `Evidence` (+`control_id`, +`valid_until`). No new
entity for Process/Asset/DataAsset/ControlRequirement/MonitoringEvent — their information is captured
as profile lists (`processes`, `systems`, `data_categories`) until a real workflow needs rows.

Every new table follows the composite-FK tenant pattern, joins the cross-tenant fixture, uses the
permission matrix (`control.*` mirrors `risk.*`), writes audit entries in the same transaction and
triggers score snapshots.

## 4. What this phase deliberately does not do

- No LLM call, no chatbot UI (D32 keeps the agent deterministic; provider/region is a pending decision).
- No public Compliance Room (D33 reserves the boundaries; a shareable surface needs D13 and a threat model).
- No change to assessment questions or regulatory content (F1–F5 still pending human legal review).
- No backfill of controls for existing organizations: the plan endpoint creates them on demand,
  one risk at a time, always by a person.
