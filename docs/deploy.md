# COMPLIANCE OS — DEPLOY RUNBOOK

Decision D17 (2026-09-17, amended the same day). Two supported topologies share the same code,
image and environment; only the host of the API changes.

| | **A — Free beta** (default) | **B — Paid** |
|---|---|---|
| Web | Vercel Hobby (`apps/web`, `gru1`) | Vercel Pro |
| API | **Koyeb** free instance (Docker, Washington D.C.) | **Render** Starter (blueprint `render.yaml`, Ohio) |
| PostgreSQL | **Neon** Free (`aws-us-east-1`, next to Washington) | Render PostgreSQL |
| Files | **Backblaze B2** (10 GB free, S3 API, no card) | any S3-compatible bucket |
| E-mail | **Brevo** or **Resend** free SMTP tier | any SMTP relay |
| Daily job | **GitHub Actions** (`.github/workflows/reminders.yml`) | Render cron (in the blueprint) |
| Monthly cost | R$ 0 while inside the free quotas | ≈ US$ 14 + storage |

The browser only talks to the web domain: the Next.js BFF (`/api/v1/*`) proxies to the API, so
cookies stay first-party and the API's CORS list contains one origin.

```
browser ── https://app.<domain> (Vercel, gru1) ──BFF──> https://<api host> (Koyeb or Render)
                                                                │              │
                                                     Neon / Render PostgreSQL   S3 bucket · SMTP
                                     08:00 BRT: GitHub Actions (A) or Render cron (B) → send_reminders.py
```

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
| `PORT` | `8000` (Koyeb and Render inject their own; the image honours it) | host |

`APP_ENV=production` turns on the guards: the service will not start without HTTPS cookies, SMTP,
S3, a database URL and a 32+ character secret — CI proves this on every push.

## 2A. Free beta: Neon + Koyeb + B2 + SMTP + GitHub Actions

1. **Neon** (neon.com, free, no card): New project → region **AWS US East (N. Virginia)** (same
   coast as the Koyeb free instance; see §6 for São Paulo). Copy the **direct** connection string
   (toggle "Connection pooling" off). Free plan: 0.5 GB storage, compute scales to zero after 5 min
   (first query after idle takes ~1 s).
2. **Backblaze B2** (free 10 GB, no card): create a private bucket, then an application key limited
   to it. Note the S3 endpoint (`https://s3.<region>.backblazeb2.com`) and region.
3. **SMTP**: Brevo (300 e-mails/day) or Resend (3 000/month) — create the SMTP credentials and
   verify the sender domain (SPF/DKIM) so reset and invitation e-mails do not land in spam.
4. **Koyeb** (koyeb.com; the free instance may ask for a card to verify identity — a US$ 29 hold
   that is cancelled immediately, no charge): Create Web Service → GitHub → repository
   `Kadu2728/ComplianceOS`, branch `main` → Builder **Dockerfile**, Work directory **`apps/api`**,
   Dockerfile **`Dockerfile`** → Instance **Free** (512 MB, 0.1 vCPU), region **Washington, D.C.** →
   Exposed port **8000** (HTTP) → Health check **HTTP `/api/v1/health`** on port 8000 → Environment
   variables from §1 (`DATABASE_URL`, `JWT_SECRET`, SMTP and S3 values as *secrets*) → Deploy.
   The first deploy runs `alembic upgrade head` and `scripts/seed_content.py` in the entrypoint,
   then serves. Copy the public URL (`https://<app>-<org>.koyeb.app`).

   Free-instance behaviour: it **scales to zero after one hour without traffic**; the next request
   waits for the boot (~10–20 s, migrations included). Acceptable for a beta; the paid instance
   removes it. Auto-deploys on every push to `main`.
5. **Daily job**: repository → Settings → Secrets and variables → Actions. Secrets `DATABASE_URL`,
   `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `APP_BASE_URL`; variables
   `S3_BUCKET` (name only) and `REMINDERS_ENABLED=true` (the workflow is a no-op until this is set).
   Test it once with **Actions → Document-expiry digest → Run workflow**.
6. Continue at §3 (web) with the Koyeb URL as `API_BASE_URL`.

Verify it is *this* API before wiring anything: `curl -i https://<url>/api/v1/health` must return
`{"status":"ok","version":"…"}` with a `strict-transport-security` header and an `x-request-id` in
UUID form. (`compliance-os-api.onrender.com` is an unrelated project with the same name.)

## 2B. Paid: Render blueprint

Render → **New → Blueprint** → the repository → Render reads `render.yaml` (API service, daily
cron, PostgreSQL 16, region Ohio) and asks for the `sync: false` values from §1. `JWT_SECRET` and
`DATABASE_URL` are generated. The service URL carries a random suffix
(`https://compliance-os-api-XXXX.onrender.com`). Everything else in this runbook is identical.

## 3. Web on Vercel

1. Vercel → **Add New → Project** → import the repository → **Root Directory: `apps/web`**
   (`apps/web/vercel.json` pins Next.js and the `gru1` region).
2. Environment variables (Production and Preview): `API_BASE_URL=https://<api host>`. Nothing else —
   the web app holds no secrets.
3. Deploy. Then set the custom domain (`app.<domain>`) and update `CORS_ORIGINS` / `APP_BASE_URL`
   on the API host to that final origin. Hobby plan is for non-commercial use: move to Pro before
   charging customers.

CLI equivalent from `apps/web`: `vercel link` → `vercel env add API_BASE_URL production` →
`vercel --prod`.

## 4. First login and smoke test

1. `https://app.<domain>/criar-conta` → create the first account and organization; the welcome
   flow leads to the diagnostic.
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

In topology A the database lives in N. Virginia (US); in B, in Ohio. LGPD treats this as an
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
