# COMPLIANCE OS — REGULATORY SOURCES REGISTER v1

Owner: Compliance Researcher (not a lawyer; this is not legal advice). Last verified: **2026-09-12**.
Purpose: the only place from which assessment questions, help text, risk copy and score labels may cite a legal or regulatory basis (CLAUDE.md §8, decision D6). Nothing in the product may assert an obligation that is not traceable to an entry here with status VERIFIED.

Verification statuses used below:
- **VERIFIED** — the primary text was fetched from an official domain in this session and the facts were read from it.
- **PARTIAL** — existence, number, date and subject verified on an official index page; the body text was **not** read (fetch failed or not attempted). Facts marked ⚠ come from secondary summaries and must be re-verified before use.
- **UNVERIFIED** — could not be reached; recorded so the gap is explicit.

Fetch failures this session (for the record): `planalto.gov.br` (ECONNRESET, 3 attempts), `in.gov.br` (socket hang up, 2 attempts), `camara.leg.br` (HTTP 429), `normas.leg.br` (empty body). The Ministry of Justice digital library and `gov.br/anpd` responded.

---

## A. Statute

### A1. Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)
- **SOURCE:** consolidated text at `https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm` (also `.../l13709compilado.htm`).
- **AUTHORITY:** Presidência da República / Congresso Nacional. **PUBLICATION:** 14 Aug 2018 (DOU 15 Aug 2018). **EFFECTIVE:** staged; fully in force including sanctions since 2021 ⚠ (dates to be confirmed on the primary text).
- **STATUS: PARTIAL.** Direct fetch failed; the search engine returned indexed excerpts of the Planalto page for two articles:
  - **REGULATORY FACT (art. 37, excerpt):** controller and operator "devem manter registro das operações de tratamento de dados pessoais que realizarem, especialmente quando baseado no legítimo interesse."
  - **REGULATORY FACT (art. 48, excerpt):** the controller must communicate to the authority and to the data subject a security incident "que possa acarretar risco ou dano relevante", "em prazo razoável, conforme definido pela autoridade nacional", with minimum content (nature of data, security measures, mitigation measures).
- **Articles the product will need and that were NOT read this session (UNVERIFIED — verify article numbers and wording before citing):** principles (art. 6), legal bases (art. 7), sensitive data (art. 11), children and adolescents (art. 14), end of processing and retention (arts. 15–16), data-subject rights (art. 18) and response form/timing (art. 19), international transfer (art. 33), impact report (art. 38), operator (art. 39), encarregado (art. 41), security measures (art. 46), good practices and governance (art. 50), sanctions (art. 52), ANPD competence to issue simplified rules for micro and small enterprises (art. 55-J).
- **SCOPE:** any natural or legal person processing personal data in Brazil or of persons in Brazil (to be confirmed on art. 3).
- **PRODUCT IMPACT:** underpins every section of the assessment; but until the text is read, questions may only say "pode ser exigido `[VERIFY]`".
- **CONFIDENCE:** High that the law exists as cited; **Low** for any article-level claim until re-verified.

## B. ANPD regulations (Resoluções CD/ANPD)

Index page (VERIFIED, fetched): `https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd`. It lists (in this order) Resoluções nº 32/2026, 31/2025, 30/2025, 23/2024, 19/2024, 18/2024, 15/2024, 11/2023, 10/2023, 5/2023, 4/2023, 2/2022, 1/2021; Portarias nº 35/2022, 16/2021, 11/2021; Enunciado CD/ANPD nº 1/2023. Numbers absent from the page (3, 6–9, 12–14, 16–17, 20–22, 24–29) are not listed there; the Researcher must not assume they do not exist — check the DOU before stating a list is complete.

### B1. Resolução CD/ANPD nº 2, de 27 de janeiro de 2022 — Regulamento de aplicação da LGPD para agentes de tratamento de pequeno porte
- **SOURCE (VERIFIED, fetched):** `https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022`
- **AUTHORITY:** Conselho Diretor da ANPD. **PUBLICATION:** DOU 28 Jan 2022. **EFFECTIVE:** on publication. **AMENDED BY:** Resolução CD/ANPD nº 15/2024 (art. 14, II).
- **REGULATORY FACTS:**
  - Who qualifies (art. 2º, I–III): "microempresas, empresas de pequeno porte, startups, pessoas jurídicas de direito privado, inclusive sem fins lucrativos [...] bem como pessoas naturais"; ME/EPP per Lei Complementar nº 123/2006; startups per Lei Complementar nº 182/2021.
  - Exclusions (art. 3º): agents that "realizem tratamento de alto risco para os titulares" (except the art. 8º hypothesis) or exceed the revenue limits / belong to a group exceeding them.
  - High-risk criteria (art. 4º): cumulative — a general criterion ("larga escala" or significant effect on rights) **plus** a specific one (emerging technologies; surveillance of publicly accessible areas; decisions solely on automated processing; "dados sensíveis ou de crianças, adolescentes e idosos").
  - Flexibilizations: simplified record of processing (art. 9º); dispensa de encarregado with a mandatory communication channel (art. 11); "política simplificada de segurança da informação" (art. 13); "prazo em dobro" for data-subject requests, incident communication (except risk to physical/moral integrity) and the clear/complete declaration (art. 14, I–III).
- **INTERPRETATION:** A B2B SaaS SMB may qualify — **unless** it processes sensitive data / minors' data at scale or uses emerging technologies at scale; qualification is fact-dependent and self-declared. The product must not decide qualification for the user; it may ask and explain.
- **PRODUCT IMPACT:** DF-04 (sensitive/minors), DF-01 (registro simplificado), PE-01 (encarregado dispensa + canal), TI-01/TI-04 (prazos em dobro), PR-02 (política simplificada). An organization-level attribute "pequeno porte (auto-declarado)" is needed to render the right deadline copy — it must be a **content flag with a verification date**, never a hard-coded rule.
- **CONFIDENCE:** High.

### B2. Resolução CD/ANPD nº 15, de 24 de abril de 2024 — Regulamento de Comunicação de Incidente de Segurança
- **SOURCE (VERIFIED, official text fetched from the MJ digital library):** `https://bibliotecadigital.mj.gov.br/bitstream/1/12879/2/RES_ANPD_2024_15.html`; DOU page `https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-15-de-24-de-abril-de-2024-556243024` (not reachable this session); ANPD channel page (VERIFIED, fetched) `https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis` ("Modificado em 26/08/2026").
- **AUTHORITY:** CD/ANPD. **PUBLICATION:** DOU 26 Apr 2024 (resolution dated 24 Apr 2024). **EFFECTIVE:** on publication.
- **REGULATORY FACTS:**
  - Definition (art. 3º, XII): "qualquer evento adverso confirmado, relacionado à violação das propriedades de confidencialidade, integridade, disponibilidade e autenticidade".
  - When to communicate (art. 5º): cumulative — significant impact on fundamental rights **and** at least one data category among sensitive data; data of children/adolescents/elderly; financial data; authentication data; legally protected data; large-scale data. § 1º examples: "discriminação, violação à integridade física, ao direito à imagem e à reputação, fraudes financeiras ou roubo de identidade".
  - Deadline to ANPD (art. 6º): "três dias úteis" counted "do conhecimento pelo controlador de que o incidente afetou dados pessoais"; information may be complemented within twenty business days (§ 3º); twelve required content items (§ 2º); **doubled** for small-scale agents (§ 8º, referencing Resolução 2/2022).
  - Communication to data subjects (art. 9º): three business days; direct and individualized means preferred; simple language; if broad dissemination is used, minimum three months of visibility; doubled for small-scale agents (§ 6º).
  - Incident register (art. 10): keep a register of **all** incidents, including those not communicated, for a minimum of **five years** from the register date, with eight minimum content elements.
  - Submission channel (ANPD page): SEI!ANPD with Gov.br login, "Formulário de incidente de segurança – preliminar ou completo"; only the encarregado or a legally constituted representative may submit.
- **INTERPRETATION:** Every organization needs (a) a way to recognize an incident, (b) a decision procedure for "risco ou dano relevante", (c) a register even when not communicating. The product's incident features (future) must render deadlines from versioned content with the "pequeno porte" flag.
- **PRODUCT IMPACT:** TI-04, TI-05, TI-06. **NEVER HARD-CODE:** 3 business days, 20 business days, 3 months, 5 years, the doubling rule.
- **CONFIDENCE:** High.

### B3. Resolução CD/ANPD nº 18, de 16 de julho de 2024 — Regulamento sobre a atuação do encarregado
- **SOURCE:** `https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-18-de-16-de-julho-de-2024-572632074` (listed on the ANPD index; fetch failed).
- **STATUS: PARTIAL.** Number, date and subject VERIFIED on the ANPD index. ⚠ From secondary summaries only: formal act of appointment (and substitute); identity and contact disclosed publicly; independence/autonomy; no specific certification required; may accumulate functions absent conflict of interest; DOU publication 17 Jul 2024. **Re-verify each point on the primary text before any product copy.**
- **PRODUCT IMPACT:** PE-01. The question must distinguish "obrigatório indicar" vs "dispensado (pequeno porte, com canal obrigatório — B1 art. 11)" vs "recomendado".
- **CONFIDENCE:** Medium (existence), Low (content).

### B4. Resolução CD/ANPD nº 19, de 23 de agosto de 2024 — Regulamento de Transferência Internacional de Dados + cláusulas-padrão
- **SOURCE (VERIFIED, fetched):** `https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024`
- **PUBLICATION:** DOU 26 Aug 2024; rectification noted 18 Aug 2025. **EFFECTIVE:** on publication.
- **REGULATORY FACTS:** transfer characterized "quando o exportador transferir dados pessoais para o importador" (art. 5); "a coleta internacional de dados não caracteriza transferência internacional" (art. 6); mere transit without communication/shared use is out of scope (art. 8, § 1º, I); mechanisms (art. 9, II): adequacy decision, standard contractual clauses, global corporate rules, specific clauses, other art. 33 LGPD hypotheses; existing contracts had **12 months** from publication to incorporate the ANPD standard clauses (art. 2º, parágrafo único); no special regime for small-scale agents; the controller must publish on its site a plain-Portuguese document about the transfer (art. 17, § 2º: form, duration, purpose, destination country, responsible parties, data-subject rights).
- **Related (PARTIAL):** Resolução CD/ANPD nº 32, de 26 de janeiro de 2026 — recognition of the European Union as providing adequate protection (listed on the index; text not read).
- **INTERPRETATION:** Cloud hosting abroad by a Brazilian SaaS is very likely a transfer under this regulation; the mechanism and the site disclosure are the operational consequences. **This applies to Compliance OS itself (decision D12) and requires human legal review.**
- **PRODUCT IMPACT:** FT-03, FT-02 (clauses), PR-01 (disclosure on the privacy page). Never state that a specific cloud provider "is compliant".
- **CONFIDENCE:** High (facts as read), Medium (interpretation).

### B5. Resolução CD/ANPD nº 4, de 24 de fevereiro de 2023 — Dosimetria e aplicação de sanções administrativas
- **SOURCE:** `https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-4-de-24-de-fevereiro-de-2023-466146077` (listed on the ANPD index; not fetched).
- **STATUS: PARTIAL.** Recorded only because sanction framing appears in brand copy discussions. **The product must not quote fine amounts or percentages** from memory; if severity copy ever references sanctions, read this text first.
- **PRODUCT IMPACT:** none in v1 (brand §62 forbids fear-based messaging).

### B6. Enunciado CD/ANPD nº 1, de 22 de maio de 2023 — dados de crianças e adolescentes
- **SOURCE:** `https://www.in.gov.br/en/web/dou/-/enunciado-cd/anpd-n-1-de-22-de-maio-de-2023-485306934` (listed; not fetched). **STATUS: PARTIAL.**
- **PRODUCT IMPACT:** DF-04 help text must not state which legal basis applies to minors' data until this and art. 14 are read.

## C. ANPD guides (orientation, not binding)

### C1. Guia Orientativo — Segurança da Informação para Agentes de Tratamento de Pequeno Porte (v1.0, Oct 2021)
- **SOURCE (existence and URL VERIFIED via gov.br search; content not read):** `https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte` (PDF `.../guia-vf.pdf`). Published 4 Oct 2021 under art. 55-J, XVIII LGPD ⚠.
- **CLASSIFICATION:** ANPD GUIDE — "recommended", never "required".
- **PRODUCT IMPACT:** the natural source for section 3 (Segurança) and part of section 2 controls (access, MFA, backups, devices, logs). The next Researcher run should read its checklist and map SE-01…SE-06, AA-03, AA-05 to it.

### C2. Guia de Agentes de Tratamento (2ª versão, retificada)
- **SOURCE (URL seen on gov.br search; not read):** `https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/Segunda_Versao_do_Guia_de_Agentes_de_Tratamento_retificada.pdf`. **STATUS: PARTIAL.**
- **PRODUCT IMPACT:** controller/operator roles (FT-01, FT-02 wording: "em seu nome").

Other ANPD guides (cookies, legitimate interest, RIPD, data-subject rights) were **not** searched this session — listed as a gap.

---

## D. NEVER HARD-CODE list

Every item below must live in versioned content (`docs/regulatory/` → seed) with a `last_verified` date and the source id, and be rendered through the organization's "pequeno porte" flag where applicable. None may appear as a constant in application code or in the score engine.

| Item | Value as read | Source | Notes |
|---|---|---|---|
| Incident communication to ANPD | 3 business days from knowledge | B2 art. 6º | doubled for pequeno porte (art. 6º § 8º) |
| Complementing the communication | 20 business days | B2 art. 6º § 3º | |
| Communication to data subjects | 3 business days; 3 months visibility if broad dissemination | B2 art. 9º | doubled for pequeno porte (§ 6º) |
| Incident register retention | minimum 5 years | B2 art. 10 | includes non-communicated incidents |
| Standard clauses adaptation window | 12 months from publication (2024-08-26) | B4 art. 2º p.u. | already elapsed — historical |
| Small-agent qualification thresholds | by reference to LC 123/2006 and LC 182/2021 | B1 art. 2º | revenue limits change by law |
| Data-subject response timing ("imediato"/"15 dias") | ⚠ not read this session | A1 art. 19 | verify before use; doubled for pequeno porte (B1 art. 14, I) |
| Any fine amount or percentage | — | B5 | not to be used in v1 |

## E. Classification legend (how each may be presented in the product)

| Class | Meaning | Allowed product framing (pt-BR) |
|---|---|---|
| LAW | Lei 13.709/2018 text | "A LGPD prevê…" only with a verified article; otherwise "pode ser exigido `[VERIFY]`" |
| ANPD RESOLUTION | binding regulation issued by CD/ANPD | "A regulamentação da ANPD estabelece…" with number/date and `last_verified` |
| ANPD GUIDE | orientation, non-binding | "A ANPD recomenda…" / "Boa prática orientada pela ANPD" — never "exigido" |
| BEST PRACTICE | industry practice without ANPD source | "Prática recomendada" — never attributed to ANPD or to the law |

## F. Items requiring human legal review before beta (not resolvable by this agent)

1. **D12 — Compliance OS's own hosting abroad** (Vercel/Neon/S3 regions): whether it is an international transfer under B4, which mechanism applies, and what the site disclosure (B4 art. 17 § 2º) must say.
2. **D13 — Compliance OS's own privacy policy, terms and processing clauses** as operator of customer data; incident-register and communication procedure for Compliance OS itself (B2 applies to us).
3. **Whether Compliance OS qualifies as pequeno porte** (B1) and whether it must appoint an encarregado (B3) or only a channel.
4. **Every assessment help text** that references an obligation (all `[VERIFY]` lines in `docs/product/assessment-v1-scope.md`), after article-level verification of A1.
5. **Score band labels and the "% controlado" copy** (brand §69) — legal-language risk.

## G. Language guardrails (pt-BR)

Allowed:
- "Pode ser exigido dependendo do porte e do contexto da sua empresa."
- "A regulamentação da ANPD estabelece prazo para comunicar incidentes; confirme o prazo aplicável ao seu caso."
- "A ANPD recomenda…" (guides only)
- "Potencial lacuna identificada." / "Risco que requer atenção." / "Ação recomendada."
- "Diagnóstico baseado nas suas respostas."
- "Score de maturidade" / "indicador de maturidade"
- "Organize evidências de que o controle existe."

Prohibited:
- "Sua empresa está em conformidade com a LGPD." / "Você está X% conforme."
- "A LGPD exige…" without a verified article id in the content record.
- "Você tem 3 dias para…" as a fixed statement (deadline depends on flag and version).
- "Seu compliance está 74% controlado." (until reviewed)
- "Isso garante a conformidade." / "Isso substitui o DPO/advogado."
- "Sua empresa está violando a LGPD."
- Fine amounts or "multa de até…"

## H. Section-level mapping (preliminary; per-question mapping is the next run)

| Assessment section | Primary sources | Status |
|---|---|---|
| 1 Dados e finalidades | A1 (arts. 6, 7, 11, 14, 15–16, 37), B1 art. 9º, B6 | A1 articles UNVERIFIED |
| 2 Acesso e armazenamento | A1 art. 46, C1 | C1 not read |
| 3 Segurança | A1 arts. 46, 49, C1 | C1 not read |
| 4 Fornecedores e terceiros | A1 arts. 33, 39, 42; B4; C2 | B4 VERIFIED |
| 5 Políticas e registros | A1 arts. 9, 37, 50; B1 arts. 9º, 13 | partial |
| 6 Titulares e incidentes | A1 arts. 18, 19, 48; B2; B1 art. 14 | B2 VERIFIED |
| 7 Pessoas e responsabilidades | A1 arts. 41, 50; B3; B1 art. 11 | B3 PARTIAL |

## I. Open questions / uncertainty

- Article-level text of the LGPD could not be read this session; every article number above is from professional familiarity and is **not** verified here.
- Whether the ANPD index page is exhaustive (gaps in numbering).
- Content of B3 (encarregado), B5, B6, C1, C2 not read.
- ANPD regulatory agenda 2025–2026 (Res. 23/2024 as amended by 31/2025) and the 2026–2027 priority map (Res. 30/2025) were not read; changes affecting incidents, encarregado or small agents may be pending.
- Any state-level or sector rules (health, finance, education) are out of v1 scope.

---

## HANDOFF

**QUESTION:** Which primary sources may the v1 assessment cite, and what may never be hard-coded?
**EXECUTIVE FINDING:** Three ANPD regulations were read from primary text (B1 small agents, B2 incidents, B4 international transfer) and are safe to cite with the facts above. The LGPD text itself and three further regulations were not readable this session; article-level claims remain UNVERIFIED and every assessment line referencing them must keep its `[VERIFY]` marker.
**VERIFIED FACTS:** 4 entries VERIFIED (index page, B1, B2 + channel page, B4); 6 PARTIAL (A1, B3, B5, B6, C1, C2); 0 fully UNVERIFIED beyond those.
**SCOPE / EXCEPTIONS:** see B1 (pequeno porte and high-risk exclusion) — qualification is fact-dependent; the product must ask, not decide.
**INTERPRETATION / PRODUCT IMPACT:** an organization-level "pequeno porte (auto-declarado)" flag with verification date; all deadlines as versioned content; incident register as a v2 feature candidate (B2 art. 10 makes it concrete).
**RISK:** citing LGPD articles from memory; presenting guides as obligations; stating deadlines without the doubling rule.
**CONFIDENCE:** High for B1/B2/B4 facts; Low for A1 article numbers.
**SOURCES FETCHED:** ANPD index page; B1 page; B2 official text (MJ library) and ANPD CIS page; B4 page; gov.br search results for C1.
**HANDOFF:** Orchestrator — schedule human legal review items F1–F5; re-attempt A1 fetch (Planalto) in a later session or from a browser; then run the per-question mapping against `docs/product/assessment-v1-scope.md`.
