# COMPLIANCE OS — AI: THE COMPLIANCE AGENT

Status: foundation implemented in Phase 11 (decision D32); the language-model layer implemented
in Phase 12 (decision D35 — Anthropic Claude, off by default). This file fixes what exists and the
rules the LLM layer satisfies (CLAUDE.md §7, brand §63, Compliance Researcher §27, Senior Software
Engineer §28–§29).

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

- **Attention records** — the bundle also carries `records`: open crítico/alto risks, documents
  needing attention and controls with their proof count (≤ 15 each, ids included), so an answer can
  cite them.

## 1b. What exists (language model, D35)

`apps/api/app/core/llm.py` (provider adapter) + `apps/api/app/services/agent_llm.py` (boundary
and guardrails) + `POST /orgs/{org_id}/agent/ask` + `GET /orgs/{org_id}/agent/status`.

- **One question, one answer.** Body `{question ≤ 500 chars, focus?: {kind: "risk", id}}`. The
  model receives the static system prompt and one user message: the bundle above (JSON, inside
  `<dados_da_organizacao>`) and the question (inside `<pergunta>`). With `focus`, the bundle also
  carries that risk's record (description, treatment, controls, open actions) — fetched through the
  tenant-scoped getter, so a foreign id is a 404 and the model is never called.
- **Structured output.** The model must return `{answer, refs[{kind,id}], interpretation,
  out_of_scope}` (JSON schema enforced by the API). `refs` survive only when the (kind, id) exists
  in the bundle; titles are attached server-side. The UI shows them as "Base:" chips.
- **Claim filter.** Answers matching the forbidden patterns (conformidade garantida, cumpre
  integralmente a LGPD, substitui advogado/DPO/consultor, dispensa revisão jurídica, 100 % conforme)
  are rejected as a whole (`rejected_claim`).
- **Degradation.** Provider disabled, unreachable, over quota, refusal, truncation, invalid JSON or a
  rejected claim: when the question equals a canonical one (accents/punctuation ignored), the
  deterministic answer is returned with `source: "deterministic"`; otherwise HTTP 503 with a pt-BR
  message. The UI keeps the canonical questions available in every case.
- **Audit and logs.** Every question writes `agent.asked` (question truncated to 200 chars, outcome,
  model, input/output tokens, number of refs; never the answer). Logs carry organization id, request
  id, model, outcome, counters and latency — never bundle, question or answer text.
- **Limits.** 6 questions per user per minute, 60 per organization per hour (env-configurable),
  in-memory limiter (D23).
- **UI.** "Agente de compliance" on Visão geral: canonical questions as chips (deterministic, no
  model) and, when the model is enabled, a single free-text field; one answer at a time, with its
  base, an "Inclui interpretação" badge when the model flagged it, the source line and the caveat.
  Risk page: "Entender este risco" (focused question) when the model is enabled. No thread, no
  memory, no chat.

## 2. Rules for the LLM layer (as implemented)

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

User-controlled strings inside the bundle (risk titles, descriptions, notes, document names) are
data: the bundle is a JSON document inside `<dados_da_organizacao>`, the system prompt states that
text inside it is never an instruction, and the output side is enforced regardless of what the model
did — refs are validated against the bundle, claims are filtered, the shape is a schema. The
question itself is the only instruction channel and it is bounded (500 chars, rate-limited,
audited). An injected instruction can at most degrade one answer for the person who asked; it
cannot reach another organization, a file, a token or an endpoint.

## 4. What would change the design

- A conversation (follow-up questions with memory): needs a stored thread per user, retention rules
  in D13 and a re-read of §3 — the bundle would then include model output as context.
- Document analysis (contracts, policies): needs a file-reading boundary and explicit per-file consent
  in the UI; excluded from the bundle by default.
