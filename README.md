# Compliance OS

B2B SaaS for compliance operations. Governance lives in `.claude/` (read `.claude/CLAUDE.md` first); decisions in `docs/decisions.md`.

## Layout

```
apps/web   Next.js 15 · React 19 · TypeScript (strict) · Tailwind CSS 4
apps/api   FastAPI · SQLAlchemy 2 · Pydantic v2 · Alembic · Python 3.12 (managed by uv)
docs/      decisions, architecture, product, regulatory, design
```

## Run locally

Web:

```bash
cd apps/web && npm ci && npm run dev
```

API:

```bash
cd apps/api && uv sync && uv run python scripts/dev_api.py
```

`scripts/dev_api.py` starts an embedded PostgreSQL 16 (no Docker; data in `apps/api/.pgdata`), applies migrations, seeds the assessment content (`app/content/*.json`, idempotent) and runs uvicorn with reload. `GET http://127.0.0.1:8000/api/v1/health` → `{"status":"ok","version":"…"}`. Interactive docs at `/api/docs` outside production.

Copy `.env.example` to `.env` in each app. To use an external PostgreSQL instead, set `DATABASE_URL`, run `uv run alembic upgrade head` and `uv run python scripts/seed_content.py` (release step — a published template version is never modified in place), then `uv run python -m uvicorn app.main:app --reload`.

On Windows the embedded database is started with no console and outside the API's process tree (uvicorn's reloader sends a console-wide Ctrl+C on every restart, and a tree kill of the API would otherwise take the database down); it keeps running after you stop the API. Stop it with `.venv/Lib/site-packages/pgserver/pginstall/bin/pg_ctl -D .pgdata -m fast stop` (Windows) — or just leave it; it is reused next time.

Evidence files are stored under `apps/api/.storage` in development (git-ignored); production storage is decision D12.

Open `http://localhost:3000/criar-conta` to create the first account and organization. Password-reset and invitation e-mails are printed to the API console in development.

## Production notes (pre-beta)

- `APP_ENV=production` requires `JWT_SECRET` (≥ 32 chars) and `COOKIE_SECURE=true`; the API refuses to start otherwise. Interactive docs are disabled in production.
- Run the API behind the web app's `/api/v1` proxy with `uvicorn app.main:app --proxy-headers --forwarded-allow-ips=<web server IP>`, so per-IP rate limits (signup, login, password reset) see the real client from `X-Forwarded-For` rather than the proxy. Never trust forwarded headers from arbitrary addresses.
- Both services send hardening headers (API: `nosniff`, `X-Frame-Options: DENY`, `no-referrer`, `default-src 'none'`, `Cache-Control: no-store`; web: CSP with `frame-ancestors 'none'`, `form-action 'self'`, `object-src 'none'`, plus `nosniff`, `Referrer-Policy`, `Permissions-Policy`). The web CSP still allows inline scripts (Next hydration); a nonce-based policy is a follow-up.
- Known accepted risk: `npm audit` reports postcss ≤ 8.5.22 bundled by Next 15 (build-tool exposure; our CSS is not user-controlled). Fixing it means Next 16 — decision D18a. Python production dependencies: `pip-audit` clean (2026-09-13).
- Still pending before real customers: production e-mail (D11), database/object storage/region (D12), human legal review of assessment content and score labels (F1–F5).

## Quality gates (same commands CI runs)

```bash
cd apps/web && npm run lint && npm run typecheck && npm run test && npm run build
```

```bash
cd apps/api && uv run ruff check . && uv run ruff format --check . && uv run python -m pytest
```

Note (Windows): run pytest as `python -m pytest`; the `pytest.exe` shim can be blocked by Windows App Control.

## API contract

The API is the source of truth. After changing any route or schema:

```bash
cd apps/api && uv run python scripts/export_openapi.py
```

```bash
cd apps/web && npm run gen:api
```

CI fails if `apps/api/openapi.json` or `apps/web/src/lib/api/schema.d.ts` is stale.
