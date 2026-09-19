import type { AuditEntry } from "@/lib/domain/activity";
import type { Priorities, Radar, RoomPublic } from "@/lib/domain/queries";
import type { Score } from "@/lib/domain/score";
import type { PlanRecommendation } from "@/components/domain/plan-summary";
import type { RiskRow } from "@/components/domain/risk-table";

/**
 * Illustrative data for the landing showcase: a fictional organization ("Acme Tecnologia Ltda.",
 * the seed's name) rendered through the real product components. Numbers follow the formulas and
 * rounding of `apps/api/app/services/score.py` (v2) so the card is internally coherent — the unit
 * test in `src/lib/__tests__/marketing-fixtures.test.ts` re-derives the score from the factors.
 * Dates are relative to `now` so nothing ever reads as overdue by accident. Ids are `demo-*`
 * (not UUIDs): they only feed inert links inside `aria-hidden` figures.
 */

const DAY = 86_400_000;

const isoDay = (now: Date, days: number) => new Date(now.getTime() + days * DAY).toISOString().slice(0, 10);
const isoAt = (now: Date, ms: number) => new Date(now.getTime() + ms).toISOString();

export const DEMO_ORGANIZATION = "Acme Tecnologia Ltda.";

const PEOPLE = {
  ana: { membership_id: "demo-m1", name: "Ana Souza" },
  bruno: { membership_id: "demo-m2", name: "Bruno Lima" },
  diego: { membership_id: "demo-m3", name: "Diego Santos" },
  carla: { membership_id: "demo-m4", name: "Carla Mendes" },
} as const;

/** Score v2: Riscos 40% · Controles 20% · Execução 15% · Diagnóstico 10% · Evidências 15% (service order B, K, C, A, D). */
export function demoScore(now: Date): Score {
  return {
    available: true,
    score: 74,
    score_version: "v2",
    preliminary: false,
    assessment_completed: true,
    computed_at: now.toISOString(),
    band: { key: "organizado", label: "Organizado" },
    delta: { diff: 6, previous_score: 68, previous_at: isoAt(now, -30 * DAY) },
    factors: [
      // 100 × (1 − 44/128) = 65.625 → 65.6; 0.40 × 65.6 → 26.2. Penalty 44 = 2×12 + 2×6 + 2×3 + 2×1.
      { key: "B", label: "Riscos", weight: 0.4, value: 65.6, contribution: 26.2, summary: "8 riscos abertos · peso 44 de 128", item_count: 8, items: [] },
      // (2 × 1 + 2 × 0.5) / 4 = 75 → 15.0.
      { key: "K", label: "Controles", weight: 0.2, value: 75, contribution: 15, summary: "2 de 4 riscos críticos/altos com controle implementado · 2 com controle parcial", item_count: 2, items: [] },
      // 0.5 × 100 (every critical/high risk has an action) + 0.5 × 85 (17 of 20 actions on time) = 92.5 → 13.9.
      { key: "C", label: "Execução", weight: 0.15, value: 92.5, contribution: 13.9, summary: "cobertura 100% dos riscos críticos/altos · 3 ações atrasadas de 20", item_count: 3, items: [] },
      { key: "A", label: "Diagnóstico", weight: 0.1, value: 100, contribution: 10, summary: "42 de 42 perguntas respondidas · 2 respostas “não sei”", item_count: 1, items: [] },
      // 12 / 20 = 60 → 9.0.
      { key: "D", label: "Evidências", weight: 0.15, value: 60, contribution: 9, summary: "12 de 20 itens fechados com evidência", item_count: 8, items: [] },
    ],
    top_reducers: [
      {
        reason: "open_critico",
        title: "2 riscos críticos em aberto",
        points: 7.5,
        count: 2,
        refs: [
          { kind: "risk", id: "demo-r1", title: "Sistemas críticos sem MFA" },
          { kind: "risk", id: "demo-r2", title: "Dados sensíveis ou de menores sem controles específicos" },
        ],
      },
      {
        reason: "missing_evidence",
        title: "8 itens fechados sem evidência",
        points: 6,
        count: 8,
        refs: [
          { kind: "action", id: "demo-a1", title: "Configurar backup e executar um teste de restauração documentado" },
          { kind: "action", id: "demo-a2", title: "Publicar ou atualizar a política de privacidade" },
          { kind: "risk", id: "demo-r3", title: "Planilha de clientes compartilhada por link público" },
        ],
      },
      {
        reason: "open_alto",
        title: "2 riscos altos em aberto",
        points: 3.75,
        count: 2,
        refs: [
          { kind: "risk", id: "demo-r4", title: "Acessos não revogados no desligamento" },
          { kind: "risk", id: "demo-r5", title: "Sem plano de resposta a incidentes" },
        ],
      },
    ],
    next_actions: [
      { kind: "risk", id: "demo-r1", label: "Tratar “Sistemas críticos sem MFA”" },
      { kind: "action", id: "demo-a1", label: "Anexar evidência a “Configurar backup e executar um teste de restauração documentado”" },
      { kind: "risk", id: "demo-r4", label: "Tratar “Acessos não revogados no desligamento”" },
    ],
  };
}

/** Radar texts are the service's own (`services/radar.py`); order = tone, then count. */
export function demoRadar(now: Date): Radar {
  return {
    computed_at: isoDay(now, 0),
    all_clear: false,
    counts: { danger: 2, warning: 1, info: 0 },
    items: [
      { kind: "action_overdue", count: 3, tone: "danger", title: "3 ações atrasadas", reason: "Atualize o prazo ou conclua.", route: "actions:overdue" },
      { kind: "risk_critical", count: 2, tone: "danger", title: "2 riscos críticos em aberto", reason: "Maior impacto potencial; trate ou planeje primeiro.", route: "risks:critical" },
      { kind: "control_without_evidence", count: 2, tone: "warning", title: "2 controles implementados sem evidência", reason: "Um controle sem prova não sustenta uma auditoria nem um questionário de cliente.", route: "controls:implementado" },
    ],
  };
}

type PriorityItem = Priorities["items"][number];

function priorityItems(now: Date): PriorityItem[] {
  return [
    {
      action_id: "demo-a3",
      title: "Ativar MFA no e-mail corporativo e nos sistemas com dados de clientes",
      status: "em_andamento",
      risk_id: "demo-r1",
      risk_title: "Sistemas críticos sem MFA",
      risk_severity: "critico",
      control_id: "demo-c1",
      owner: PEOPLE.bruno,
      due_date: isoDay(now, 12),
      effort: "medio",
      points: 0,
      score_gain: 6,
      reasons: ["reduz um risco crítico", "vence em 12 dias", "esforço médio"],
    },
    {
      action_id: "demo-a4",
      title: "Restringir a pasta de atestados ao RH e definir prazo de guarda",
      status: "a_fazer",
      risk_id: "demo-r2",
      risk_title: "Dados sensíveis ou de menores sem controles específicos",
      risk_severity: "critico",
      control_id: null,
      owner: PEOPLE.carla,
      due_date: isoDay(now, 18),
      effort: "baixo",
      points: 0,
      score_gain: 4,
      reasons: ["reduz um risco crítico", "vence em 18 dias", "esforço baixo"],
    },
    {
      action_id: "demo-a5",
      title: "Criar checklist de desligamento com revogação de acessos",
      status: "a_fazer",
      risk_id: "demo-r4",
      risk_title: "Acessos não revogados no desligamento",
      risk_severity: "alto",
      control_id: null,
      owner: PEOPLE.bruno,
      due_date: isoDay(now, 20),
      effort: "baixo",
      points: 0,
      score_gain: 3,
      reasons: ["reduz um risco alto", "vence em 20 dias", "esforço baixo"],
    },
    {
      action_id: "demo-a6",
      title: "Revisar contratos dos fornecedores críticos incluindo cláusulas de proteção de dados",
      status: "em_andamento",
      risk_id: "demo-r6",
      risk_title: "Contratos de fornecedores sem cláusulas de proteção de dados",
      risk_severity: "medio",
      control_id: null,
      owner: PEOPLE.diego,
      due_date: isoDay(now, 40),
      effort: "alto",
      points: 0,
      score_gain: 1,
      reasons: ["reduz um risco médio", "vence em 40 dias", "esforço alto"],
    },
  ];
}

/** `limit` = 3 for the hero (compact panel), 4 for the "Entenda o que importa" story. */
export function demoPriorities(now: Date, limit: 3 | 4): Priorities {
  return {
    computed_at: now.toISOString(),
    current_score: 74,
    due_soon_days: 7,
    total_pending: 17,
    profile_complete: true,
    unplanned: [],
    items: priorityItems(now).slice(0, limit),
  };
}

function demoRisk(now: Date, r: Pick<RiskRow, "id" | "title" | "category" | "probability" | "impact" | "severity" | "status" | "owner"> & { due: number; resolved?: number }): RiskRow {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    probability: r.probability,
    impact: r.impact,
    severity: r.severity,
    status: r.status,
    owner: r.owner,
    due_date: isoDay(now, r.due),
    resolved_at: r.resolved == null ? null : isoAt(now, r.resolved * DAY),
    description: null,
    treatment: null,
    expected_evidence: null,
    suggested_action: null,
    origin_question_code: null,
    answer_uncertain: false,
    source: "assessment",
    created_at: isoAt(now, -60 * DAY),
    updated_at: isoAt(now, -1 * DAY),
  };
}

/** Six rows of the Riscos list: titles from the v1 catalogue; the resolved one is dated in the past. */
export function demoRisks(now: Date): RiskRow[] {
  return [
    demoRisk(now, { id: "demo-r1", title: "Sistemas críticos sem MFA", category: "acesso", probability: 3, impact: 4, severity: "critico", status: "em_andamento", owner: PEOPLE.bruno, due: 12 }),
    demoRisk(now, { id: "demo-r2", title: "Dados sensíveis ou de menores sem controles específicos", category: "dados", probability: 3, impact: 4, severity: "critico", status: "aberto", owner: PEOPLE.carla, due: 18 }),
    demoRisk(now, { id: "demo-r4", title: "Acessos não revogados no desligamento", category: "acesso", probability: 2, impact: 4, severity: "alto", status: "aberto", owner: PEOPLE.bruno, due: 20 }),
    demoRisk(now, { id: "demo-r5", title: "Sem plano de resposta a incidentes", category: "incidentes", probability: 2, impact: 4, severity: "alto", status: "em_andamento", owner: PEOPLE.diego, due: 25 }),
    demoRisk(now, { id: "demo-r7", title: "Backups inexistentes ou não testados", category: "seguranca", probability: 3, impact: 3, severity: "alto", status: "resolvido", owner: PEOPLE.bruno, due: -10, resolved: -12 }),
    demoRisk(now, { id: "demo-r6", title: "Contratos de fornecedores sem cláusulas de proteção de dados", category: "fornecedores", probability: 2, impact: 2, severity: "medio", status: "em_andamento", owner: PEOPLE.diego, due: 40 }),
  ];
}

/** Recommendation shown in "Transforme risco em ação" (catalogue control CTL-AA-MFA). */
export const DEMO_PLAN: PlanRecommendation = {
  planned: true,
  existing_action: { id: "demo-a3", title: "Ativar MFA no e-mail corporativo e nos sistemas com dados de clientes" },
  control: {
    code: "CTL-AA-MFA",
    title: "Autenticação multifator nos sistemas críticos",
    description: "MFA ativo no e-mail corporativo, na nuvem e nos sistemas com dados de clientes.",
    exists: true,
    already_linked: true,
  },
  action_title: "Ativar MFA no e-mail corporativo e nos sistemas com dados de clientes",
  default_due_date: "",
  default_owner_membership_id: PEOPLE.bruno.membership_id,
  expected_evidence: "Captura da configuração de MFA por sistema",
  basis: "Recomendação do catálogo para o risco “Sistemas críticos sem MFA”",
};

/** The one action row rendered under the plan (same action the recommendation points to). */
export function demoPlanAction(now: Date) {
  return { title: DEMO_PLAN.action_title!, status: "em_andamento", owner: PEOPLE.bruno.name, due_date: isoDay(now, 12), effort: "medio" } as const;
}

/** "Conecte controle e evidência": one verified control, one valid evidence, one current document. */
export function demoControlGraph(now: Date) {
  return {
    control: { title: "Revogação de acessos no desligamento e na mudança de função", status: "verificado", kind: "preventivo", category: "acesso" },
    evidence: { title: "Checklist de desligamento assinado — RH", kind: "Link", validity: "vigente", valid_until: isoDay(now, 300) },
    document: { name: "Política Interna de Segurança e Privacidade", category: "politica", version: "2.1", status: "atualizado", owner: PEOPLE.diego.name },
  } as const;
}

function entry(now: Date, hoursAgo: number, e: Pick<AuditEntry, "action" | "data"> & { actor?: string | null; entity_title?: string | null; entity_type?: string | null }): AuditEntry {
  return {
    id: `demo-h-${hoursAgo}`,
    action: e.action,
    data: e.data,
    actor_name: e.actor ?? null,
    actor_membership_id: e.actor ? "demo-m" : null,
    actor_user_id: null,
    entity_id: null, // null ⇒ ActivityList renders plain text (no link)
    entity_title: e.entity_title ?? null,
    entity_type: e.entity_type ?? null,
    created_at: isoAt(now, -hoursAgo * 3_600_000),
    request_id: null,
  };
}

/** Six Histórico entries, newest first, described by the product's own sentence builder. */
export function demoActivity(now: Date): AuditEntry[] {
  return [
    entry(now, 2, { action: "room.link_created", data: { label: "Cliente — revisão de segurança" }, actor: PEOPLE.ana.name }),
    entry(now, 5, { action: "room.viewed", data: { label: "Cliente — revisão de segurança" }, actor: null }),
    entry(now, 24, { action: "control.updated", data: { status: { to: "verificado" } }, actor: PEOPLE.bruno.name, entity_title: "Autenticação multifator nos sistemas críticos", entity_type: "control" }),
    entry(now, 26, { action: "evidence.added", data: { kind: "link" }, actor: PEOPLE.bruno.name }),
    entry(now, 48, { action: "action.status_changed", data: { to: "concluida" }, actor: PEOPLE.carla.name, entity_title: "Realizar uma orientação de 30 minutos e registrar presença", entity_type: "action" }),
    entry(now, 72, { action: "document.updated", data: { version: "2.1" }, actor: PEOPLE.diego.name, entity_title: "Política Interna de Segurança e Privacidade", entity_type: "document" }),
  ];
}

/** The public Compliance Room as a visitor would see it (caveat text is the product's own). */
export function demoRoom(now: Date): RoomPublic {
  return {
    organization_name: DEMO_ORGANIZATION,
    title: "Acme Tecnologia — Segurança e privacidade",
    intro: "Documentos e controles que mantemos para proteger os dados dos nossos clientes, atualizados pela equipe de operações.",
    contact_email: "privacidade@acme.example",
    score: { score: 74, band: { key: "organizado", label: "Organizado" }, computed_at: now.toISOString() },
    documents: [
      { id: "demo-d1", name: "Política de Privacidade (site e app)", category: "politica", version: "2.1", status: "atualizado", valid_until: isoDay(now, 300), has_file: false },
      { id: "demo-d2", name: "Plano de Resposta a Incidentes", category: "procedimento", version: "1.0", status: "atualizado", valid_until: isoDay(now, 200), has_file: false },
      { id: "demo-d3", name: "Registro das Operações de Tratamento (ROPA)", category: "registro", version: "3.0", status: "em_revisao", valid_until: null, has_file: false },
    ],
    controls: [
      { id: "demo-c1", title: "Autenticação multifator nos sistemas críticos", status: "verificado", kind: "preventivo", category: "acesso", description: "MFA ativo no e-mail corporativo, na nuvem e nos sistemas com dados de clientes." },
      { id: "demo-c2", title: "Backup com teste de restauração documentado", status: "verificado", kind: "corretivo", category: "seguranca", description: null },
    ],
    link: { label: "Cliente — revisão de segurança", expires_at: isoAt(now, 30 * DAY) },
    generated_at: now.toISOString(),
    caveat: "Indicadores e registros operacionais mantidos pela organização na plataforma Compliance OS. Não constituem certificação, auditoria independente nem atestado de conformidade legal.",
  };
}
