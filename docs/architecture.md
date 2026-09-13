# COMPLIANCE OS — ARCHITECTURE (Phase 3 baseline)

Status: reflects the repository as of Phase 3 (core domain). Anything not described here does not exist yet.
Decisions referenced as `Dn` live in `docs/decisions.md`.

## Repository layout (D2)

```
apps/web/                Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS 4
  src/app/               routes (server components by default)
  src/lib/api/schema.d.ts  generated from apps/api/openapi.json — never edit by hand
  src/lib/request-id.ts  request-id helpers shared by server-side fetches
apps/api/                FastAPI, SQLAlchemy 2, Pydantic v2, Alembic, Python 3.12 via uv
  app/main.py            create_app(): middleware, error handlers, /api/v1 router
  app/core/config.py     Settings (env / .env); DATABASE_URL optional until Phase 2
  app/core/request_id.py X-Request-ID middleware + contextvar
  app/core/logging.py    log format with request_id on every record
  app/core/errors.py     single error envelope for all 4xx/5xx
  app/api/v1/            routers: health, auth, orgs (me, organizations, members, audit-log)
  app/api/deps.py        get_current_user (access cookie), get_membership (org_id -> 404), require(permission)
  app/core/security.py   Argon2id passwords, HS256 access JWT (sub only), opaque tokens stored as SHA-256
  app/core/cookies.py    cos_access (path /) and cos_refresh (path /api/v1/auth); httpOnly, SameSite=Lax
  app/core/csrf.py       Origin check on unsafe methods when cookies are present
  app/core/permissions.py  role x permission matrix as data (D8)
  app/core/rate_limit.py in-memory limiter (D23) - single instance only
  app/core/email.py      EmailSender: console (dev) / capture (tests); production provider pending (D11)
  app/models/            identity (User, Organization, Membership, tokens, Invitation, AuditLog) + domain (Risk, Action, Evidence)
  app/services/          auth, membership, audit (append-only), domain (severity, state machines, ownership, evidence)
  app/core/storage.py    StorageBackend protocol; LocalDiskStorage for dev/test (S3-compatible pending D12)
  app/api/v1/risks.py    risks + actions routes; app/api/v1/evidence.py notes/links/files + authenticated download
  app/db/base.py         DeclarativeBase with deterministic constraint naming
  app/db/session.py      lazy engine; get_db() dependency
  alembic/               0001 baseline, 0002 identity, 0003 core_domain (autogenerate + hand review, enums dropped on downgrade)
  scripts/export_openapi.py  writes/checks openapi.json
  scripts/dev_api.py     embedded PostgreSQL (.pgdata) -> alembic upgrade -> uvicorn --reload
  tests/conftest.py      real PostgreSQL per test session (pgserver), migrations applied, truncate per test
.github/workflows/ci.yml lint · typecheck · test · build (web); ruff · pytest · alembic heads · openapi check (api)
docs/                    decisions, architecture (this file), product, regulatory, design
```

No monorepo tooling: two independent apps, one repository, one CI.

## Request flow

```
Browser ──HTTP──▶ Next.js (Vercel)  ──server-side fetch──▶ FastAPI (Railway/Render) ──▶ PostgreSQL (Neon)
                  server components                        /api/v1/*                    (Phase 2)
```

- Pages are server components by default; the browser talks **only** to the Next.js origin.
- **BFF proxy:** `apps/web/src/app/api/v1/[...path]/route.ts` forwards every `/api/v1/*` browser call
  to FastAPI with the same path, forwarding Cookie/Origin/X-Request-ID and returning all Set-Cookie
  headers. Cookie paths therefore match on both sides and auth cookies are first-party to the app domain.
- Server components read the session with `getSession()` (`src/lib/session/server.ts`): it forwards the
  browser's cookies to `GET /api/v1/me` directly (server-to-server), cached per request.
- CORS on the API is still restricted to `CORS_ORIGINS`; the API's Origin check receives the browser's
  Origin through the proxy.

## Identity and tenancy (Phase 2, decisions D3, D8, D19)

- **Signup** creates User + Organization + OWNER Membership in one transaction with two audit rows.
- **Access token**: HS256 JWT, 15 min, carries only `sub`; roles are always read from `memberships` on
  each request, so a role change or removal takes effect immediately.
- **Refresh token**: opaque, 30 days, stored as SHA-256, rotated on every use; presenting a rotated token
  revokes the whole family (`family_id`) and writes `auth.refresh_reuse_detected`.
- **Cookies**: `cos_access` (path `/`) and `cos_refresh` (path `/api/v1/auth`), httpOnly, SameSite=Lax,
  Secure outside development. `SessionRefresher` (client) rotates every 10 min and on tab focus.
- **Tenant selection**: `org_id` in the path is validated against Membership(user, org); no membership →
  `404` (never 403), so organization ids are never confirmed to outsiders.
- **Authorization**: `require("<permission>")` dependency backed by `PERMISSIONS` in `permissions.py`.
  Business rules on top (last owner, self-change, admin vs owner) live in `services/membership.py`.
- **Composite foreign keys**: child tables reference `(organization_id, parent_id)` →
  `UNIQUE (organization_id, id)` on the parent (`invitations.invited_by_membership_id` is the first case),
  so a cross-tenant reference is impossible at the database level.
- **Audit log**: append-only rows written in the same transaction as the change; secrets are redacted by
  key; `organization_id` is NULL only for user-level auth events. Read access: OWNER/ADMIN.
- **Password reset / invitations**: opaque single-use tokens (60 min / 7 days) delivered by e-mail; the
  request endpoint never reveals whether an e-mail exists.
- **Rate limits** (per IP and per e-mail) on signup, login, refresh, reset and invitation acceptance.

## Core domain (Phase 3, decisions D4, D5, D9)

- **Risk**: `probability` (1–3) × `impact` (1–4) → `severity` derived server-side (12 → Crítico, 8–9 → Alto,
  4–6 → Médio, else Baixo; `docs/product/assessment-v1-scope.md §7`). Clients never send severity.
  `source` = manual | assessment (`origin_question_code` kept for derived risks). Status machine:
  aberto → em_andamento → em_revisao → resolvido; aberto/em_andamento → aceito; reopen and accept are
  manager-only. `owner_membership_id` references Membership through the composite FK.
- **Action** (single entity, D4): optional `risk_id` (composite FK), owner, due date, status machine
  a_fazer → em_andamento → em_revisao/concluida, bloqueada from a_fazer/em_andamento, reopen manager-only.
  `completed_at` set on concluida. `overdue=true` filter uses `current_date` on the server.
- **Evidence** (D9): `kind` note | link | file, attached to a Risk and/or an Action (CHECK constraint),
  cascade-deleted with its parent. Files: content-type allowlist (pdf, png, jpg, txt, csv, docx, xlsx),
  magic-byte check, size cap (`EVIDENCE_MAX_BYTES`, 10 MB), display name sanitized, storage key
  `<org_id>/<evidence_id>.<ext>` generated by the server. Download is an authenticated, tenant-scoped
  streaming response with `Content-Disposition: attachment`, `nosniff` and `no-store` — never a public URL.
- **Ownership rule**: OWNER/ADMIN edit anything (`*.update_any`); MEMBER edits only items assigned to
  them (`*.update_assigned`) and cannot reassign; VIEWER reads. Evidence: CONTRIBUTORS add, MANAGERS delete.
- **Storage**: `StorageBackend` (put/open/delete). `LocalDiskStorage` root `STORAGE_LOCAL_ROOT`
  (`apps/api/.storage`, git-ignored) with path-traversal guard. Production backend is decision D12.
- **Audit**: risk.created/updated/status_changed, action.created/updated/status_changed,
  evidence.added/deleted — with field-level diffs, in the same transaction.
- **Frontend**: `/riscos` (table → stacked cards below md), `/riscos/novo` (severity preview computed
  client-side with the same matrix; the API decides), `/riscos/[id]` (why-it-exists, actions inline,
  evidence panel, status control listing only allowed transitions), `/acoes`, `/acoes/nova`, `/acoes/[id]`.
  Server components fetch through `apiGet()`; mutations go through the BFF proxy, which now also
  forwards `Content-Disposition`/`X-Content-Type-Options`/`Content-Length` for downloads.

## Assessment (Phase 4, decision D6)

- **Content vs. instance.** Template content is global and versioned: `assessment_templates` →
  `assessment_template_versions` (immutable once published; `last_verified` NULL until human legal review)
  → `assessment_sections` → `assessment_questions` (`code` such as `DF-01`, `short_mode` flag, help text,
  expected evidence, derived-risk title/category/impact, suggested action, regulatory basis). Content is
  built from `docs/product/assessment-v1-scope.md §13` by `scripts/build_assessment_content.py` into
  `app/content/assessment_v1.json` and loaded by `scripts/seed_content.py` (idempotent per
  `(code, version)`; `dev_api.py` runs it; tests seed once per session and never truncate content tables).
- **Per-organization instance.** `assessments` (one per org + template version, `mode` short | full,
  `status` in_progress | completed, composite-FK tenant pattern) → `assessment_responses` (one row per
  question, upsert on answer). Answers: `sim | parcial | nao | nao_se_aplica | nao_sei`;
  `nao_se_aplica` requires a justification (422 otherwise). Answering or completing a completed
  assessment → 409; `complete` with unanswered questions in the current mode → 422 listing them.
- **Derivation (`services/assessment.derive_risks`).** Runs on `complete`, in the same transaction:
  `nao` → P3, `parcial` → P2, `nao_sei` → P2 + `answer_uncertain=true`; impact comes from the question;
  severity from the Phase 3 matrix. One risk per `origin_question_code`, never duplicated: an existing risk
  is updated (probability/severity recomputed unless a human edited P/I — the derived values are kept
  in `derived_probability`/`derived_impact` for comparison) and reopened from resolvido/aceito/em_revisao
  with an audit reason `assessment:<code>:<answer>`. `sim` and `nao_se_aplica` never close a risk: an
  open derived risk moves to `em_revisao` and a human closes it with evidence. Manual risks are untouched.
- **Modes.** Short = 12 questions (`short_mode=true`), full = 42. `reopen` (manager-only) returns a
  completed assessment to `in_progress` and can switch short → full; answers are kept and `progress`
  is recomputed against the new scope (12/42 with per-section counts).
- **Regulatory basis is not exposed** by the API (`/questions` omits it) until the template version has
  `last_verified` set (`template.verified` in the state payload) — see `docs/regulatory/sources-v1.md`.
- **Endpoints** (`/api/v1/orgs/{org_id}/assessment`): `GET` state (none | in_progress | completed with
  progress, sizes, template verification flag), `POST /start`, `GET /questions` (sections with saved
  answers), `PUT /answers/{code}`, `POST /complete` (created/updated/sent_to_review + by_severity),
  `POST /reopen`, `GET /result` (`open_by_severity` — not resolved/accepted, so risks in review count —,
  `uncertain`, `in_review`, up to 50 derived risks). All routes are in the cross-tenant fixture.
- **Permissions.** CONTRIBUTORS (owner/admin/member) start, answer and complete; MANAGERS reopen;
  VIEWER reads state, questions and result.
- **Audit.** `assessment.started`, `assessment.answered` (per answer), `assessment.completed`
  (counts), `assessment.reopened`, plus the risk events emitted by derivation.
- **Frontend** (`/diagnostico`, server component with three states): start screen (mode cards +
  disclaimer), section runner (sticky section nav with progress, radio options, N/A justification with
  debounce, per-answer autosave with an `aria-live` "Salvo", complete enabled only when the current scope
  is fully answered), result (severity counts, up to 8 risk links with a status badge when not `aberto`,
  "Continuar diagnóstico completo" after short mode, "Revisar respostas").

## Score (Phase 5, decision D10)

- **What it is.** A maturity indicator computed from the organization's own records — never a legal
  claim (CLAUDE.md §8; UI copy: "indicador de maturidade", "não é uma medida de conformidade legal").
  Formula, weights and worked examples: `docs/product/score-v1-proposal.md`; `SCORE_VERSION = "v1"`.
- **Pipeline** (`app/services/score.py`): `gather()` reads the assessment, risks, actions and evidence;
  `compute()` is a pure function of those inputs (no clock, no database) so the same records always give
  the same payload; `current()` adds the delta; `recalculate()` persists a snapshot.
- **Factors.** A Diagnóstico 0.15 = answered / questions in the current scope. B Riscos 0.50 =
  `max(0, 1 − Σ w(open risks) / MaxPenalty)` with w = 12/6/3/1 (Crítico/Alto/Médio/Baixo) and MaxPenalty =
  Σ w(severity(P=3, I_q)) over the questions **answered and applicable** (N/A excluded) — computed from
  the template data, never hard-coded; manual risks add to the numerator only. C Execução 0.20 =
  ½ coverage (open Crítico/Alto with an action that has owner + due date) + ½ on-time (actions not past
  due, done actions count as on time); no open high risk and no action → 100, open high risk and no
  action at all → 0. D Evidências 0.15 = (resolved Crítico/Alto + done actions) carrying evidence over
  all of them; empty denominator → 0 with the hint "Nenhuma evidência registrada ainda" (honest
  ceiling 85 without proof). Score = round-half-up of Σ weight × value, clamped 0–100.
- **Definitions.** Open risk = status not in {resolvido, aceito} (a risk sent to `em_revisao` by a
  re-assessment is still open). Closed = resolvido only. Overdue = `due_date < today` in
  `DEFAULT_TIMEZONE` (America/Sao_Paulo; per-organization timezone is a later refinement — the
  `overdue=true` list filter still uses the database `current_date`, a known midnight inconsistency).
- **Availability.** The score exists from the first completion of the assessment
  (`assessments.first_completed_at`, kept across reopen) — before that the API answers
  `available=false, reason=no_assessment` and the UI shows "—", never 0. All answered questions
  N/A → `reason=not_applicable`. Short mode → `preliminary=true`; reopened → `assessment_completed=false`
  and A drops to the current progress (the score is live, not frozen).
- **Explanation payload.** `factors` (weight, value, contribution, summary, up to 10 record items each
  with the points they cost), `top_reducers` (aggregated reasons ranked by points: unplanned high
  risks, open risks per severity, overdue actions, missing evidence, unanswered questions — each with
  up to three record refs), `next_actions` (one concrete step per reducer, never repeating a record),
  `band` (0–39 Inicial · 40–59 Em estruturação · 60–79 Organizado · 80–100 Maduro; labels pending
  human legal review F5), `delta` (vs. the earliest comparable snapshot — same version and
  preliminary flag — before today within 30 days; null on the first day).
- **Snapshots** (`score_snapshots`, JSONB breakdown, `score_version`, `preliminary`, `trigger`).
  Written in the same transaction as the change that triggered them: assessment complete/reopen, risk
  create/update/status, action create/update/status, evidence add/delete. Cadence: an unchanged score
  writes nothing; within the same local hour the latest snapshot is overwritten unless it is the first
  of its day; otherwise a new row. Old snapshots are never recomputed when the formula changes
  (`score_version` bump).
- **Endpoints.** `GET /orgs/{org_id}/score` (live), `GET /orgs/{org_id}/score/history?limit=` (≤ 90
  snapshots, newest first). Permission `score.read` = every role; both routes are in the cross-tenant
  fixture.
- **Frontend.** `ScoreCard` (server component) at the top of Visão geral: number + band badge + delta,
  "Por que N?" with one bar per factor, "O que mais reduz o score" with linked records, "Próximos
  passos" as links; the API describes records (`kind`, `id`), the app owns the routes (`refHref`).
  `/diagnostico` shows the score with a link to the explanation after completion.

## Visão geral, audit trail and list polish (Phase 6)

- **`GET /orgs/{org_id}/overview`** — one round trip for the dashboard's operational state: open risks
  per severity, in review, without owner, the five riskiest open Crítico/Alto items (severity, then
  earliest due date, undated last); pending / overdue / blocked / done actions and the five most
  urgent pending ones (earliest due date first, undated last by recency); assessment state and
  progress; `recent_activity` (eight latest audit entries) only for roles with `audit.read` — the
  field is `null` for members and viewers, never an empty list pretending there is nothing.
- **Audit entries are enriched at read time** (`services/audit.list_entries`): `actor_name` and the
  current `entity_title` of the risk/action referenced, resolved with two batched lookups, so a renamed
  record shows its new name and the append-only table stays untouched. The same helper serves
  `/audit-log` (paginated) and the overview.
- **Overdue** now means `due_date < today` in `DEFAULT_TIMEZONE` everywhere (list filter, overview and
  score agree); the previous `current_date` (database clock) inconsistency is gone.
- **Frontend.** Visão geral = score card + trend sparkline (inline SVG from `/score/history`, hollow
  points for preliminary snapshots) + "Status atual" counters + "Riscos críticos e altos" + "Ações
  pendentes" + "Atividade recente" (managers). `/historico` renders the audit log as sentences
  (`lib/domain/activity.ts` maps every action name to pt-BR copy; unknown actions fall back to the raw
  name) with pagination; members and viewers see the permission-denied copy. Edit forms: `/riscos/[id]/editar`
  and `/acoes/[id]/editar` reuse the create forms in edit mode (PATCH; the page redirects when the
  session cannot edit, and the API enforces it anyway). Pagination: 25 per page via `?page=N`,
  "Mostrando 1–25 de N" (app-shell.md §6); list headers take their counts from `/overview`, not from
  the current page.

## Documents (Phase 7, decision D26)

- **Entity.** `documents` (tenant-owned, composite FKs to memberships): name, description, category
  (política · procedimento · contrato · registro · treinamento · certificação · outro), free-text
  `version` label, `review_state` (vigente · em_revisao · faltante), owner, `valid_until`, `tags`
  (JSONB, ≤ 10, normalized lower-case), optional external `url`, and at most one current file
  (`filename`, `content_type`, `size_bytes`, `storage_key`, `file_updated_at`). A new upload replaces
  the file; the audit log (`document.file_uploaded`) is the version history for v1.
- **Status is derived, never stored** (`services/documents.derive_status`, mirrored as a SQL `CASE` for
  filters, ordering and counts): faltante → `faltante`; em_revisao → `em_revisao`; no validity →
  `atualizado`; `valid_until < today` → `vencido`; within `DOCUMENT_EXPIRING_DAYS` (30) → `vencendo`;
  else `atualizado`. Uploading a file to a `faltante` document flips it to `vigente`. The list is
  ordered by urgency (vencido, faltante, vencendo, em_revisao, atualizado), then validity, then name.
- **Documents as evidence.** `Evidence.kind = document` with `document_id` (composite FK, `RESTRICT`):
  a cited document cannot be deleted (409 until the citations are removed). Citations count as
  evidence for the score's D factor like any other kind. `EvidenceOut.document` carries the name.
- **Files** reuse the evidence pipeline: same allowlist, magic-byte check, size cap
  (`validate_upload`, shared), sanitized display name, server-generated storage key, authenticated
  streaming download with `attachment` + `nosniff` + `no-store`. The previous object is deleted only
  after the replacing transaction commits.
- **Permissions.** `document.read` everyone; `document.create` / `document.delete` /
  `document.update_any` managers; `document.update_assigned` contributors (the responsible person),
  who cannot reassign. Uploads follow the edit rule.
- **Endpoints.** `GET /orgs/{org_id}/documents` (filters `status`, `category`, `owner_membership_id`;
  pagination), `POST`, `GET/PATCH/DELETE /{id}`, `POST /{id}/file`, `GET /{id}/download`; all in the
  cross-tenant fixture, plus a document citation through `/evidence`. `/overview` gains `documents`
  counts per status.
- **Frontend.** `/documentos` (status filter chips with counts from `/overview`, table → cards below
  md, pagination), `/documentos/novo`, `/documentos/[id]` (status hint, metadata, file panel with
  replace + download, external link), `/documentos/[id]/editar`. The evidence panel on risks and
  actions offers "Documento" with a select of the organization's documents. Visão geral shows a
  Documentos card (five counters linking to the filtered list).
- **Not in v1.** Version history table, document templates/expected-document seeding from the
  assessment, reminders before expiry, a Documents dimension in the score (D10 keeps four factors).

## Security hardening (Phase 8)

- **Response headers.** API (`core/headers.py`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: no-referrer`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
  and `Cache-Control: no-store` unless a route set its own (downloads do). Web (`next.config.ts`):
  CSP (`default-src 'self'`, inline scripts allowed for hydration, `'unsafe-eval'` only in development,
  `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'self'`, `object-src 'none'`), `nosniff`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`.
- **Production guard rails.** `Settings` refuses `APP_ENV=production` without a 32+ char `JWT_SECRET`
  and with `COOKIE_SECURE=false`.
- **Client IP behind the BFF.** The proxy forwards `X-Forwarded-For`; the API's per-IP limits use
  `request.client`, which uvicorn rewrites only with `--proxy-headers --forwarded-allow-ips=<web IP>`.
  Per-e-mail limits (login, reset) do not depend on the IP.
- **Members and invitations UI** (`/configuracoes`): owners rename the organization; managers invite
  (role select; only owners may grant owner), change roles, remove members and revoke pending
  invitations (`GET/DELETE /orgs/{org_id}/members/invitations[/{id}]`, `members.invite`; a revoked
  invitation is expired, not deleted, so the audit trail keeps it). The API stays the authority: the
  last owner cannot be demoted or removed, members never see e-mails.
- **Dependency audit.** `pip-audit` on the locked production set: clean. `npm audit --omit=dev`:
  postcss advisory through Next 15 (build-time; D18a).

## Request-ID propagation

- `X-Request-ID` is accepted inbound when it matches `^[A-Za-z0-9-]{8,128}$`, otherwise a UUID4 is generated.
- The id is stored in a `ContextVar`, injected into every log record (`request_id=…`), echoed on every
  response header — including CORS preflight and error responses — and embedded in error bodies.
- The web app forwards its own id on server-side fetches so one id spans both services.

## Error envelope (D19)

Every non-2xx response has the same JSON shape:

```json
{ "code": "not_found", "message": "Not Found", "request_id": "…", "details": [] }
```

- `code` is stable and machine-readable (`bad_request`, `unauthenticated`, `forbidden`, `not_found`,
  `method_not_allowed`, `conflict`, `validation_error`, `rate_limited`, `internal_error`).
- `details` is present only for validation errors (`loc`, `msg`, `type` per field).
- 5xx bodies never contain exception text; the exception is logged with the request id.
- Resources outside the caller's tenant will answer `404`, not `403` (D19) — enforced from Phase 2.

## API contract generation

1. `uv run python scripts/export_openapi.py` writes `apps/api/openapi.json` (sorted keys, stable diff).
2. `npm run gen:api` in `apps/web` generates `src/lib/api/schema.d.ts` with `openapi-typescript`.
3. CI runs both in `--check` mode; a stale file fails the build. Contract drift between the two runtimes
   is therefore caught before merge.

## Database

- SQLAlchemy 2 declarative base with a naming convention so every constraint has a predictable name.
- Engine is created lazily; importing the app or serving `/health` never touches a database.
- Alembic reads `DATABASE_URL` from Settings (never from `alembic.ini`). Revision `0001` is an empty
  baseline; all future migrations descend from it.
- Development and tests use an **embedded PostgreSQL 16** (`pgserver`, data in `apps/api/.pgdata`,
  git-ignored) — no Docker required. Production database/region is decision D12 (pending).
- Tests run migrations on a fresh embedded database and truncate all tables between tests.

## Deliberately absent after Phase 7

Document version history, expiry reminders and expected-document seeding (Documents v2) ·
list filters in the UI for risks and actions (the API supports status/severity/owner/overdue) ·
per-question regulatory basis in the UI (hidden until `last_verified`, D6) · template v2 tooling (a new
JSON version + seed; no admin UI) · organization switcher UI (model supports several memberships; the
first one is shown) · production e-mail provider (D11) · production
database, object storage and region (D12) · Postgres RLS (defense in depth, revisit) · shared rate-limit
store (needed before a second API instance) · dark mode (D16) · Framer Motion (D22) · Compliance Room,
AI copilot, integrations, billing (§5–§6 future direction).

## Environment notes

- Windows development machine: no Docker/psql; Phase 2 needs a Neon connection string (D12).
- `scripts/dev_api.py` starts the embedded PostgreSQL detached from the console on Windows: uvicorn's
  reloader (`basereload.restart`) sends a console-wide `CTRL_C_EVENT` on every restart, which crashes a
  postgres attached to the same console (observed: exit 0xC000013A, then WAL recovery on next start).
  `pg_ctl start` is not used either: it launches postgres through `cmd.exe`, which gives it a console of
  its own. `postgres.exe` is spawned directly (no console) through a short-lived helper so it is not a
  child of the API process and survives `taskkill /T` / the preview stop button. Verified: reload and
  tree kill with the database still running; `pg_ctl stop` still works. While postgres starts,
  `postmaster.pid` is written progressively — the readiness loop tolerates a partially written file.
- `pytest.exe` may be blocked by Windows App Control; use `uv run python -m pytest`.
- `npm audit` reports postcss ≤ 8.5.22 (bundled by Next 15) — build-tool-only exposure, no user-supplied
  CSS is processed; the only upstream fix is Next 16 (see D18a).
