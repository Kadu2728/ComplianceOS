# COMPLIANCE OS — DEPLOY RUNBOOK

Decision D17 (2026-09-17, amended twice the same day). Two supported topologies share the same
code and environment; only where the API runs changes.

| | **A — Vercel + Neon** (default, no card, data in Brazil) | **B — Containers** (paid hosts) |
|---|---|---|
| Web | Vercel Hobby project `compliance-os-web` (`apps/web`, `gru1`) | Vercel Pro |
| API | Vercel Hobby project `compliance-os-api` (`apps/api`, Python runtime, `gru1`) | Docker image on Render (`render.yaml`) or any container host |
| PostgreSQL | **Neon** Free, region `aws-sa-east-1` (São Paulo) | Render PostgreSQL / Neon |
| Files | **Backblaze B2** (10 GB free, S3 API, no card) | any S3-compatible bucket |
| E-mail | **Brevo** or **Resend** free SMTP tier | any SMTP relay |
| Daily job | **GitHub Actions** (`.github/workflows/reminders.yml`) | Render cron (blueprint) |
| Migrations | on cold start (`MIGRATE_ON_STARTUP=true`, advisory-locked) | `docker-entrypoint.sh` |
| Monthly cost | R$ 0 while inside the free quotas (Hobby is for non-commercial use — move to Pro before charging) | ≈ US$ 14 + storage |

Live today (topology A): API `https://compliance-os-api.vercel.app`, web
`https://compliance-os-web-gilt.vercel.app`. Both run in `gru1`; with Neon in `sa-east-1` every byte
stays in Brazil. The browser only talks to the web domain: the Next.js BFF (`/api/v1/*`) proxies to
the API, so cookies stay first-party and the API's CORS list contains one origin.

```
browser ── https://compliance-os-web-gilt.vercel.app (Vercel gru1) ──BFF──> https://compliance-os-api.vercel.app (Vercel gru1)
                                                                                     │              │
                                                                            Neon sa-east-1     B2 bucket · SMTP
                                                08:00 BRT: GitHub Actions → scripts/send_reminders.py
```

Hobby limits that shape the setup: request/response bodies ≤ 4.5 MB (`EVIDENCE_MAX_BYTES=4000000`),
300 s per invocation, one region. The in-memory rate limiter (D23) is per warm instance — approximate
on serverless; `TRUST_PROXY_HEADERS=true` makes it key on the real client IP.

## 0. What CI proves on every push (`.github/workflows/ci.yml`)

web: lint, typecheck, unit tests, `next build`, generated API types up to date · api: ruff, format,
full test suite, single alembic head, `openapi.json` up to date · image: the production Docker image
builds, boots against PostgreSQL (migrations + content seed + `/api/v1/health`), runs the reminders
job, and **refuses to start** with an incomplete production configuration.

## 1. Environment variables (both topologies)

| Variable | Value | Where it comes from |
|---|---|---|
| `APP_ENV` | `production` | fixed |
| `DATABASE_URL` | the provider's connection string (`postgres://` and `postgresql://` are normalized) | Neon / Render. **Neon: use the direct (non-pooled) string** — the pooler breaks psycopg's prepared statements |
| `JWT_SECRET` | 32+ random characters: `python -c "import secrets; print(secrets.token_urlsafe(48))"` | you (Render generates it) |
| `COOKIE_SECURE` | `true` | fixed |
| `CORS_ORIGINS` | JSON list with the web origin, e.g. `["https://app.<domain>"]` | your Vercel domain |
| `APP_BASE_URL` | `https://app.<domain>` (e-mail links) | same |
| `EMAIL_PROVIDER` | `smtp` | fixed |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SECURITY` | relay credentials; `SMTP_FROM` like `Compliance OS <no-reply@<domain>>`; `starttls` on 587 | Brevo / Resend / any relay |
| `STORAGE_BACKEND` | `s3` | fixed |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | B2: endpoint `https://s3.<region>.backblazeb2.com`, region from the bucket page, an application key restricted to the bucket | bucket provider |
| `DEFAULT_TIMEZONE` | `America/Sao_Paulo` | fixed |
| `LLM_PROVIDER` | `none` until D13/D35 legal review; then `anthropic` + `ANTHROPIC_API_KEY` | D35 |
| `WEB_CONCURRENCY` | `1` (in-memory rate limiter, D23) | fixed |
| `TRUST_PROXY_HEADERS` | `true` behind Vercel/Render (client IP from `X-Forwarded-For`) | fixed |
| `MIGRATE_ON_STARTUP` | `true` on Vercel (no entrypoint); `false` in containers (the entrypoint migrates) | topology |
| `EVIDENCE_MAX_BYTES` | `4000000` on Vercel (4.5 MB body limit); default 10 MB elsewhere | topology |
| `PORT` | `8000` (containers only; the image honours the host's value) | host |

`APP_ENV=production` turns on the guards: the service will not start without HTTPS cookies, SMTP,
S3, a database URL and a 32+ character secret — CI proves this on every push.

## 2A. Vercel + Neon (default)

2. **Backblaze B2** (free 10 GB, no card): private bucket + an application key limited to it; note
   the S3 endpoint (`https://s3.<region>.backblazeb2.com`) and region.
3. **SMTP**: Brevo (300 e-mails/day) or Resend (3 000/month); SMTP credentials; verify the sender
   domain (SPF/DKIM).
0. **Beta mode (live today).** The API runs with `BETA_NO_EMAIL_NO_FILES=true`,
   `EMAIL_PROVIDER=disabled` and `STORAGE_BACKEND=disabled`: accounts are created directly on
   `/criar-conta`, invitations and password resets answer 503 `email_disabled`, file uploads answer
   503 `storage_disabled` (evidence by note or link and document metadata work). Leaving beta mode
   = steps 2–3 below, then set `EMAIL_PROVIDER=smtp`, `STORAGE_BACKEND=s3`, remove the flag and
   redeploy.
1. **Neon** — provisioned through the Vercel Marketplace (`vercel integration add neon --plan
   free_v3 -m region=gru1 -n compliance-os-db`), which injects `DATABASE_URL` and
   `DATABASE_URL_UNPOOLED` into the API project; the app prefers the unpooled one. Manual
   alternative: neon.com → New project → region **AWS South America (São Paulo)** → *Connect* →
   **Connection pooling off** → copy the direct string. Free plan: 0.5 GB, compute scales to zero
   after 5 min (first query after idle takes ~1 s).
4. **API project** (`compliance-os-api`, already created and deployed from `apps/api` with the
   Vercel CLI; `pyproject.toml` `[tool.vercel] entrypoint = "app.main:app"`, `vercel.json` region
   `gru1`). Every non-secret variable from §1 is already set in Production, including a generated
   `JWT_SECRET`. **Three secret groups must be typed by a person** (Settings → Environment
   Variables → Production, or `printf '%s' '<value>' | vercel env add <NAME> production` from
   `apps/api`): `DATABASE_URL`; `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`;
   `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
   Then redeploy (`vercel deploy --prod` from `apps/api`, or push to `main` once Git is connected):
   the first cold start applies migrations and seeds the content (`MIGRATE_ON_STARTUP`).
5. **Web project** (`compliance-os-web`, created and deployed from `apps/web`): `API_BASE_URL`
   points at the API project; nothing else.
6. **Daily job**: repository → Settings → Secrets and variables → Actions. Secrets `DATABASE_URL`,
   `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `APP_BASE_URL`; variables
   `S3_BUCKET` and `REMINDERS_ENABLED=true`. Test with **Actions → Document-expiry digest → Run
   workflow**.
7. **Git auto-deploy** (optional, recommended): in each Vercel project → Settings → Git → connect
   `Kadu2728/ComplianceOS` with the matching Root Directory (`apps/api` / `apps/web`). Until then,
   deploys are `vercel deploy --prod` from the CLI.

Verify the API: `curl -i https://compliance-os-api.vercel.app/api/v1/health` →
`{"status":"ok","version":"…"}`; `/api/docs` must be **404** once `APP_ENV=production` is live.

## 2B. Containers: Render blueprint (paid)

Render → **New → Blueprint** → the repository → Render reads `render.yaml` (API service, daily
cron, PostgreSQL 16, region Ohio) and asks for the `sync: false` values from §1. `JWT_SECRET` and
`DATABASE_URL` are generated. The service URL carries a random suffix
(`https://compliance-os-api-XXXX.onrender.com`). Everything else in this runbook is identical.

## 3. Web on Vercel

Done for topology A (§2A step 5). For a custom domain: add it to the web project, then update
`CORS_ORIGINS` / `APP_BASE_URL` on the API project to that origin and redeploy the API. Hobby plan
is for non-commercial use: move to Pro before charging customers.

## 4. First login and smoke test

1. `https://compliance-os-web-gilt.vercel.app/criar-conta` → create the first account and
   organization; the welcome flow leads to the diagnostic.
2. Confirm: password-reset e-mail arrives (SMTP), a file uploads and downloads (S3), `/historico`
   shows the actions, `https://<api>/api/v1/health` returns the version.
3. Run the digest workflow once by hand (Actions → Run workflow) and read its log.
4. Optional demo organization (never on a customer instance): from a machine with the production
   `DATABASE_URL`, `uv run python scripts/seed_demo.py --password '<strong password>'`.

## 5. Operations

- **Migrations** run on every boot before the server accepts traffic (idempotent). Every migration
  ships with a tested `downgrade`; to roll back code *and* schema: redeploy the previous commit,
  then run `alembic downgrade <previous revision>` with the production `DATABASE_URL`.
- **Backups**: Neon keeps point-in-time history (24 h on Free); Render PostgreSQL daily backups on
  paid plans. Take a manual export before a release that adds a migration. Bucket versioning on.
- **Logs**: single lines with `request_id`; the web app forwards `X-Request-ID` so a user's report
  maps to one API log line. Never log bodies (D19).
- **Secrets rotation**: `JWT_SECRET` rotation logs every user out (access 15 min, refresh cookies
  invalid). SMTP/S3 keys rotate in the dashboard; redeploy picks them up.
- **Rate limiter** (D23) is in-memory: one instance, one worker. Before scaling out, back it with
  Redis and record it in D23.
- **Compliance Room** (D36): public links are served by the same API; the limiter caveat applies.
- **Agent LLM** (D35): off until D13 and the D35 legal review are recorded.

## 6. Data residency (read before onboarding customers)

In topology A everything (API, web functions, database) runs in São Paulo. In topology B the database lives in the host's region (Render: Ohio, US). LGPD treats this as an
international transfer of the customers' personal data (member names, e-mails, and whatever they
type into risks and documents) — legal basis and contractual safeguards are part of D12/D13
(sources-v1.md B4) and require human legal review. Neon offers **São Paulo (`aws-sa-east-1`)** on the
free plan, but the free API instances have no Brazilian region and every page issues several queries:
API in Washington + database in São Paulo costs ~0.5 s per page. The data-in-Brazil pair is
**Google Cloud Run `southamerica-east1` + Neon `aws-sa-east-1`** (same image; Cloud Run's free quota
covers a beta, a billing account with a card is required) — adopt it when the legal review demands
it, not before.

## 7. Not automated on purpose

Account creation, secrets and payment details are typed by a person in each provider's dashboard;
nothing in this repository can create accounts or hold credentials.
