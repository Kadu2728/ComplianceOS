# COMPLIANCE OS — DECISION RECORDS

Authority: item 6 in the source-of-truth hierarchy (`.claude/CLAUDE.md §2`).

This file records product, architecture, security, compliance and process decisions that cannot be derived from the code. Every entry has a status. Nothing marked `PENDING` may be treated as decided. Nothing marked `DEFAULT` was explicitly chosen by the user — it is the Orchestrator's recommended default, applied so work can proceed, and reversible until the phase that depends on it starts.

Statuses:

- `DECIDED` — explicitly approved by the user.
- `DEFAULT` — Orchestrator recommendation applied provisionally; user may override.
- `PENDING` — no decision exists; the listed phase is blocked until it does.
- `SUPERSEDED` — replaced by a later entry.

Format for new entries: Decision / Status / Class / Blocks / Owner / Reason / Alternatives / Trade-offs / Date.

Origin of D1–D25: Initial Diagnostic §18 (2026-09-11).

---

## Index

| # | Decision | Status | Class | Blocks |
|---|---|---|---|---|
| D1 | Make governance operational (`.md`, frontmatter, environment rules) | DECIDED | BLOCKER | Everything |
| D1b | Fate of global agents in `~/.claude/agents/` | PENDING | MEDIUM | — (mitigated by CLAUDE.md §25A) |
| D2 | Git repository + monorepo layout | DECIDED (git) / DEFAULT (layout) | BLOCKER | Foundation |
| D3 | Org context in API + token transport + domain topology | DEFAULT (applied Phase 2): path `/api/v1/orgs/{org_id}`; httpOnly SameSite=Lax cookies; access 15 min / refresh 30 d rotating with reuse detection; Origin check on unsafe methods; prod domain still PENDING | BLOCKER | Auth / Tenancy (Phase 2) |
| D4 | `RiskAction` × `Task` → single `Action` entity | DEFAULT (applied Phase 3): single `Action`, nullable `risk_id` | BLOCKER | Core domain (Phase 3) |
| D5 | `Control`: entity, derived, or out of v1 | DEFAULT (applied Phase 3): no `Control` entity in v1; revisit after assessment content | BLOCKER | Assessment, Score |
| D6 | Assessment v1 content strategy + assessment → risk rule | DEFAULT (applied Phase 4): v1 content seeded from `assessment-v1-scope.md §13` as template `lgpd-smb` v1 with `last_verified` NULL; regulatory basis hidden in the product until human legal review; derivation nao→P3 / parcial→P2 / nao_sei→P2+uncertain, one risk per question, `sim` sends to review. Legal review still PENDING | BLOCKER | Assessment, Risk, Score |
| D7 | UI language | DEFAULT: pt-BR | HIGH | First component |
| D8 | Permission matrix role × resource × action | DEFAULT (applied Phase 2 as data in `app/core/permissions.py`) | HIGH | Tenancy |
| D9 | `Evidence` × `Document` relationship | DEFAULT (applied Phase 3): `Evidence` = note / link / file attached to a Risk or an Action. Phase 7 (D26): a Document is a fourth evidence kind (`document_id` citation), never the other way around | HIGH | Core domain |
| D10 | Score v1 formula, weights, public name, versioning | DEFAULT (applied Phase 5): four factors 0.15/0.50/0.20/0.15, severity weights 12/6/3/1, MaxPenalty from answered applicable questions, `score_version=v1`, snapshots on every trigger; UI name "Score de Compliance" + subtitle "indicador de maturidade"; band labels Inicial / Em estruturação / Organizado / Maduro pending legal-language review (F5) | HIGH | Score |
| D11 | Transactional e-mail provider | PARTIAL (Phase 9): `EmailSender` abstraction; console (dev), capture (tests), SMTP adapter for production (any relay); the vendor choice is PENDING | HIGH | Auth (reset, invites) |
| D12 | Storage/database provider and region; international transfer analysis | PARTIAL: dev/test use embedded PostgreSQL 16 (`pgserver`, no Docker); S3-compatible storage backend implemented (Phase 9); production DB/storage provider and region PENDING + legal review (Res. 19/2024, sources-v1.md B4) | HIGH | Evidence; beta |
| D13 | Compliance OS's own terms and privacy documents | PENDING | HIGH | Beta |
| D14 | Text-safe variants of semantic colors; Text Muted usage | DEFAULT (values in docs/design/tokens.md §2) | HIGH | Design tokens |
| D15 | Logo asset (SVG) | PENDING (interim text wordmark + reserved 24px slot, app-shell.md §3) | HIGH | Favicon; marketing |
| D16 | Dark mode in MVP | DEFAULT: no | MEDIUM | Design system |
| D17 | API host (Railway vs Render, then free-tier options) | DECIDED (2026-09-17, amended): two supported topologies with the same image — **A (default, free beta): Koyeb free instance + Neon Free (`aws-us-east-1`) + Backblaze B2 + free SMTP tier + GitHub Actions daily job**; **B (paid): Render blueprint** (`render.yaml`, Ohio, cron + PostgreSQL). Vercel for the web (`gru1`) in both. Data-in-Brazil pair (Cloud Run `southamerica-east1` + Neon `sa-east-1`) documented for when the D12 legal review requires it | MEDIUM | Deploy |
| D18 | Pinned major versions | DEFAULT | MEDIUM | Foundation |
| D18a | Next 15 → 16 (postcss advisory bundled in Next 15) | PENDING | LOW | — (revisit before Phase 3) |
| D19 | IDs, delete strategy, pagination, error envelope, API versioning | DEFAULT | MEDIUM | Modeling / API |
| D20 | Test stack | DEFAULT | MEDIUM | Foundation |
| D21 | Source-of-truth hierarchy alignment | DECIDED | MEDIUM | Governance |
| D22 | Framer Motion in MVP | DEFAULT: no | LOW | Polish |
| D23 | Rate-limit store | DEFAULT | LOW | Auth |
| D24 | Observability provider | PENDING | LOW | QA |
| D25 | Beta billing | DEFAULT: manual | LOW | Beta |
| D26 | Documents v1 model | DEFAULT (applied Phase 7): own entity with derived status (review state + validity, 30-day expiring window), one current file replaced on upload (history = audit log), tags as JSONB, citation as evidence kind `document` with RESTRICT delete; no Documents factor in the score; templates/reminders/version table deferred | HIGH | Documents |
| D27 | Control entity and Control Graph (supersedes D5) | DEFAULT (applied Phase 11): tenant-owned `Control` with catalogue `template_code`, maturity status ladder, owner, formalizing document; `risk_controls` M:N; `actions.control_id`, `evidence.control_id` | HIGH | Control Graph, Score v2 |
| D28 | Organization profile (Compliance DNA v1) | DEFAULT (applied Phase 11): 1:1 `organization_profiles` with segment, headcount band, customer type, data categories, enterprise sales, international transfers, systems, processes; used by prioritization, radar and agent context — never to assert obligations | HIGH | Risk Brain |
| D29 | Risk-to-Action engine v1 | DEFAULT (applied Phase 11): recommendation per risk (catalogue control + suggested action + default due date by severity + expected evidence) and one-click `POST /risks/{id}/plan` | HIGH | Risk-to-Action |
| D30 | Smart prioritization and Risk Radar | DEFAULT (applied Phase 11): explainable priority per pending action (severity × exposure × urgency ÷ effort, plus simulated score gain); radar = live attention items with reasons; no persistence | HIGH | Control Room |
| D31 | Score v2 (Controles factor) | DEFAULT (applied Phase 11): A 0.10 · B 0.40 · K Controles 0.20 · C 0.15 · D 0.15; `score_version=v2`; v1 snapshots untouched; per-action score gain by simulation | HIGH | Score |
| D32 | Compliance Agent foundation | DEFAULT (applied Phase 11): deterministic, context-bundled answers to a fixed question set; no LLM; guardrails in `docs/ai.md`; provider/region decision pending (D35) | MEDIUM | Agent |
| D33 | Executive summary (CEO mode) and Compliance Room boundaries | DEFAULT (applied Phase 11): `GET /executive-summary` + `/resumo`; Compliance Room designed, permissions reserved, not exposed (implemented in D36) | MEDIUM | CEO mode; Room |
| D34 | Evidence Vault v1 | DEFAULT (applied Phase 11): `evidence.valid_until` + derived status (vigente/vencendo/vencida), `evidence.control_id`; upload rules unchanged | MEDIUM | Evidence |
| D36 | Compliance Room v1 (shareable surface) | DECIDED (2026-09-17, user request): one room per organization, disabled by default; per-record `shared_in_room` flags on documents and controls (faltante documents and non-implemented controls refused); time-boxed links (1–90 days, token hashed, shown once, revocable, ≤ 20 active); anonymous visitor endpoint answering 404 for every failure mode, rate-limited, `no-store` + `noindex`; every view and download audited; owner-only management (`room.manage`); preview = visitor payload. Threat model in `docs/security/compliance-room-threat-model.md`. Legal review of visitor-facing copy (D13) before real customers | HIGH | Compliance Room |
| D35 | LLM provider, region and data boundary for the Compliance Agent | DECIDED (2026-09-17, user request): Anthropic Claude through the official SDK, model `claude-opus-5` by default (configurable), off unless `LLM_PROVIDER=anthropic`; the model receives only the D32 bundle (+ one focused record); answers are JSON, grounded to bundle refs, claim-filtered; every question audited; per-user and per-organization rate limits; deterministic fallback | MEDIUM | Agent (LLM layer) |

---

## D1 — Make governance operational

- **Status:** DECIDED (user authorized Phase 0 on 2026-09-12)
- **Class:** BLOCKER
- **Decision:** Governance files renamed from `.md.txt` to `.md`; the seven agent files received YAML frontmatter (`name`, `description`, `tools`); `.claude/CLAUDE.md` gained §25A (execution-environment rules) and ownership clarifications in §25; the Orchestrator file gained "How this role is executed".
- **Reason:** Claude Code only auto-loads `.claude/CLAUDE.md` and only registers agents with frontmatter. Before this, no session loaded the governance and no project agent was invokable.
- **Trade-offs:** None. Content of the governance files was preserved; only additions and the §2 alignment (D21) were made.
- **Verified 2026-09-12:** a new session listed all seven project agents as available (D1 confirmed operational). Line endings normalized to LF; `.gitattributes` enforces it.

## D1b — Fate of global agents

- **Status:** PENDING (user decision; Orchestrator cannot delete files outside the project)
- **Class:** MEDIUM
- **Context:** `~/.claude/agents/` contains `backend-senior`, `frontend-senior-uxui`, `database-architect`, `devops-engineer`, `code-reviewer` (dated 2025-06-25). They are not governed by this project.
- **Options:** (a) delete them; (b) keep them for other projects and rely on `CLAUDE.md §25A` to exclude them from Compliance OS work; (c) rewrite them to read this project's governance.
- **Recommendation:** (b). Already mitigated by §25A.

## D2 — Git repository + monorepo layout

- **Status:** git init → DECIDED (Phase 0). Layout → DEFAULT.
- **Class:** BLOCKER
- **Default layout:**

```
Compliance OS/
├── .claude/          governance (CLAUDE.md, brand-system.md, agents/)
├── docs/             decisions.md, regulatory/, architecture.md (later), product.md (later)
├── apps/
│   ├── web/          Next.js 15 (frontend)
│   └── api/          FastAPI (backend)
└── .gitignore
```

- **Reason:** One repository keeps the OpenAPI → TypeScript client generation, CI and decision records in one place. No monorepo tooling (Turborepo/Nx) in the MVP — plain folders.
- **Alternatives:** Two repositories (rejected: contract drift, duplicated CI); single Next.js full-stack (rejected: stack already decided in CLAUDE.md §12).
- **First commit:** not made — commits are made only on explicit user request.

## D3 — Org context, token transport, domain topology

- **Status:** PENDING
- **Class:** BLOCKER for Phase 2 (Auth / Tenancy)
- **Recommendation:**
  - Organization selected by path: `/api/v1/orgs/{org_id}/...`. The `org_id` is a selector, never trusted: a FastAPI dependency resolves `(user from JWT) + (org from path) → Membership` and fails closed with 404.
  - Access token ≈15 min + refresh token rotated on every use, reuse detection, both in `httpOnly; Secure; SameSite=Lax` cookies set by the API domain.
  - App and API on subdomains of the same registrable domain (`app.` / `api.`) so cookies are same-site. Requires a domain decision.
  - `localStorage` for tokens is rejected.
- **Why it blocks:** CSRF posture, CORS config, cookie flags and the tenant dependency all depend on this.

## D4 — `RiskAction` × `Task`

- **Status:** PENDING
- **Class:** BLOCKER for Phase 3
- **Recommendation:** One entity `Action` (`actions` table, `/actions` routes, UI "Actions / Ações" per brand-system §55) with nullable `risk_id`. Drop `RiskAction`.
- **Reason:** No document defines a difference between the two; brand naming says "Actions"; a single execution unit keeps the Risk → Action → Evidence chain simple.

## D5 — `Control`

- **Status:** PENDING
- **Class:** BLOCKER for Assessment modeling and Score
- **Context:** Brand grammar (Risk → Control → Action → Evidence) and the Score dimension "Controls" reference a concept that is not in the CLAUDE.md §22 entity list.
- **Options:** (a) `Control` as a global catalog entity mapped to questions and risks; (b) derive "controls" from assessment questions without an entity; (c) exclude "Controls" from Score v1 and revisit.
- **Recommendation:** (c) for Score v1; (a) as SHOULD once the assessment content exists, because the catalog is produced by the Compliance Researcher anyway.

## D6 — Assessment v1 content and assessment → risk rule

- **Status:** DEFAULT applied in Phase 4 (2026-09-12): the 42-question draft in `docs/product/assessment-v1-scope.md §13` was published as template `lgpd-smb` version 1 (`apps/api/app/content/assessment_v1.json`) with `last_verified = NULL`. Because the version is unverified, the product hides every regulatory basis and shows the disclaimer “não é uma avaliação jurídica”. Human legal review (F1–F5 in `docs/regulatory/sources-v1.md`) remains PENDING; its outcome becomes version 2 of the template, never an in-place edit.
- **Class:** BLOCKER for Phase 4 (Assessment), and therefore Risk generation and Score
- **Owners:** Product Strategist (scope, short mode, sections), Compliance Researcher (source per question, classification law/resolution/guide/practice, verification date), UX/UI Engineer (final wording, help text), human legal review (gate).
- **Deliverable:** `docs/regulatory/assessment-v1.md` (or structured equivalent) containing, per question: objective, risk evaluated, source, classification, expected answer, expected evidence, derived risk (title, category, default probability/impact), remediation action, confidence, last verified.
- **Rule:** No question enters the seed without a source. No deadline is hard-coded in code.

## D7 — UI language

- **Status:** DEFAULT: pt-BR (applied in Phase 1; user did not object when authorizing the phase)
- **Class:** HIGH — blocks the first component
- **Recommendation:** pt-BR as the only UI language in the MVP; all strings centralized (no hard-coded literals in components) so EN can be added later. Dates in `America/Sao_Paulo`, stored in UTC.

## D8 — Permission matrix

- **Status:** PENDING
- **Class:** HIGH — blocks Tenancy
- **Recommendation (starting point, to be confirmed):**

| Resource / action | OWNER | ADMIN | MEMBER | VIEWER |
|---|---|---|---|---|
| Organization settings, delete org | ✓ | – | – | – |
| Members: invite, change role, remove | ✓ | ✓ (not OWNER role) | – | – |
| Assessment: start, answer, complete | ✓ | ✓ | ✓ | – |
| Risk: create, edit, change status | ✓ | ✓ | own (assigned) | – |
| Action: create, edit, change status | ✓ | ✓ | own (assigned) | – |
| Evidence/Document: upload | ✓ | ✓ | own (assigned) | – |
| Evidence/Document: delete | ✓ | ✓ | – | – |
| Read risks, actions, documents, score, overview | ✓ | ✓ | ✓ | ✓ |
| Read audit log | ✓ | ✓ | – | – |
| Read member list (names/roles) | ✓ | ✓ | ✓ | ✓ (no e-mails) |

Implemented as data (a single table/enum map), not as scattered conditionals.

## D9 — `Evidence` × `Document`

- **Status:** PENDING
- **Class:** HIGH — blocks Phase 3
- **Recommendation:** `Evidence` = attachment, link or note attached to an `Action` or `Risk` (MVP MUST). `Document` = managed file with validity/version/status in the Documents module (SHOULD). `Evidence` may reference a `Document`. Document statuses `Expiring`/`Expired` are derived from `valid_until`, never stored as editable state. `Missing` requires a `DocumentRequirement` concept (SHOULD).

## D10 — Score v1

- **Status:** DEFAULT applied in Phase 5 (2026-09-13) as proposed in `docs/product/score-v1-proposal.md`, with two engineering refinements recorded here: (1) MaxPenalty is computed from the questions actually answered and applicable (N/A excluded) instead of the whole template, so B stays relative to what is known and an all-N/A assessment yields "—" rather than a division by zero; (2) `top_reducers` are aggregated reasons ranked by the score points they cost today (the proposal ranked items by severity weight) — the "no evidence" hint therefore legitimately ranks above individual risks when D = 0. Public name kept as "Score de Compliance" (brand §55) with the subtitle "indicador de maturidade"; the brand copy "Seu compliance está 74% controlado" is **not** used. Band labels remain subject to human legal review (sources-v1.md F5).
- **Class:** HIGH — blocks Phase 5
- **Recommendation:** deterministic function of (a) assessment completeness, (b) open risks weighted by severity, (c) overdue actions, (d) evidence on critical risks. No "Controls" or "Documents" dimension in v1 (see D5). Output = score + ordered list of factors with numeric contribution. Persist `ScoreSnapshot(score, breakdown, score_version, computed_at)` on every recalculation so trends are possible. Public name to be reviewed by the Compliance Researcher ("Compliance Score" vs "maturity score"). "No assessment" is an empty state, not a score of 0.

## D11 — E-mail provider

- **Status:** PARTIAL — adapter done (Phase 9, 2026-09-13), vendor PENDING
- **Class:** HIGH — blocks password reset and invitations (Phase 2)
- **Note:** This dependency is absent from all governance files. Any transactional provider works; abstract behind one interface.
- **Phase 9:** `SmtpEmailSender` delivers through any provider's SMTP relay (STARTTLS/SSL/none, optional credentials); production refuses to start without `EMAIL_PROVIDER=smtp`. A delivery failure returns `503 email_unavailable` and rolls the invitation/reset back. Choosing the vendor (deliverability, DKIM/SPF on the sending domain, region of the provider's logs) remains the user's decision; no code change is needed for a vendor with SMTP, an HTTP-API-only vendor would add a second adapter.

## D12 — Providers, regions, international transfer

- **Status:** PENDING
- **Class:** HIGH — blocks Evidence storage and beta
- **Environment fact (2026-09-12):** the development machine has no Docker and no local PostgreSQL. Phase 1 therefore runs without a database (health endpoint + offline Alembic baseline). Phase 2 requires a Neon (or equivalent) connection string supplied by the user before any migration runs.
- **Note:** Neon/S3/Vercel regions may be outside Brazil. Whether this constitutes an international transfer under LGPD and what it requires is a **legal question** — requires human legal validation, not a technical default.
- **Phase 9 (2026-09-13):** `S3Storage` implements the storage protocol for any S3-compatible provider (AWS S3, Cloudflare R2, Backblaze B2, MinIO…) with private objects and a configurable endpoint/region; verified with moto, not against a real bucket. The provider and region choice — and therefore the transfer analysis — is still pending.

## D13 — Compliance OS's own legal documents

- **Status:** PENDING
- **Class:** HIGH — blocks beta with real customers
- **Note:** Privacy policy, terms of use and data-processing clauses for Compliance OS as an operator of customer data. Requires human legal validation.

## D14 — Text-safe semantic colors

- **Status:** DEFAULT — applied 2026-09-12. Computed values (WCAG 2.x): info-text #3264D9, success-text #207C52, warning-text #8F6721, danger-text #B44A4A; tints at 10% on white; all -text ≥ 4.6:1 on Off-white, White and their tint. Destructive button background uses danger-text (#B44A4A) so white text reaches 5.23:1. User may override; the official hex values remain the fills.
- **Class:** HIGH — blocks design tokens
- **Context:** Approximate WCAG 2.x contrast on Off-white `#F4F4F0`: Electric Blue 4.4:1, Text Muted 4.0:1, Danger 3.5:1, Success 2.9:1, Warning 2.2:1 — all below 4.5:1 for normal text. To be confirmed with a tool.
- **Recommendation:** keep official colors for fills, icons and large text; define darker "text" variants per semantic color for badges/labels; use Text Secondary instead of Text Muted for Label (12px) and Caption (11px); underline links. This is a design-system extension, not a brand change (brand-system §75).

## D15 — Logo asset

- **Status:** PENDING
- **Class:** HIGH — blocks UI shell and favicon
- **Note:** brand-system §7 refers to an existing approved logo; no file exists in the repository.

## D16 — Dark mode

- **Status:** DECIDED (2026-09-16, user request)
- **Class:** MEDIUM
- **Decision:** Light, Dark and System themes are part of the product design system. The user choice is
  saved locally in the browser; System follows `prefers-color-scheme`. Theme colors are semantic
  tokens, never page-specific values. Reduced motion remains a system preference.
- **Reason:** Accessibility and individual working conditions are explicit product requirements.
- **Values:** brand §10 dark neutrals verbatim; semantic dark variants are D14-style extensions with contrast figures in `docs/design/tokens.md` §8; primary button hover/active are not overridden in dark (white text must stay ≥ 4.5:1); core brand colors are never overridden. Preference is per browser (`localStorage`), applied before paint by a nonce-carrying inline script; not an account setting until a user asks for it to follow them across devices.

## D17 — Railway vs Render

- **Status:** DECIDED (2026-09-17, user request "siga com o deploy").
- **Class:** MEDIUM
- **Decision:** Render for the API. Reasons: a reviewable infrastructure file (`render.yaml` —
  service, cron job and database in one blueprint applied from the repository), native Docker
  deploys, health-checked zero-downtime releases, a managed PostgreSQL 16 in the same region, cron
  jobs from the same image (the reminders digest). Railway offers the same runtime but its
  configuration is UI-first; neither has a Brazilian region. Web on Vercel (account exists; `gru1`
  São Paulo functions; root directory `apps/web`). Region Ohio for API + database (closest to
  Brazil; keep both together — the app issues several queries per page).
- **Artifacts:** `apps/api/Dockerfile` (uv, no dev deps, non-root, healthcheck),
  `apps/api/docker-entrypoint.sh` (migrate → seed content → uvicorn with proxy headers; arguments
  run a job instead), `render.yaml`, `apps/web/vercel.json`, CI job `image` (build, boot against
  PostgreSQL, run the job, prove the production guard refuses an incomplete configuration),
  `docs/deploy.md` runbook. Settings: `DATABASE_URL` normalized from `postgres://` to
  `postgresql+psycopg://`; production refuses to start without S3 storage or a database URL; HSTS
  in production.
- **Residency:** documented alternative Fly.io (`gru`) + Neon (`sa-east-1`) with the same image if
  the D12 legal review demands data at rest in Brazil. D12 (provider/region + legal review), D11
  (SMTP vendor) and D3 (production domain) remain the user's calls; the runbook lists them.
- **Not automated:** account creation, secrets and payment details (typed by a person in each
  dashboard).
- **Amendment (same day, user: "o Render está sendo pago, vamos por outra alternativa"):** Render
  no longer has a free tier, so the default topology becomes the zero-cost one — **Koyeb** free
  instance (Docker from the repository, Washington D.C., scales to zero after 1 h idle), **Neon**
  Free PostgreSQL (`aws-us-east-1`, direct connection string), **Backblaze B2** (10 GB, S3 API, no
  card), **Brevo/Resend** free SMTP, and the daily digest as a **GitHub Actions** scheduled workflow
  (`.github/workflows/reminders.yml`, gated by the repository variable `REMINDERS_ENABLED`). Koyeb
  was chosen over Fly.io/Railway because it is the only one still offering an always-available free
  web instance for a Docker image without a mandatory paid plan; the trade-off is the cold start
  after idle. The Render blueprint stays as the paid path; both share image, entrypoint and
  environment (`docs/deploy.md`).

## D18 — Pinned major versions

- **Status:** DEFAULT (recorded in `CLAUDE.md §12`)
- **Class:** MEDIUM
- **Decision:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui current, Python 3.12, FastAPI current, SQLAlchemy 2.x, Pydantic v2, Alembic 1.x, PostgreSQL 16.
- **Reason:** Neutralizes environment skills that force other versions; current LTS-grade majors.

## D18a — Next.js 15 vs 16

- **Status:** PENDING (user decision; changes D18)
- **Class:** LOW today, rises as frontend code accumulates
- **Context (2026-09-12):** `npm audit` on the scaffold reports postcss <= 8.5.22 (GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849, GHSA-qx2v-qp2m-jg93), bundled inside Next 15.5.25 (latest 15.x). The only upstream fix is Next 16.3.5 (major). Exposure is build-time only and requires attacker-controlled CSS/sourcemaps; Compliance OS processes no user CSS, so the practical risk is low.
- **Trade-off:** Migrating now costs almost nothing (no product code on Next 15 yet); migrating later costs more. Against: Next 16 changes defaults (Turbopack, caching, proxy/middleware naming) that the team has not exercised.
- **Recommendation:** decide before Phase 3 (first real UI). If undecided by then, stay on 15 and re-audit at each phase gate.

## D19 — IDs, delete strategy, pagination, errors, API version

- **Status:** DEFAULT
- **Class:** MEDIUM
- **Decision:** UUID primary keys; hard delete + audit log in MVP (soft delete only where a product need appears); offset pagination with `limit ≤ 50`; single error envelope `{code, message, details?, request_id}`; all routes under `/api/v1`; 404 (not 403) for resources outside the caller's tenant.

## D20 — Test stack

- **Status:** DEFAULT
- **Class:** MEDIUM
- **Decision:** pytest (API), vitest (web unit), Playwright (e2e). Cross-tenant isolation fixture is written in Phase 2 before any domain entity.

## D21 — Source-of-truth hierarchy alignment

- **Status:** DECIDED (Phase 0)
- **Class:** MEDIUM
- **Decision:** `CLAUDE.md §2` and `orchestrator.md §2` now carry the same 8-level order; documented decisions rank above existing implementation; official legal sources override every repository document for legal facts.

## D22 — Framer Motion

- **Status:** DEFAULT: not in MVP bundle
- **Class:** LOW
- **Reason:** brand-system §36 prefers CSS; MVP motion (status transitions, progress, score change) is achievable with CSS transitions.

## D23 — Rate-limit store

- **Status:** DEFAULT: in-memory or database-backed in MVP (single instance)
- **Class:** LOW

## D24 — Observability provider

- **Status:** PENDING
- **Class:** LOW
- **Note:** Request IDs propagated Next → FastAPI → logs from Phase 1 regardless of provider.

## D25 — Beta billing

- **Status:** DEFAULT: manual (no billing code in MVP, per CLAUDE.md §5)
- **Class:** LOW

---

## D26 — Documents v1

- **Status:** DEFAULT applied in Phase 7 (2026-09-13)
- **Class:** HIGH — CLAUDE.md §4 lists Document Management in V1 (SHOULD in the diagnostic)
- **Decision:** a `Document` is the organization's own artifact with responsible, version label, validity and tags. Its status (Atualizado · Vencendo · Vencido · Faltante · Em revisão) is **derived** from `review_state` + `valid_until` at read time, so nothing goes stale; "Faltante" is a placeholder for an expected document that does not exist yet. One current file (or an external link); each upload replaces it and the audit log keeps the history. A document is cited as evidence on risks/actions through `Evidence.kind = document` (D9 stays: evidence hangs off risks and actions) and cannot be deleted while cited.
- **Rejected for v1:** a version table (audit log suffices until customers ask for diffs), a Documents dimension in the score (D10 keeps four factors; a document only counts when cited as evidence), seeding "expected documents" from assessment content (needs the Compliance Researcher's per-question mapping first), expiry reminders (needs the e-mail provider, D11).
- **Alternatives considered:** modelling documents as evidence records (rejected: no validity/responsible lifecycle); storing status (rejected: hidden state that drifts from the calendar).

## D27 — Control entity and Control Graph

- **Status:** DEFAULT applied in Phase 11 (2026-09-15); supersedes the D5 default ("no Control entity in v1").
- **Class:** HIGH — the brand grammar Risk → Control → Action → Evidence (brand §4, §24) and the user's brief of 2026-09-15 require a first-class control.
- **Decision:** `controls` is tenant-owned (composite-FK pattern): title, description, `category` (same enum as risks), `kind` (preventivo · detectivo · corretivo), `status` as the maturity ladder planejado → parcial → implementado → verificado (+ inativo), `owner_membership_id`, `document_id` (the policy/procedure that formalizes it, SET NULL), `review_date`, `template_code` (key in the versioned catalogue `app/content/controls_v1.json`). `risk_controls` links risks and controls (M:N, both composite FKs, unique pair). `actions.control_id` (an action implements or improves a control) and `evidence.control_id` (evidence proves a control) are optional composite FKs. `verificado` requires at least one evidence linked to the control (service rule).
- **Permissions:** `control.read` all; `control.create` / `control.update_any` / `control.delete` / `control.link` managers; `control.update_assigned` contributors (the control's owner cannot reassign).
- **Rejected:** a global `control_templates` table (the catalogue is content, versioned in JSON like the assessment before it had customers); Process/Asset entities (captured as profile lists until a workflow needs rows); automatic control creation on assessment completion (a person plans a risk; the engine recommends).
- **Impact:** migration 0008; Score v2 (D31); demo dataset gains controls; 6 routes join the cross-tenant fixture.

## D28 — Organization profile (Compliance DNA v1)

- **Status:** DEFAULT applied in Phase 11 (2026-09-15).
- **Class:** HIGH — first organizational context the engine can use (brief §5–§6).
- **Decision:** `organization_profiles` (1:1, created lazily): `segment`, `headcount_band`, `customer_type`, `data_categories` (JSONB list from a fixed set: cadastrais, contato, financeiros, saude, biometricos, criancas_adolescentes, geolocalizacao, comportamentais, credenciais), `sells_to_enterprise`, `international_transfers` (sim · nao · nao_sei), `systems` and `processes` (JSONB lists of short strings, ≤ 20 each), `notes`. Managers edit (`org.update` for owners; admins may edit the profile via `profile.update`), everyone reads.
- **How it is used:** exposure multiplier in prioritization (sensitive/children data → dados/titulares/seguranca risks weigh more; enterprise sales → documentation/evidence weigh more; unknown international transfers → fornecedores weigh more), radar hints ("perfil incompleto"), agent context, executive summary. It **never** decides whether a legal obligation applies (Compliance Researcher §9: qualification is fact-dependent and self-declared); copy says "com base no seu perfil".
- **Rejected:** branching the assessment by profile (content change, needs legal review); free-text-only profile (not usable by the engine).

## D29 — Risk-to-Action engine v1

- **Status:** DEFAULT applied in Phase 11 (2026-09-15).
- **Class:** HIGH — turns "qual é o meu risco?" into "o que eu faço agora?" (brief §8).
- **Decision:** `GET /risks/{id}/recommendation` returns the recommended control (catalogue entry by `origin_question_code`, or by category for manual risks), the recommended action title (`risk.suggested_action`, else the catalogue's action), a default due date by severity (crítico 15 · alto 30 · médio 60 · baixo 90 days — product defaults, not legal deadlines), the expected evidence and whether the risk is already planned. `POST /risks/{id}/plan` applies it in one transaction: reuses the organization's control with the same `template_code` or creates it (status planejado), links it to the risk, creates the action (owner = body.owner or the risk's owner or the actor; due date = body or default) linked to risk and control; audited (`risk.planned`); score recalculated. Idempotent per risk while an open action exists (409 with the existing action).
- **Rejected:** planning every derived risk automatically on assessment completion (floods the action list, removes judgment); AI-generated action text (D32 keeps the engine deterministic; content comes from the reviewed catalogue).

## D30 — Smart prioritization and Risk Radar

- **Status:** DEFAULT applied in Phase 11 (2026-09-15).
- **Class:** HIGH — brief §9–§10, §14.
- **Decision (priority, `services/priorities.py`):** for each pending action: `points = severity_weight(linked risk; 1 without risk) × exposure(profile, category) × urgency × leverage`, where urgency = 1.5 overdue · 1.25 due within 7 days · 1.0 otherwise, leverage = 1/effort with effort baixo 1 · médio 1.5 · alto 2.5 (default médio when unset), exposure ∈ {1.0, 1.25, 1.5}. Each item carries `reasons[]` in pt-BR and `score_gain` = points the score would gain if the linked risk were resolved with evidence (pure `compute()` on a copy of the inputs). Sorted by points desc; ties by due date. Unplanned open crítico/alto risks are listed separately as "planejar" items.
- **Decision (radar, `services/radar.py`):** live attention items grouped by kind, each with count, severity tone, reason and deep link: riscos críticos abertos · riscos críticos/altos sem controle · riscos sem responsável · riscos em revisão · ações atrasadas · ações vencendo em 7 dias · ações bloqueadas · controles implementados sem evidência · evidências vencidas/vencendo · documentos vencidos/vencendo/faltantes · perfil incompleto · diagnóstico desatualizado (> 180 days). No persistence in v1; change detection (diff between days) is future work.
- **Rejected:** ML ranking; persisting radar snapshots now (needs a retention decision).

## D31 — Score v2

- **Status:** DEFAULT applied in Phase 11 (2026-09-15); D10 remains the record for v1.
- **Class:** HIGH.
- **Decision:** five factors — A Diagnóstico 0.10, B Riscos 0.40, K Controles 0.20, C Execução 0.15, D Evidências 0.15. K = coverage of open crítico/alto risks by controls: a risk counts 1.0 with a control `implementado`/`verificado`, 0.5 with only `parcial`, 0 with `planejado`/none; no open high risk → 100. Formulas for A, B, C, D unchanged. `SCORE_VERSION = "v2"`; existing snapshots keep `v1` and are never recomputed; delta compares only same-version snapshots (already the rule), so the first v2 snapshot starts a new trend baseline (the UI says so). Reducers gain `uncontrolled` (risk without control) and next actions gain "associar controle". The band labels are unchanged (still F5).
- **Why the weights:** risk posture still dominates; controls and execution together (0.35) reward structure over declarations; diagnostic completeness drops to 0.10 because it is table stakes once the loop runs.
- **Impact:** engine tests and the demo pin move to v2 values (the tests are updated, not removed).

## D32 — Compliance Agent foundation

- **Status:** DEFAULT applied in Phase 11 (2026-09-15).
- **Class:** MEDIUM.
- **Decision:** `services/agent.py` assembles a structured, tenant-scoped context bundle (profile, score explanation, radar, priorities, top risks, controls state, documents state; audit only for managers) and answers a fixed question set deterministically from that bundle: maiores riscos · o que corrigir esta semana · por que o score mudou · documentos faltando/vencidos · riscos sem ação · riscos sem controle · ações atrasadas · evidências vencendo. Every answer carries `basis` (record refs), `caveat` (operational, not legal) and `computed_at`. Endpoints: `GET /agent/questions`, `GET /agent/answers/{key}`, `GET /agent/context` (managers). No LLM call, no free-text input, no prompt surface. `docs/ai.md` fixes the guardrails a future LLM layer must satisfy (data minimization, no obligation invention, sources, human validation, tenant isolation, logging). Provider, region and data boundary are decision D35 (PENDING).

## D33 — Executive summary and Compliance Room boundaries

- **Status:** DEFAULT applied in Phase 11 (2026-09-15).
- **Class:** MEDIUM.
- **Decision:** `GET /executive-summary` (every role) — score and band, 30-day delta, top exposures (open crítico/alto with owner and plan state), what improved and what worsened in 30 days (from snapshots and audit), decisions needed (blocked actions, unowned high risks, expired documents), next 30-day plan (top priorities). Rendered at `/resumo` (print-friendly, no charts beyond the trend). Compliance Room: reserved permissions `room.manage` (owners) and the data boundary — only records explicitly marked shareable (a future `shareable` flag on controls/documents), never risks or actions by default, never evidence files without an explicit per-file choice, time-boxed links, audit of every view. Not implemented: needs D13 (Compliance OS's own legal documents) and a threat model.

## D34 — Evidence Vault v1

- **Status:** DEFAULT applied in Phase 11 (2026-09-15).
- **Class:** MEDIUM.
- **Decision:** `evidence.valid_until` (optional) with derived status vigente · vencendo (within `DOCUMENT_EXPIRING_DAYS`) · vencida; `evidence.control_id`. Radar and the evidence panel surface expired/expiring evidence. Upload validation, storage keys and download rules are unchanged. Reusable evidence (one file proving several controls) stays a citation pattern: cite a Document.

## D35 — LLM provider, region and data boundary

- **Status:** DECIDED (2026-09-17, user request "Segue com D35").
- **Class:** MEDIUM
- **Provider and model:** Anthropic Claude via the official Python SDK (`anthropic` 1.x), model `claude-opus-5` by default (`LLM_MODEL`), adaptive thinking at `LLM_EFFORT=medium`, structured JSON output, one non-streaming request per question, `max_retries=1`, 45 s timeout. The feature is **off by default**: `LLM_PROVIDER=none` keeps the deterministic agent (D32) only; `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` enables free-text questions and the per-risk explanation.
- **Data boundary:** the model receives exactly the D32 bundle (profile, score explanation, radar, priorities, attention records with ids, controls/documents summaries, activity only for roles with `audit.read`) plus, for a contextual question, one risk record with its controls and open actions. No e-mails, file contents, tokens, member lists or other organizations. Member **names** (owners, actors) are part of the bundle because "who is responsible" is half of the product's value; they are personal data of employees in a professional context and leave the Compliance OS boundary for the provider — an international transfer to be covered by the D13 legal documents and the provider's data-processing terms **before real customers use the feature**. The feature stays off in production until that review is recorded here (Compliance Researcher + human legal review).
- **Region:** Anthropic first-party API (no region pinning in v1). If a customer or the legal review requires in-region inference, `inference_geo` or a Vertex/Bedrock client are provider-level switches inside `core/llm.py` — no product change.
- **Guardrails (implemented, `services/agent_llm.py`, tested):** system prompt states the rules (docs/ai.md §2); output is JSON `{answer, refs, interpretation, out_of_scope}`; refs are kept only when present in the bundle (titles attached server-side); answers matching the forbidden-claim patterns (conformidade garantida, substitui advogado/DPO, cumpre integralmente a LGPD, dispensa revisão jurídica…) are rejected; refusal / truncation / invalid JSON / provider errors degrade to the deterministic answer when the question is canonical, else 503 with a pt-BR message; every question writes `agent.asked` to the audit log (question truncated to 200 chars, outcome, model, token counts, refs count — never the answer); logs carry ids and counters only.
- **Cost and abuse ceilings:** `LLM_USER_MINUTE_LIMIT=6`, `LLM_ORG_HOURLY_LIMIT=60` (in-memory limiter, D23 caveat applies); questions ≤ 500 chars; bundle lists capped at 15 records; `LLM_MAX_OUTPUT_TOKENS=2048`.
- **Not done on purpose:** refusal fallbacks to a second model (beta API surface; a refusal simply degrades — rule 7 of docs/ai.md); streaming (answers are ≤ 180 words); conversation memory (each answer is a fresh computation from today's records — this is not a chatbot, CLAUDE.md §7); document/contract analysis (needs a file-reading boundary and per-file consent; docs/ai.md §4).
- **Reversal cost:** low — `core/llm.py` is the only file that knows the provider; the service and the UI depend on the `LLMProvider` protocol.

## D36 — Compliance Room v1

- **Status:** DECIDED (2026-09-17, user request "Segue com o Compliance Room"). Supersedes the "designed only" state of D33.
- **Class:** HIGH — the first surface that shows customer records to people outside the organization.
- **Product:** the room answers one commercial question — "prove it" (brand §54: "Não basta dizer que sua empresa está preparada. Você precisa conseguir provar."). Contents: organization name, title, an owner-written intro (shown as the organization's own statement), the Compliance Score as a *maturity indicator* (number, band, date; never the factors, reducers or history; never a preliminary score), documents the owner flagged (name, category, version, derived status, validity, file download), controls the owner flagged and currently implementado/verificado (title, description, kind, category, status), an optional institutional contact e-mail, and a fixed caveat. Never: risks, actions, evidence, assessment answers, members, activity, profile.
- **Model:** `compliance_rooms` (1:1 organization; `enabled` default false; `title`, `intro`, `show_score`, `show_controls`, `contact_email`), `room_links` (`token_hash` SHA-256, `label`, `expires_at`, `revoked_at`, `view_count`, `last_viewed_at`, creator), `documents.shared_in_room`, `controls.shared_in_room` (migration 0009, round trip + check clean).
- **Access:** owner only (`room.manage`) for every management endpoint (`GET/PUT /orgs/{id}/room`, `/room/preview`, `PUT /room/documents/{id}`, `PUT /room/controls/{id}`, `POST /room/links` → token once, `DELETE /room/links/{id}`). Visitors: `GET /public/rooms/{token}` and `/public/rooms/{token}/documents/{id}/download` — no session, organization resolved only through the link, 404 for unknown/expired/revoked/disabled, 60 and 30 requests per minute per IP, `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
- **Rules:** nothing shared by default; a faltante document or a control below implementado is refused (409); a control that regresses disappears from the room; the owner's preview is the visitor payload rendered by the same component; the token exists in clear only in the creation response; at most 20 active links; every view and download writes an audit row with the link id and label only.
- **Frontend:** `/sala` (owner; 1 documents → 2 controls → 3 presentation & publish → 4 links), `/sala/previa`, public `/sala/{token}` in its own route group (no session, no navigation, `robots: noindex`), same not-found page for every failed link. Nav item "Sala de compliance" visible to owners only.
- **Not in v1 (threat model §5):** viewer identity, password links, per-link scope, watermarks, presigned file URLs, NDA step, analytics beyond counts.
- **Gates before real customers:** D13 (Compliance OS terms) and human legal review of the visitor-facing copy (caveat, score caption); D23 shared limiter before multi-instance deployment.

## Phase log

| Date | Phase | Outcome |
|---|---|---|
| 2026-09-11 | Diagnostic | Read-only diagnostic delivered (21 sections). No files changed. |
| 2026-09-12 | Phase 0 | Governance operational (D1, D2 git init, D18, D21). No commits. |
| 2026-09-12 | Phase 1 + Content Track | Started. Toolchain: Node 24 / npm 11; Python 3.12 via uv; no Docker/psql. Parallel handoffs: SSE (scaffold), Product Strategist (assessment v1 scope + score v1), Compliance Researcher (sources register v1), UX/UI Engineer (tokens + shell spec). |
| 2026-09-12 | Phase 1 (incident) | All four subagents terminated with HTTP 429 (account monthly spend limit) before producing deliverables; only `create-next-app` and part of `apps/api` had been written. Orchestrator decision (CLAUDE.md §26 prerogative): continue the four workstreams inline in the main session with the role declared per step, cheapest-first, keeping the repo consistent at every step. Agent-authored `app/core/logging.py` and `version.py` were kept and integrated. |
| 2026-09-12 | Phase 1 run 1 — code | DONE. web: lint/typecheck/test/build PASS, First Load JS 103 kB baseline; api: ruff/pytest(5)/alembic heads/openapi check PASS; live /health verified with X-Request-ID echo, 404 envelope, CORS preflight. CI workflow written (not yet executed — no remote). Windows App Control blocks `pytest.exe`; use `python -m pytest`. |
| 2026-09-12 | Phase 1 run 2 — tokens + shell | DONE. `docs/design/tokens.md` and `docs/design/app-shell.md` written (UX role, inline). Implemented: `@theme` tokens, Inter via next/font (400/500/600), app shell (sidebar, mobile drawer as native `<dialog>`, skip link, landmarks), 7 routes with pt-BR empty states, PageHeader/EmptyState/Button/Skeleton. Verified in browser: no horizontal overflow at 1024px; drawer opens/closes via button, Escape and backdrop with focus return; `aria-current`, `lang=pt-BR`, Inter loaded. Bundle: 103–106 kB First Load JS per route (budget ≤ 130 kB). lint/typecheck/test/build PASS. |
| 2026-09-12 | Content Track | DRAFTED. Product role: `docs/product/assessment-v1-scope.md` (7 sections, 42 questions, 12 short-mode, answer model, P×I derivation, versioning) and `docs/product/score-v1-proposal.md` (4 factors 0.15/0.50/0.20/0.15, worked examples computed by script). Researcher role: `docs/regulatory/sources-v1.md` — ANPD index, Res. 2/2022, 15/2024, 19/2024 read from primary text; LGPD article text NOT readable this session (Planalto/in.gov.br unreachable) → all article-level claims remain UNVERIFIED; never-hard-code list; human legal review items F1–F5. Next: per-question source mapping; LGPD verification; UX wording pass. |
| 2026-09-12 | Phase 2 start | User authorized. D3/D8/D11 applied as DEFAULT; D12 dev/test resolved with embedded PostgreSQL 16.2 via `pgserver` (App Control did not block it). Scope 2a: backend identity, tenancy, permissions, audit log, isolation tests. Scope 2b: frontend auth pages + session-aware shell. |
| 2026-09-12 | Phase 2a — backend | DONE. Models (User, Organization, Membership, RefreshToken, PasswordResetToken, Invitation, AuditLog) with composite-FK tenant pattern; migration 0002 (autogenerate, hand-reviewed; upgrade/downgrade round-trip + `alembic check` clean); Argon2id + HS256 access JWT (15 min) + rotating refresh (30 d, reuse detection revokes family); cookies httpOnly/SameSite=Lax (refresh scoped to /api/v1/auth); Origin check; rate limits; permission matrix as data; membership rules (last owner, self, admin vs owner); append-only audit with redaction; e-mail abstraction (console/capture). 15 endpoints. **40 tests on real PostgreSQL** (embedded): auth 11, roles 8, tenancy 16 (7 routes × A→B 404 and unknown-org 404), health 5. |
| 2026-09-12 | Phase 2b — frontend | DONE. BFF proxy `/api/v1/[...path]` (same paths → cookie paths valid, first-party cookies); server `getSession()`; pages `/entrar`, `/criar-conta`, `/recuperar-senha`, `/redefinir-senha`, `/convite` (pt-BR, a11y, error envelope mapped); app layout redirects to `/entrar` when unauthenticated; auth layout redirects to `/` when authenticated; sidebar shows real organization/user + logout; `SessionRefresher`. Verified in browser end-to-end: signup → `/` with org name; logout → `/entrar`; wrong password → alert; login → `/`; `/configuracoes` shows org/role/e-mail. Bundle max 109 kB. lint/typecheck/test/build PASS. |
| 2026-09-12 | Environment note | Stopping the preview API leaves the embedded PostgreSQL (`.pgdata`) running; stop it with `pg_ctl -D .pgdata -m fast stop` (added to README). Seven `postgres.exe` in Windows session 0 pre-exist on the machine and are not ours. |
| 2026-09-12 | Phase 3 — DONE | Backend: `risks`, `actions`, `evidence` tables (migration 0003; round-trip + `alembic check` clean; composite FKs to memberships/risks/actions; CHECK constraints on P/I ranges and evidence attachment). Services: derived severity, explicit state machines (invalid → 409, manager-only → 403), ownership rules, evidence add/delete, field-level audit diffs. `StorageBackend` + local disk; upload allowlist + magic bytes + size cap + sanitized names; authenticated streaming download. 11 endpoints. **91 tests** (tenancy 46 incl. 15 new routes × A→B/unknown; domain 21). Frontend: Riscos list/new/detail (actions inline, evidence panel, status control), Ações list/new/detail; verified in browser end-to-end (create risk → action → status → note + PDF upload → authenticated download with correct headers; mobile cards, no overflow). Bundle max 114 kB. Fix during verification: BFF proxy now forwards download headers; `SessionRefresher` tolerates network errors. |
| 2026-09-12 | Phase 3 start | User authorized. D4/D5/D9 applied as DEFAULT. Evidence files: `StorageBackend` abstraction with local-disk backend (dev/test); S3-compatible backend when D12 is decided. Downloads are authenticated API responses, never public URLs. |
| 2026-09-12 | Phase 4 start | User authorized. D6 applied as DEFAULT (unverified content, basis hidden). Scope: template/instance tables, derivation service, 7 endpoints, `/diagnostico` (start → runner → result), tenancy fixture extended. |
| 2026-09-13 | Phase 4 — DONE | Backend: `assessment_templates/_template_versions/_sections/_questions` (global content) + `assessments/assessment_responses` (tenant-owned, composite FKs); Risk gains `derived_probability/impact`, `answer_uncertain`, `suggested_action`, `expected_evidence` (migration 0004; upgrade → check → downgrade base → upgrade → check clean on a throwaway cluster). Content: 7 sections / 42 questions / 12 short, built from the product draft, seeded idempotently (also by `dev_api.py`). Service: answer rules, completeness per mode, derivation (one risk per question, manual P/I preserved, `sim` → em_revisao), reopen with short → full continuation. 7 endpoints, all in the cross-tenant fixture. **113 tests** (tenancy 60 = 30 routes × A→B/unknown; assessment 8; domain 21; auth 11; roles 8; health 5). Frontend: `/diagnostico` three states; verified in browser end-to-end: start short → 12 answers autosaved (incl. N/A + justification) → complete → 8 derived risks (4/2/2) → “Revisar respostas” reopens with saved answers → change DF-01 to “Sim” → complete again: no duplicate, risk shown “Em revisão” + sentence “1 em revisão” → “Continuar diagnóstico completo” → full mode 12/42 with per-section counts. Bundle max 114 kB. lint/typecheck/test/build, ruff, openapi check PASS. Fix during verification: result now exposes `in_review` and the UI shows the status badge for derived risks not `aberto`. |
| 2026-09-13 | Phase 5 start | User authorized. D10 applied as DEFAULT. Scope: score engine (pure compute + gather + snapshots), 2 endpoints, Visão geral score card, score link on the diagnostic result. |
| 2026-09-13 | Phase 5 — DONE | Backend: `score_snapshots` + `assessments.first_completed_at` (migration 0005 with backfill; upgrade → check → downgrade base → upgrade → check clean). `services/score.py`: `gather` / pure `compute` / `current` / `recalculate` / `history`; triggers wired before commit in every risk, action, evidence and assessment mutation route; `score.read` for all roles; `DEFAULT_TIMEZONE`. Tests: 12 pure engine tests (proposal examples 41 → 69 → 87, ceiling 85, B clamp, N/A → unavailable, C = 0 without action, overdue at the local day boundary, evidence scope, rounding half-up, band boundaries, capped items vs. full ranking) + 7 API tests (empty state, seeded-content score 51 → 71 → 91 with cadence, unchanged score writes nothing, reopen explained, delta vs. an older snapshot, all-N/A, viewer read) + 4 tenancy cases. Frontend: `ScoreCard` on Visão geral (number, band, delta, four factor bars, reducers with links, next steps), score link on `/diagnostico`; vitest for helpers. Verified in browser on the dev account. Dev fix: embedded PostgreSQL now starts detached (uvicorn reload was crashing it). |
| 2026-09-13 | Phase 6 start | User authorized. Scope: Visão geral data (`/overview`), audit trail page, edit forms, pagination, score trend. No new decisions needed; Documents widget stays out (D9 — module deferred). |
| 2026-09-13 | Phase 6 — DONE | Backend: `GET /overview` (counts, top risks/actions, assessment state, activity for managers), audit entries enriched with actor name + current entity title, overdue unified on the local day; in the cross-tenant fixture (31 routes). **141 tests** (overview 3 new + 2 tenancy cases). Frontend: Visão geral with status counters, trend sparkline, critical/high risks, pending actions, recent activity; `/historico` paginated audit log (managers) with permission copy for others; edit pages for risks and actions (PATCH, severity recomputed); pagination 25/page on riscos, ações, histórico; list headers from `/overview`. Verified in browser: dashboard with real data, edit MFA risk (Crítico → Alto, owner + due date), histórico pages 1→2 (77 entries). Bundle: `/` 107 kB, edit pages ≤ 113 kB. lint/typecheck/test/build, ruff, openapi check PASS. Dev environment: postgres spawned directly without console and outside the API tree (survives uvicorn reload and `taskkill /T`). |
| 2026-09-13 | Phase 7 start | User authorized. D26 applied as DEFAULT (documents with derived status; citation as evidence). |
| 2026-09-13 | Phase 7 — DONE | Backend: `documents` table + `evidence.document_id` + enum value (migration 0006; round trip clean), `services/documents` (derived status in Python and SQL, urgency order, tags normalization, file replace, delete refused while cited), 7 endpoints + citation via `/evidence`, overview `documents` counts, audit titles for documents; shared `validate_upload`; owner relationship reloaded after reassignment (fixes stale owner in risk/action/document PATCH responses). **169 tests** (documents 14 incl. 8 derivation cases; tenancy 7 routes × 2; domain regression 1). Frontend: `/documentos` list with status filter chips, novo/detail/editar, file panel (replace + download), evidence panel "Documento" option on risks and actions, Documentos card on Visão geral, activity sentences; vitest for activity (7 web tests, `@` alias added to vitest). Verified: create → detail (Vencendo, v2.1, tags) → PDF upload + authenticated download through the BFF → citation on a risk (evidence shows the document name) → overview counts + list filters. lint/typecheck/test/build, ruff, openapi check PASS. |
| 2026-09-13 | Phase 8 start | User authorized the release cycle: members UI, security hardening pass, CI validation, first commit (proposed and accepted as the phase scope). |
| 2026-09-13 | Phase 8 — DONE | Members & invitations UI on `/configuracoes` (+ `GET/DELETE …/members/invitations` — revoke = expire, audited); organization rename for owners. Security: API hardening headers middleware, web CSP + headers, production guard for `COOKIE_SECURE`, `X-Forwarded-For` forwarded by the BFF (uvicorn `--proxy-headers` documented), CORS `PUT`. Audits: `pip-audit` clean; npm postcss advisory accepted (D18a). **175 tests** (security headers, production settings guard, invitations list/revoke, 2 tenancy routes × 2). CI workflow reviewed (checks mirror the local gates; unchanged). First commit on `main`. |
| 2026-09-13 | Phase 9 start | User wrote "Continue" after the Phase 8 report; the Orchestrator read it as authorization for the proposed beta-preparation phase, executing the parts that do not depend on a vendor choice (adapters, demo data, switcher) and leaving D11/D12 vendor/region decisions to the user. |
| 2026-09-13 | Phase 9 — DONE | SMTP e-mail adapter + production guard + `503 email_unavailable` with rollback (D11 PARTIAL); S3-compatible storage backend, boto3 runtime dep, moto dev dep (D12 PARTIAL); organization switcher (httpOnly preference cookie, Server Action, progressive enhancement) and invitation accept opening the joined organization (`InvitationAcceptedOut`); demo organization "Acme Tecnologia Ltda." built through the services (`scripts/seed_demo.py`, score 77 Organizado, 28 risks, 28 actions, 18 documents, 5 PDFs) with a coherence test pinning the story; audit entries stamped in strictly increasing order per process. **190 tests** (+15). Gates: ruff/format/openapi check/alembic round trip PASS; web lint/typecheck/vitest (7)/build PASS. Browser (SSR through the BFF): demo overview renders 77/Organizado with team activity; switch Empresa de Teste → Acme via the action form (forged id ignored); `/riscos` shows Acme's risks; demo PDF downloads. Not exercised in the browser: the accept-invitation → remembered-organization path (API side tested). No commit made (awaiting instruction). |
| 2026-09-13 | Phase 10 start | User wrote "Avance": commit of Phase 9 (`ad3930f`) and the proposed scope — list filters, document-expiry reminders, nonce-based CSP. |
| 2026-09-15 | Phase 10 — DONE | List filters on `/riscos` and `/acoes` (validated search params → API parameters; GET form with on-change navigation, works without JS; pagination keeps filters — fixed `?x?page=2` bug; dashboard counters deep-link). Document-expiry digest job (`scripts/send_reminders.py`, `reminder_deliveries` migration 0007, one digest per organization per `REMINDER_INTERVAL_DAYS`, retry on relay failure). Nonce-based CSP in `src/middleware.ts` (`'strict-dynamic'`; static CSP removed from `next.config.ts`). **193 API tests** (+3 reminders), 10 web tests (+3 filters). Verified with the demo: 3 críticos / 3 atrasadas / 17 pendentes / 4 ações da Carla; digest run against the dev DB (Acme: 2 documentos, 4 destinatários; second run skipped); CSP header + 20/20 nonced scripts. Not verified: CSP blocking in a regular browser. |
| 2026-09-15 | Phase 11 start | User brief: evolve the MVP toward the Control Layer vision without destructive changes; no commit or deploy without explicit authorization. Diagnosis and gap map in `docs/product/control-layer-evolution.md`; D27–D34 applied as DEFAULT, D35 opened. |
| 2026-09-16 | Phase 11 — DONE (commit `4db0669`) | Control Graph (`controls`, `risk_controls`, `actions.control_id/effort`, `evidence.control_id/valid_until`, `organization_profiles`; migration 0008 round-trip + check clean). **P1 fixed:** composite `ON DELETE SET NULL` FKs nulled `organization_id` (member removal with owned records → 500); all 16 recreated as `SET NULL (column)`. Catalogue v1 (24 controls ↔ 42 questions, test-enforced), Risk-to-Action (`/recommendation`, `/plan`), Score v2 with Controles factor + `simulate()`, priorities, radar, deterministic agent (`docs/ai.md`), executive summary, profile. Frontend: `/controles` pages, plan panel, Control Room overview, profile form, `/resumo`, evidence validity/control target, action effort/control. Demo re-pinned at 69 with 20 controls. Gates on 2026-09-15: **246 API tests passed** (+53 since Phase 10; 17 min on embedded PostgreSQL), 12 web tests, ruff check/format, OpenAPI drift, alembic gate, lint, typecheck, `next build` (new routes 1.5–3.6 kB, shared 103 kB) all PASS; pip-audit 176 packages clean; npm audit: 2 advisories in the `postcss` copy vendored by Next 15 (fix = Next 16, blocked by D18; build-time only). Live probes against the dev API: 18 cross-tenant requests to the new endpoints by an outsider → all 404; one-step plan on TI-05 reused the incidents control, created the action for Carla (30 d), radar unplanned 1 → 0, score 69 → 70. Not verified in a regular browser: client-side interactions (the in-app pane does not paint). |
| 2026-09-17 | Phase 12 — IMPLEMENTED (awaiting authorization to commit) | D35 decided and applied: Anthropic Claude via the official SDK (`claude-opus-5` default, adaptive thinking at medium effort, JSON-schema output), off unless `LLM_PROVIDER=anthropic`. `core/llm.py` (Disabled · Anthropic · Fake providers), `services/agent_llm.py` (bundle → prompt → grounded JSON; refs filtered to bundle ids; forbidden-claim filter; deterministic fallback; `agent.asked` audit with counters only), `POST /agent/ask` (rate-limited per user/minute and organization/hour), `GET /agent/status`; bundle gains `records`. UI: "Agente de compliance" on Visão geral (canonical chips + free text when enabled, one grounded answer with Base chips) and "Entender este risco" on the risk page. Also: dark mode work reviewed and finished the same day (commit `975bd2d`). Gates: **API 264 passed** (+18), tenancy 65 routes × 2, web 12 tests, ruff/format/OpenAPI/lint/typecheck/`next build` PASS, pip-audit 201 packages clean. End-to-end with the real SDK against a local mock of `/v1/messages` (no credentials available here): free-text answer with 3 grounded refs and a dropped bogus ref, focused risk explanation, forbidden claim → 503 + audit `rejected_claim`. Not done: a call to the real provider; legal review (D13 + provider terms) before enabling in production. |
| 2026-09-17 | Phase 13 — IMPLEMENTED (awaiting authorization to commit) | Compliance Room v1 (D36) after a written threat model (`docs/security/compliance-room-threat-model.md`): `compliance_rooms` + `room_links` + `shared_in_room` flags (migration 0009, round trip clean); owner-only management, explicit per-record sharing (faltante documents and non-implemented controls refused), time-boxed hashed links shown once, anonymous visitor surface with uniform 404, per-IP limits, `no-store`/`noindex`, every view and download audited; preview = visitor payload. Web: `/sala`, `/sala/previa`, public `(public)/sala/[token]`; owner-only nav item; activity sentences. Also fixed the secondary button border in dark mode. Gates: **API 284 passed** (+20), tenancy 71 routes × 2, web 12 tests, ruff/format/OpenAPI/alembic/lint/typecheck/`next build` PASS. Browser (Acme, dev servers): share → publish → link → cookie-less visitor page with score, documents, real PDF download → revoke → 404; invalid token page; mobile. Before real customers: D13 and legal review of the visitor copy. |
| 2026-09-17 | Phase 14 — deploy readiness (pushed `fc54c35`; CI web/api/image green; amended for the free path) | D17 decided: Render (API + reminders cron + PostgreSQL 16, `render.yaml`, Ohio) and Vercel (`apps/web`, `gru1`). `apps/api/Dockerfile` (uv, no dev deps, non-root, healthcheck) + `docker-entrypoint.sh` (migrate → seed content → uvicorn behind proxy headers; arguments run a job). Settings: `postgres://` URLs normalized to the psycopg driver; production refuses local storage or a missing database URL; HSTS in production. CI gains an `image` job (build, boot against PostgreSQL, run the job, prove the production guard). `docs/deploy.md` runbook with the residency note (Fly `gru` + Neon `sa-east-1` alternative). Local gates PASS (config tests +2). The Docker image itself is only verifiable in CI (no Docker on this machine) — the push is the validation. CI on GitHub proved the image (first run caught the health path: `/api/v1/health`). Same day: Render turned out paid → D17 amended with the zero-cost topology (Koyeb + Neon + B2 + SMTP free tier + GitHub Actions digest workflow). `https://compliance-os-api.onrender.com` identified as an unrelated project. Pending on the user: accounts and secrets (Neon, Koyeb, B2, SMTP), Vercel project (`API_BASE_URL`), domain (D3), D11/D12/D13 decisions. |
