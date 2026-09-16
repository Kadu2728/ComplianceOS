# COMPLIANCE OS — AI: THE COMPLIANCE AGENT

Status: foundation implemented in Phase 11 (decision D32); the language-model layer is **not**
implemented — it depends on decision D35 (provider, region, data boundary). This file fixes what
exists today and the rules any future LLM layer must satisfy (CLAUDE.md §7, brand §63, Compliance
Researcher §27, Senior Software Engineer §28–§29).

## 1. What exists (deterministic, no model)

`apps/api/app/services/agent.py`

- **Context bundle** — `GET /orgs/{org_id}/agent/context` (roles with `audit.read`). A tenant-scoped,
  minimized, JSON-serializable view of the organization: profile (D28), score explanation, radar
  items, top priorities and unplanned high risks, control and document summaries, the last ten
  activity entries (action, actor name, time). It contains **no** e-mails, file contents, tokens,
  member lists or other organizations. This is exactly the material a model would be allowed to see.
- **Canonical questions** — `GET /orgs/{org_id}/agent/questions` and
  `GET /orgs/{org_id}/agent/answers/{key}` (every role): *Quais são meus maiores riscos? · O que devo
  corrigir esta semana? · Por que meu score mudou? · Quais documentos estão faltando ou vencidos? ·
  Quais riscos estão sem ação? · Quais riscos estão sem controle? · Quais ações estão atrasadas? ·
  Quais evidências estão vencendo ou vencidas?* Each answer is computed from the same records the
  pages show and returns `basis` (record refs the UI can link), `caveat` (operational, not legal) and
  `computed_at`. No free-text input exists, so there is no prompt surface and no injection surface.

The web app does not expose a chat. The value the agent will add is *contextual explanation*, and
the deterministic layer already delivers the facts it would explain.

## 2. Rules for the LLM layer (when D35 is decided)

1. **Input = the context bundle, nothing more.** The model never receives raw tables, files,
   evidence contents, e-mails or another organization's data. Add a field to the bundle only with a
   data-minimization note in this file.
2. **Output = assistive, never authoritative.** Every generated text carries the caveat and, where
   it cites facts, the record refs from the bundle. Text that cannot be traced to a ref is labelled as
   interpretation.
3. **No invented obligations.** The model may only reference regulatory sources that exist in
   `docs/regulatory/` with status VERIFIED; anything else must be phrased as "pode ser exigido —
   requer revisão" (Compliance Researcher §5, §25). A post-processing check rejects outputs that
   contain forbidden claims ("está em conformidade", "garante", "substitui").
4. **Human review remains possible.** Generated action plans are proposals: they become records only
   through the existing endpoints (`/plan`, `/actions`, `/controls`), by a person with permission,
   audited like any other change.
5. **Tenant isolation.** The bundle is built inside the request's membership; the model call is
   made per request, never with pooled context. Responses are never cached across organizations.
6. **Logging and retention.** Prompts and completions are logged with the request id and organization
   id only; no bundle contents in logs. Retention follows the provider decision (D35) and the
   Compliance OS legal documents (D13).
7. **Failure mode.** If the model is unavailable, the product falls back to the deterministic answers
   — the feature degrades to what exists today, never to an error page.
8. **Language.** pt-BR, brand voice (precise, direct, no hype), the vocabulary of brand §59.

## 3. Prompt injection posture

The deterministic layer has no prompt. When the LLM layer arrives, user-controlled strings inside the
bundle (risk titles, notes, document names) are data: they are delimited as such in the prompt, and
instructions found inside them are ignored by construction (system prompt states it; the
post-processing check enforces the output side).

## 4. What would change the design

- A customer-facing chat: needs D35 plus a rate limit per organization and a per-message audit entry.
- Document analysis (contracts, policies): needs a file-reading boundary and explicit per-file consent
  in the UI; excluded from the bundle by default.
