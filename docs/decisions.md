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
| D17 | Railway vs Render | PENDING | MEDIUM | Deploy |
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

- **Status:** DEFAULT: not in MVP
- **Class:** MEDIUM
- **Reason:** Halves visual QA surface. Tokens from brand-system §10 are preserved for later.

## D17 — Railway vs Render

- **Status:** PENDING
- **Class:** MEDIUM

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
