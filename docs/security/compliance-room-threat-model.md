# COMPLIANCE OS — THREAT MODEL: COMPLIANCE ROOM (v1)

Status: written 2026-09-17 for decision D36 (Phase 13). Scope: the shareable, unauthenticated
surface that lets an organization show selected records to outsiders (CLAUDE.md §6, brand §54).
Author role: QA & Security Engineer; reviewed by the Orchestrator. Human legal review of the
copy shown to visitors is still required before real customers (D13, D36).

## 1. What is exposed, to whom

| Asset | Exposed to a visitor holding a valid link | Never exposed |
|---|---|---|
| Organization name, room title, intro text, optional contact e-mail | yes | members, roles, e-mails of members |
| Compliance Score (number, band, date) — when the owner enables it | yes | factors, reducers, history, snapshots |
| Documents **explicitly flagged** by the owner: name, category, version, derived status, validity, file download when the document has a file | yes | unflagged documents, `faltante` documents (cannot be flagged), descriptions, owners, tags |
| Controls **explicitly flagged** and currently implementado/verificado: title, description, kind, category, status | yes | planejado/parcial/inativo controls, linked risks, actions, evidence, owners |
| — | — | risks, actions, evidence records or files, assessment answers, audit log, profile, radar, priorities, agent |

A visitor is anonymous: there is no account, no cookie, no identity. The link is the credential.

## 2. Trust boundaries

- **Link token** — 32 random bytes (`secrets.token_urlsafe`), ≥ 256 bits of entropy, shown once at
  creation, stored only as SHA-256. Lookup is by hash; there is no listing by token. A wrong,
  expired, revoked token, or a disabled room, all answer **404** with the same body — nothing to
  enumerate, nothing to time.
- **Tenant boundary** — the public endpoint resolves the organization *only* through the link's
  room; every subsequent query is scoped by `room.organization_id`. A document id from another
  organization on a valid link is a 404 (composite FK + service check, same rule as the app).
- **Owner boundary** — only the OWNER role (`room.manage`) can enable the room, flag records,
  create or revoke links. Admins can see nothing of the room in v1 (they operate records, sharing
  outside the company is an ownership decision). Enforced server-side on every endpoint.
- **Process boundary** — the public router never imports the session dependencies; it cannot
  accidentally accept a cookie as authority.

## 3. Threats and mitigations

| # | Threat | Mitigation | Residual |
|---|---|---|---|
| T1 | Token guessing / brute force | 256-bit tokens; hash lookup; per-IP rate limit on `/public/rooms/*` (60/min) and downloads (30/min); uniform 404 | Limiter is per process (D23) — a multi-instance deployment needs the shared limiter noted in D23 before exposing the room at scale |
| T2 | Link leakage (forwarded e-mail, screenshot, referrer) | Every link is time-boxed (1–90 days, default 30) and revocable; one link per recipient (label) so a leak is attributable; every view audited with the link id; owner sees view counts and last view | A leaked link is valid until it expires or is revoked; v1 has no viewer identity gate (see §5) |
| T3 | Over-sharing by mistake | Room disabled by default; nothing shared by default; per-record explicit flags with visible state on the management page; the owner's preview renders **exactly** the public payload; `faltante` documents and non-implemented controls are refused at the service | Human error on the flags themselves; the preview is the control |
| T4 | Sensitive content inside a shared file | Only documents the owner flagged are downloadable; files are served with `Content-Disposition: attachment`, `nosniff`, `no-store`; download audited per file | File contents are the customer's responsibility; v1 has no watermark or per-link file scope |
| T5 | Cross-tenant read through the public surface | Organization derived from the link only; all queries scoped; tenancy tests cover the public routes with foreign ids | — |
| T6 | Search engines / caches | `X-Robots-Tag: noindex, nofollow` and `Cache-Control: no-store` on the API; `robots: noindex` metadata and `no-store` fetch on the page; no sitemap entry | Third-party link scanners (chat apps unfurling) still fetch the page; the unfurl shows the title only (no `og:` tags with content) |
| T7 | XSS through owner-written text (intro, titles) | React escapes everything; no HTML rendering; CSP with nonces already in place | — |
| T8 | Abuse of the public endpoint for DoS | Rate limit per IP; small payload (≤ 50 documents, ≤ 50 controls); no file listing beyond flagged files | Bandwidth on downloads — S3 presigning (future) would offload it |
| T9 | Audit poisoning (fake views) | View audit stores only link id and label — no visitor-supplied strings; counters are integers | A bot can inflate `view_count`; it is informative, not a control |
| T10 | Copy implying legal compliance | Fixed caveat on every room ("indicadores operacionais … não constituem certificação"); score shown as *maturity*; no "compliant" wording anywhere; legal review gate (D13) before real customers | Owner-written intro text may make claims — the room shows it as the organization's own statement, visually separated from platform data |
| T11 | Revoked/expired link still cached by a client | `no-store` everywhere; every request re-validates the link | — |
| T12 | Owner account compromise | Existing auth controls (argon2, short access tokens, refresh rotation); every room change audited (`room.*`) so it is visible in Histórico | — |

## 4. Abuse cases checked by tests

- Foreign document id on a valid link → 404; document not flagged → 404 on download; room disabled → 404 for every link; revoked → 404; expired → 404; admin → 403 on every management endpoint; viewer/member → 403.
- Public payload contains no key named `risk`, `action`, `evidence`, `member`, `email` (of members), `owner`.
- Rate limit returns 429 after the configured burst.
- Every public view writes exactly one `room.viewed` audit row with the link id.

## 5. Deliberately out of v1

Viewer identity (e-mail gate / OTP), password-protected links, per-link record scope, watermarked
files, expiring presigned file URLs, NDA acknowledgement step, room analytics beyond counts. Each
is a small extension of `room_links`; none changes the boundaries above.
