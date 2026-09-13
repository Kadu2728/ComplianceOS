# COMPLIANCE OS — ASSESSMENT v1 SCOPE (Diagnóstico)

Owner: Product Strategist. Status: DRAFT for Compliance Researcher (sources) and UX/UI Engineer (wording).
Decisions applied as working defaults: D4 (single `Action`), D5 (no `Control` entity in v1), D6 (this document), D7 (pt-BR), D9 (Evidence attached to Action/Risk), D10 (score v1 — see `score-v1-proposal.md`).
Every regulatory reference in this document is marked `[VERIFY]` and is **not** a claim. Article numbers, resolution numbers and deadlines are deliberately absent — they belong to `docs/regulatory/` after primary-source verification.

---

## 1. Purpose and outcome

The Diagnóstico is the entry of the loop Diagnosticar → Entender → Priorizar → Corrigir → Comprovar → Monitorar. When an organization finishes it, the owner must be able to say:

1. "Sei onde minha empresa está" — a preliminary maturity picture (score with breakdown).
2. "Sei quais são os primeiros riscos e por quê" — each derived risk carries the question, the answer and a plain-language reason (the *Entender* step lives in `help_text`).
3. "Sei o que fazer primeiro" — each risk proposes one remediation action with an expected evidence.

It is a **self-assessment**: answers are declarations, not verified facts. The product must say so (banner on the results page: "Diagnóstico baseado nas suas respostas. Evidências fortalecem o score.").

**ICP (hypothesis, unvalidated):** B2B software companies and SMB technology vendors in Brazil that must show data-protection maturity to larger customers. The question set therefore leans toward what a customer's security/privacy questionnaire asks — inventory, access, vendors, incidents, policies — rather than toward legal theory.

## 2. Sections

Derived from CLAUDE.md §4 areas, grouped so that each section is answerable by one person in one sitting and maps to how customer questionnaires are organized.

| # | pt-BR name | Areas covered (CLAUDE.md §4) | Why grouped this way |
|---|---|---|---|
| 1 | Dados e finalidades | personal data processing | "what do we have and why" precedes everything else |
| 2 | Acesso e armazenamento | data storage, access control | one owner (IT/ops), one mental model |
| 3 | Segurança | security practices | technical controls a customer questionnaire always asks |
| 4 | Fornecedores e terceiros | third parties, vendors | vendor risk is the most common gap in SMB tech |
| 5 | Políticas e registros | privacy policies, documentation | the "prove it" layer |
| 6 | Titulares e incidentes | data subject requests, incidents | both are *response processes*; both are asked by customers |
| 7 | Pessoas e responsabilidades | employee awareness | culture and accountability |

Seven sections is within the 6–8 target of the UX file §17.

## 3. Question budget

- **Full mode:** 42 questions (6 per section). Rationale: ~15–20 minutes at ~25 s per question; enough to derive a meaningful risk map without the questionnaire fatigue that customer security questionnaires (often 100+) produce. Anything beyond 6 per section is deferred to v2 unless the Compliance Researcher finds a gap that creates a Critical risk.
- **Short mode ("Diagnóstico rápido"):** 12 questions, selected by criteria in §4.
- Both numbers are targets, not fixed precision; the Researcher may add/remove ±3 with justification.

## 4. Short mode

Purpose: first value within ~5 minutes (UX file §18). Produces first risks and a **preliminary** score (labeled as such; see `score-v1-proposal.md §6`).

Selection criteria (all must hold): the question (a) has default impact 3 or 4, (b) is answerable by a founder/ops lead without consulting IT, (c) maps to what enterprise procurement asks first, (d) its derived risk has an actionable first step. Selected: DF-01, DF-04, AA-01, AA-03, SE-01, SE-03, FT-01, FT-03, PR-01, TI-01, TI-04, PE-02 (12).

Completing short mode offers "Continuar o diagnóstico completo" without repeating answered questions.

## 5. Answer model

Answer types (single choice):

| Value | Meaning | Risk derivation | Score (completeness) |
|---|---|---|---|
| `sim` | Implemented and in use | no risk | answered |
| `parcial` | Exists but incomplete, informal or not applied everywhere | risk with probability 2 | answered |
| `nao` | Not implemented | risk with probability 3 | answered |
| `nao_se_aplica` | Truly not applicable (requires a one-line justification) | no risk; flagged for review in results | answered |
| `nao_sei` | Unknown | risk with probability 2 + flag "Confirmar" | answered, counted separately as "incerto" |

Optional per answer: a note (≤ 500 chars) and evidence (attach/link). Evidence does not change risk creation; it raises the evidence factor of the score and is shown on the derived risk.

`nao_se_aplica` is deliberately available on every question but requires a justification because self-assessments over-use it; the results page lists all N/A answers for review.

## 6. Per-question schema

```
code                 stable id, e.g. "AA-03" (section prefix + order); never reused across versions
section              1–7
order                int
text                 pt-BR question (final wording: UX/UI Engineer)
help_text            2–3 sentences: why it matters, in plain language (the "Entender" step)
answer_type          fixed set of §5 in v1
short_mode           bool
regulatory_basis     TO BE FILLED BY COMPLIANCE RESEARCHER — source ref into docs/regulatory/sources-v1.md
classification       law | anpd_resolution | anpd_guide | best_practice   — TO BE VERIFIED
expected_evidence    what a customer/auditor would accept
derived_risk.title   pt-BR
derived_risk.category  dados | acesso | seguranca | fornecedores | documentacao | titulares | incidentes | pessoas
derived_risk.impact  1–4 (fixed per question; see §7)
remediation_action.title  pt-BR, one first step
weight               1–3 (score contribution multiplier; default 1; 2 for impact 3; 3 for impact 4)
version              template version this question belongs to
```

## 7. Assessment → Risk derivation (rule-based, deterministic)

1. A risk is created only for answers `nao`, `parcial`, `nao_sei`. Probability comes from the answer (3 / 2 / 2); impact is the question's fixed `impact`.
2. Severity = probability × impact, mapped: **12 → Crítico**, **8–9 → Alto**, **4–6 → Médio**, **1–3 → Baixo**. With P ∈ {2,3} and I ∈ {1..4} this yields: nao×4 Crítico; nao×3 / parcial×4 Alto; nao×2 / parcial×3 / parcial×2 Médio; nao×1 / parcial×1 Baixo. Small, explainable, no hidden weights.
3. "Why this risk exists" is rendered from data, not free text: `"{question.text}" — sua resposta: {answer}. {help_text}`. Nothing is generated.
4. One question → at most one derived risk (`origin_question_code`). If the same underlying gap is asked from two angles, the Researcher must merge questions rather than let two risks appear; duplicates are a content bug.
5. Manual risks coexist: same entity, `source = manual`, probability/impact chosen by the user with the same matrix.
6. Users may edit probability/impact of a derived risk (audit-logged, with the original kept as `derived_probability/impact` for the explanation).
7. Re-assessment (new answers on the same template version): the derived risk is updated, never duplicated. `nao`→`parcial` lowers probability; any→`sim` does **not** close the risk — it moves it to `Em revisão` for the owner to close with evidence (anti-gaming; brand §4 "evidence over claims"); `sim`→`nao` reopens.
8. `nao_sei` risks carry a visible "Confirmar resposta" flag on the risk and count in the score as open.

## 8. Versioning

- `AssessmentTemplate` has immutable published versions (v1, v2 …). An organization's `Assessment` references one version; its responses reference question codes of that version.
- Publishing a new version never alters an org's existing assessment or its derived risks.
- Starting a new assessment on a newer version carries over answers for questions whose `code` and `text` are unchanged (flagged "Revisar"), and asks the rest fresh. Risks already derived keep their origin and are re-linked by code.
- Regulatory content changes (e.g., a resolution update) are template version bumps with a changelog line citing `docs/regulatory/`.

## 9. Activation metrics (baselines to be measured; no targets invented)

assessment_started, short_mode_completed, full_completed, time_to_first_risk, time_to_first_action, share of `nao_sei` answers, share of `nao_se_aplica` answers, abandonment section (where users stop).

## 10. Edge cases

- Abandonment: autosave per answer; the section list shows "3 de 6 respondidas"; resuming lands on the first unanswered question.
- All `nao_sei`: allowed; results page says the diagnosis is inconclusive and lists the questions to confirm; score is shown as preliminary with a high "incerto" share.
- All `nao_se_aplica`: allowed only with justifications; results page asks for review; no risks; score completeness 100 but posture factor undefined → shown as "—" with explanation.
- Multiple members answering: one assessment per organization at a time; any ADMIN/OWNER/MEMBER (D8 draft) may answer; each response records `answered_by`; concurrent edits resolve last-write-wins per question (per-question PATCH).
- Re-taking: allowed any time on the same version (see §7.7).

## 11. Out of scope for v1

ISO 27001 / SOC 2 control mappings; vendor questionnaires sent *to* suppliers; DPIA/RIPD tooling; data mapping/inventory builder (v1 asks whether one exists, it does not build it); cookie scanning; AI-generated questions or recommendations; sector modules (health, finance, education); multi-language questionnaires; branching logic beyond N/A.

## 12. Challenges to `docs/decisions.md`

- D5: agree with excluding `Control` from Score v1. However, `expected_evidence` per question already behaves like a control description; when the catalog is built later, it should be generated from these fields rather than authored separately.
- D9: agree. The Diagnóstico needs evidence attachment on **answers** as well (not only on Actions/Risks); the entity can be the same `Evidence` with a nullable `response_id`. Engineering to confirm.
- No other challenges.

---

## 13. Draft question bank v1 (pt-BR)

Format: **code** · `curto` if in short mode · **I** = impact (1–4) · **E** = expected evidence · **R** = derived risk (category) · **A** = first action. `help_text` is the "Por que importa" line. All regulatory statements are `[VERIFY]`.

### Seção 1 — Dados e finalidades

**DF-01** · curto · I=4
Pergunta: Sua empresa tem um inventário dos dados pessoais que trata (quais dados, de quem, para quê, onde ficam)?
Por que importa: Sem saber quais dados existem, não é possível protegê-los, responder a clientes ou atender pedidos de titulares. Um registro das operações de tratamento pode ser exigido dependendo do porte e do contexto `[VERIFY]`.
E: planilha ou documento de inventário/registro de tratamento, com data. · R: "Dados pessoais tratados sem inventário" (dados) · A: "Levantar os dados pessoais tratados por processo (cliente, colaborador, fornecedor)".

**DF-02** · I=3
Pergunta: Para cada uso de dados pessoais, a empresa sabe explicar a finalidade e a justificativa do tratamento?
Por que importa: Clientes e autoridades perguntam "por que você tem esse dado". Finalidade clara evita coleta excessiva e reduz o que precisa ser protegido `[VERIFY]`.
E: inventário com coluna de finalidade/base. · R: "Finalidades de tratamento não documentadas" (dados) · A: "Registrar finalidade e justificativa por operação no inventário".

**DF-03** · I=3
Pergunta: A empresa coleta apenas os dados necessários para cada finalidade (sem campos "por precaução")?
Por que importa: Dados desnecessários aumentam o impacto de um incidente e o custo de atender titulares.
E: formulários/cadastros revisados; nota de revisão. · R: "Coleta de dados além do necessário" (dados) · A: "Revisar formulários e cadastros removendo campos sem finalidade".

**DF-04** · curto · I=4
Pergunta: A empresa trata dados sensíveis (saúde, biometria, orientação, religião etc.) ou dados de crianças e adolescentes? Se sim, existe cuidado específico para eles?
Por que importa: Esses dados têm tratamento diferenciado e maior impacto em incidentes `[VERIFY]`. Responder "não se aplica" só se a empresa não os trata.
E: inventário marcando dados sensíveis/menores e controles aplicados. · R: "Dados sensíveis ou de menores sem controles específicos" (dados) · A: "Identificar dados sensíveis/menores no inventário e definir controles adicionais".

**DF-05** · I=2
Pergunta: Existe prazo de retenção definido para os dados pessoais, com descarte quando o prazo termina?
Por que importa: Guardar para sempre aumenta risco e custo; descartar cedo demais pode violar obrigações de guarda `[VERIFY]`.
E: tabela de retenção; evidência de descarte. · R: "Dados retidos sem prazo definido" (dados) · A: "Definir prazos de retenção por categoria de dado".

**DF-06** · I=2
Pergunta: A empresa sabe quais dados pessoais são compartilhados com terceiros e com quem?
Por que importa: O compartilhamento é um dos pontos mais perguntados em questionários de clientes e é onde o controle costuma se perder.
E: inventário com coluna de compartilhamento/destinatário. · R: "Compartilhamentos de dados não mapeados" (dados) · A: "Mapear destinatários de dados pessoais por operação".

### Seção 2 — Acesso e armazenamento

**AA-01** · curto · I=4
Pergunta: O acesso a sistemas com dados pessoais é individual (sem contas compartilhadas) e limitado ao necessário para cada função?
Por que importa: Contas compartilhadas impedem saber quem fez o quê; acesso amplo transforma qualquer erro ou vazamento de senha em incidente maior.
E: lista de usuários por sistema com perfil; política de acesso. · R: "Acesso a dados pessoais amplo ou compartilhado" (acesso) · A: "Revisar acessos por sistema aplicando o mínimo necessário".

**AA-02** · I=3
Pergunta: Quando alguém sai da empresa ou muda de função, os acessos são removidos ou ajustados em até poucos dias?
Por que importa: Acessos de ex-colaboradores são uma das causas mais comuns de vazamento evitável.
E: checklist de desligamento; registro de revogações. · R: "Acessos não revogados no desligamento" (acesso) · A: "Criar checklist de desligamento com revogação de acessos".

**AA-03** · curto · I=4
Pergunta: A autenticação em dois fatores (MFA) está ativa nos sistemas críticos (e-mail, nuvem, sistemas com dados de clientes)?
Por que importa: MFA bloqueia a maior parte dos ataques por senha vazada. É a pergunta mais frequente em avaliações de fornecedores.
E: captura de configuração de MFA por sistema. · R: "Sistemas críticos sem MFA" (acesso) · A: "Ativar MFA no e-mail corporativo e nos sistemas com dados de clientes".

**AA-04** · I=3
Pergunta: A empresa sabe onde os dados pessoais ficam armazenados (sistemas, nuvem, planilhas, dispositivos) e evita cópias fora desses locais?
Por que importa: Cópias em planilhas e e-mails são o "armazenamento invisível" que escapa de qualquer controle.
E: inventário com localização; política de uso de dispositivos. · R: "Dados armazenados em locais não controlados" (acesso) · A: "Mapear locais de armazenamento e restringir cópias locais".

**AA-05** · I=3
Pergunta: Existem backups dos dados importantes, com teste de restauração feito ao menos uma vez?
Por que importa: Backup sem teste não é backup. Perda de dados também é um incidente.
E: política/rotina de backup; registro do teste de restauração. · R: "Backups inexistentes ou não testados" (seguranca) · A: "Configurar backup e executar um teste de restauração documentado".

**AA-06** · I=2
Pergunta: Os acessos administrativos (root, admin, donos de conta em nuvem) são poucos, nomeados e revisados periodicamente?
Por que importa: Contas administrativas concentram o maior poder de dano; revisá-las é barato e muito valorizado por clientes.
E: lista de contas administrativas com data da última revisão. · R: "Acessos administrativos sem revisão" (acesso) · A: "Listar contas administrativas e definir revisão trimestral".

### Seção 3 — Segurança

**SE-01** · curto · I=4
Pergunta: Os dados pessoais são protegidos por criptografia em trânsito (HTTPS/TLS) e em repouso nos sistemas principais?
Por que importa: Criptografia é uma medida de segurança amplamente esperada e reduz o impacto de acesso indevido `[VERIFY]`.
E: configuração TLS; configuração de criptografia do banco/armazenamento. · R: "Dados pessoais sem criptografia" (seguranca) · A: "Ativar TLS em todos os endpoints e criptografia em repouso no armazenamento principal".

**SE-02** · I=3
Pergunta: Sistemas, dependências e dispositivos recebem atualizações de segurança de forma regular?
Por que importa: A maioria dos ataques explora vulnerabilidades já corrigidas pelos fabricantes.
E: rotina de atualização; relatório de dependências. · R: "Atualizações de segurança não aplicadas regularmente" (seguranca) · A: "Definir rotina mensal de atualização e verificação de dependências".

**SE-03** · curto · I=3
Pergunta: Os computadores e celulares que acessam dados de clientes têm proteção básica (bloqueio de tela, disco criptografado, antivírus/EDR)?
Por que importa: Um notebook perdido sem criptografia pode ser um incidente notificável `[VERIFY]`.
E: política de dispositivos; inventário de dispositivos com status. · R: "Dispositivos sem proteção básica" (seguranca) · A: "Ativar criptografia de disco e bloqueio automático nos dispositivos".

**SE-04** · I=3
Pergunta: Existem registros (logs) de acesso e alterações nos sistemas com dados pessoais, guardados por um período definido?
Por que importa: Sem logs não há como investigar um incidente nem provar quem acessou o quê.
E: configuração de logs; período de retenção. · R: "Ausência de registros de acesso" (seguranca) · A: "Ativar logs de acesso nos sistemas principais e definir retenção".

**SE-05** · I=2
Pergunta: A empresa já fez alguma verificação de vulnerabilidades ou teste de segurança nos sistemas expostos à internet?
Por que importa: Clientes maiores costumam pedir evidência de testes; verificações periódicas encontram o óbvio antes de um atacante.
E: relatório de scan/pentest com data. · R: "Sistemas expostos sem verificação de vulnerabilidades" (seguranca) · A: "Executar uma verificação de vulnerabilidades nos sistemas expostos".

**SE-06** · I=2
Pergunta: Ambientes de teste e desenvolvimento usam dados fictícios ou anonimizados em vez de dados reais de clientes?
Por que importa: Ambientes de teste têm menos controle e são um vazamento comum em empresas de software.
E: procedimento de geração de dados de teste. · R: "Dados reais em ambientes de teste" (seguranca) · A: "Substituir dados reais por dados fictícios nos ambientes de teste".

### Seção 4 — Fornecedores e terceiros

**FT-01** · curto · I=4
Pergunta: A empresa tem uma lista dos fornecedores e ferramentas que acessam ou armazenam dados pessoais em seu nome?
Por que importa: Você responde pelos dados mesmo quando um fornecedor os processa `[VERIFY]`. Sem lista, não há controle.
E: lista de fornecedores com tipo de dado e finalidade. · R: "Fornecedores com acesso a dados não mapeados" (fornecedores) · A: "Listar fornecedores e ferramentas que tratam dados pessoais".

**FT-02** · I=3
Pergunta: Os contratos com esses fornecedores tratam de proteção de dados (finalidade, segurança, incidentes, fim do contrato)?
Por que importa: Sem cláusulas, você não tem como exigir segurança nem ser avisado de um incidente no fornecedor `[VERIFY]`.
E: contratos ou aditivos com cláusulas de proteção de dados. · R: "Contratos de fornecedores sem cláusulas de proteção de dados" (fornecedores) · A: "Revisar contratos dos fornecedores críticos incluindo cláusulas de proteção de dados".

**FT-03** · curto · I=3
Pergunta: A empresa sabe se dados pessoais são enviados ou armazenados fora do Brasil (nuvem, ferramentas estrangeiras)?
Por que importa: Transferências internacionais têm regras próprias `[VERIFY]` e são perguntadas por clientes. Saber "onde" é o primeiro passo.
E: lista de fornecedores com país/região de armazenamento. · R: "Transferências internacionais não identificadas" (fornecedores) · A: "Identificar país/região de armazenamento de cada fornecedor".

**FT-04** · I=2
Pergunta: Antes de contratar um novo fornecedor que vai tratar dados pessoais, a empresa avalia sua segurança e privacidade?
Por que importa: É mais barato avaliar antes do que trocar depois. Clientes perguntam como você seleciona fornecedores.
E: checklist de avaliação de fornecedor. · R: "Fornecedores contratados sem avaliação de privacidade" (fornecedores) · A: "Criar checklist mínimo de avaliação para novos fornecedores".

**FT-05** · I=2
Pergunta: Quando um fornecedor deixa de ser usado, a empresa garante a devolução ou exclusão dos dados?
Por que importa: Dados esquecidos em fornecedores antigos continuam sendo responsabilidade sua.
E: registro de encerramento com confirmação de exclusão. · R: "Dados retidos por fornecedores encerrados" (fornecedores) · A: "Incluir exclusão de dados no procedimento de encerramento de fornecedor".

**FT-06** · I=2
Pergunta: A empresa sabe quais fornecedores usam subcontratados para tratar seus dados?
Por que importa: A cadeia de terceiros é onde a visibilidade acaba; perguntar é o mínimo.
E: informação de subcontratados por fornecedor crítico. · R: "Subcontratados de fornecedores desconhecidos" (fornecedores) · A: "Perguntar aos fornecedores críticos sobre subcontratados".

### Seção 5 — Políticas e registros

**PR-01** · curto · I=4
Pergunta: A empresa tem uma política de privacidade pública, atualizada, que descreve o que faz com os dados pessoais?
Por que importa: É o documento mais visível para clientes e titulares; desatualizada, vira risco de contradição `[VERIFY]`.
E: link da política com data de atualização. · R: "Política de privacidade ausente ou desatualizada" (documentacao) · A: "Publicar ou atualizar a política de privacidade".

**PR-02** · I=3
Pergunta: Existe uma política interna de segurança da informação e proteção de dados conhecida pelos colaboradores?
Por que importa: Sem regra escrita, cada pessoa decide sozinha o que é aceitável.
E: política interna aprovada; registro de divulgação. · R: "Ausência de política interna de segurança e privacidade" (documentacao) · A: "Redigir uma política interna curta e divulgá-la".

**PR-03** · I=3
Pergunta: Os principais documentos de compliance têm responsável e data de revisão definidos?
Por que importa: Documento sem dono envelhece; clientes checam a data.
E: lista de documentos com responsável e validade. · R: "Documentos de compliance sem responsável ou revisão" (documentacao) · A: "Atribuir responsável e data de revisão a cada documento".

**PR-04** · I=2
Pergunta: A empresa consegue reunir, em pouco tempo, as evidências que um cliente pede em um questionário de segurança/privacidade?
Por que importa: É o gatilho comercial mais comum; demora custa contratos.
E: pasta/sistema de evidências organizado. · R: "Evidências dispersas e difíceis de reunir" (documentacao) · A: "Centralizar evidências por tema em um único local".

**PR-05** · I=2
Pergunta: Os procedimentos operacionais que envolvem dados pessoais (cadastro, suporte, cobrança) estão descritos, ainda que brevemente?
Por que importa: Procedimento escrito é o que permite treinar, auditar e corrigir.
E: procedimentos documentados. · R: "Processos com dados pessoais não documentados" (documentacao) · A: "Descrever os 3 processos com mais dados pessoais".

**PR-06** · I=2
Pergunta: A empresa mantém registro das decisões e mudanças relevantes de compliance (quem decidiu, quando, por quê)?
Por que importa: Histórico é o que transforma uma afirmação em prova.
E: registro de decisões/atas. · R: "Ausência de histórico de decisões de compliance" (documentacao) · A: "Iniciar um registro simples de decisões de compliance".

### Seção 6 — Titulares e incidentes

**TI-01** · curto · I=4
Pergunta: Existe um canal claro para titulares (clientes, usuários, colaboradores) fazerem pedidos sobre seus dados, com alguém responsável por responder?
Por que importa: Titulares têm direitos sobre seus dados `[VERIFY]`; sem canal e responsável, pedidos se perdem e viram reclamação.
E: canal publicado (e-mail/formulário); responsável nomeado. · R: "Sem canal para pedidos de titulares" (titulares) · A: "Publicar um canal de contato e designar responsável".

**TI-02** · I=3
Pergunta: A empresa consegue localizar, corrigir, exportar ou excluir os dados de uma pessoa específica quando solicitado?
Por que importa: Receber o pedido é fácil; conseguir atender depende de saber onde os dados estão (ver DF-01).
E: procedimento de atendimento; exemplo de pedido atendido. · R: "Incapacidade de atender pedidos de titulares" (titulares) · A: "Testar o atendimento de um pedido de acesso e exclusão de ponta a ponta".

**TI-03** · I=2
Pergunta: Os pedidos de titulares são registrados com data de recebimento e de resposta?
Por que importa: Prazo e registro são o que comprova que a empresa responde `[VERIFY]`.
E: registro de pedidos. · R: "Pedidos de titulares sem registro" (titulares) · A: "Criar registro de pedidos com datas".

**TI-04** · curto · I=4
Pergunta: Existe um plano do que fazer em caso de incidente com dados pessoais (quem aciona, quem decide, como comunicar)?
Por que importa: Incidentes podem exigir comunicação à autoridade e aos titulares em prazo curto `[VERIFY]`; sem plano, o tempo se perde.
E: plano de resposta a incidentes com responsáveis. · R: "Sem plano de resposta a incidentes" (incidentes) · A: "Redigir um plano de resposta a incidentes de uma página com responsáveis".

**TI-05** · I=3
Pergunta: Os colaboradores sabem reconhecer e reportar um possível incidente (e-mail suspeito, dispositivo perdido, acesso indevido)?
Por que importa: A maioria dos incidentes é percebida primeiro por uma pessoa, não por um sistema.
E: comunicado/treinamento; canal de reporte. · R: "Colaboradores não sabem reportar incidentes" (incidentes) · A: "Divulgar como reportar incidentes internamente".

**TI-06** · I=2
Pergunta: Incidentes anteriores (mesmo pequenos) foram registrados com causa e ação corretiva?
Por que importa: Registro de incidentes é evidência de maturidade e evita repetição.
E: registro de incidentes. · R: "Incidentes não registrados" (incidentes) · A: "Criar registro de incidentes com causa e correção".

### Seção 7 — Pessoas e responsabilidades

**PE-01** · I=3
Pergunta: Existe uma pessoa nomeada como responsável por proteção de dados na empresa, com contato divulgado?
Por que importa: Alguém precisa ser o ponto de contato para titulares, autoridade e clientes. A obrigatoriedade e as dispensas dependem do porte e do contexto `[VERIFY]`.
E: nomeação; contato publicado. · R: "Sem responsável por proteção de dados" (pessoas) · A: "Nomear responsável e publicar o contato".

**PE-02** · curto · I=3
Pergunta: Os colaboradores receberam orientação básica sobre proteção de dados e segurança nos últimos 12 meses?
Por que importa: Erro humano é a causa mais comum de incidente; orientação periódica é o controle mais barato.
E: material e lista de presença/registro. · R: "Colaboradores sem orientação em proteção de dados" (pessoas) · A: "Realizar uma orientação de 30 minutos e registrar presença".

**PE-03** · I=2
Pergunta: Colaboradores e prestadores assinam termo de confidencialidade e uso aceitável de sistemas?
Por que importa: Formaliza responsabilidades e é evidência frequentemente pedida por clientes.
E: termos assinados. · R: "Ausência de termos de confidencialidade" (pessoas) · A: "Adotar termo de confidencialidade para colaboradores e prestadores".

**PE-04** · I=2
Pergunta: Novos colaboradores recebem orientação de segurança e privacidade na entrada?
Por que importa: O primeiro dia define hábitos; onboarding é o momento mais eficiente.
E: checklist de onboarding com item de privacidade. · R: "Onboarding sem orientação de privacidade" (pessoas) · A: "Incluir orientação de privacidade no onboarding".

**PE-05** · I=2
Pergunta: A liderança revisa periodicamente (ao menos anualmente) a situação de compliance e decide prioridades?
Por que importa: Sem revisão, compliance vira projeto abandonado; clientes perguntam sobre governança.
E: ata ou registro da revisão. · R: "Ausência de revisão periódica pela liderança" (pessoas) · A: "Agendar revisão anual de compliance com a liderança".

**PE-06** · I=1
Pergunta: Existe um lugar único onde a empresa acompanha riscos, ações e evidências de compliance?
Por que importa: Fragmentação (planilhas, e-mails, pastas) é o que faz o controle se perder.
E: sistema/pasta única em uso. · R: "Gestão de compliance fragmentada" (pessoas) · A: "Centralizar riscos, ações e evidências em um único lugar".

Totals: 7 sections × 6 = 42 questions; short mode 12; impact distribution I=4: 9, I=3: 15, I=2: 17, I=1: 1.

---

## HANDOFF TO ORCHESTRATOR

**STATUS:** NEEDS_REVIEW (content complete; sources and wording pending)
**DECISION:** Adopt the 7-section, 42-question v1 with a 12-question short mode, the 5-value answer model and the deterministic P×I derivation of §7.
**RATIONALE:** Smallest set that produces a risk map covering what enterprise questionnaires ask, with every risk explainable from data.
**EVIDENCE:** None empirical — structure follows CLAUDE.md §4 areas and the UX/brand constraints; question count is a judgment call to be validated by abandonment metrics.
**ASSUMPTIONS:** ICP hypothesis; respondents are founders/ops leads; one assessment per org at a time.
**RISKS:** Self-assessment optimism (mitigated by evidence factor and `Em revisão` rule); questions that sound legal without a source (every such line is `[VERIFY]`); duplicate risks from overlapping questions (Researcher must merge).
**DEPENDENCIES:** Compliance Researcher fills `regulatory_basis` + `classification` per question and flags any question that must be removed or reworded; UX/UI Engineer finalizes wording and help text; human legal review before beta.
**NEXT STEP:** Researcher pass on the 42 questions against `docs/regulatory/sources-v1.md`.
