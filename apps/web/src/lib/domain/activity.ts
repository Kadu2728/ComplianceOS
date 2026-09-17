import type { paths } from "@/lib/api/schema";
import { ACTION_STATUS_LABELS, CONTROL_STATUS_LABELS, RISK_STATUS_LABELS, ROLE_LABEL } from "@/lib/domain/labels";

export type AuditEntry =
  paths["/api/v1/orgs/{org_id}/audit-log"]["get"]["responses"]["200"]["content"]["application/json"]["items"][number];

const FIELD: Record<string, string> = {
  title: "título",
  description: "descrição",
  category: "categoria",
  probability: "probabilidade",
  impact: "impacto",
  severity: "severidade",
  owner_membership_id: "responsável",
  due_date: "prazo",
  treatment: "tratamento",
  risk_id: "risco relacionado",
  name: "nome",
  version: "versão",
  review_state: "situação",
  valid_until: "validade",
  tags: "tags",
  url: "link",
  control_id: "controle",
  effort: "esforço",
  kind: "tipo",
  status: "maturidade",
  document_id: "documento",
  review_date: "revisão",
  segment: "segmento",
  headcount_band: "tamanho",
  customer_type: "clientes",
  data_categories: "tipos de dados",
  sells_to_enterprise: "vende para empresas",
  international_transfers: "transferências internacionais",
  systems: "sistemas",
  processes: "processos",
  notes: "observações",
};

function quoted(entry: AuditEntry): string {
  return entry.entity_title ? ` “${entry.entity_title}”` : "";
}

function changedFields(data: Record<string, unknown> | null | undefined): string {
  if (!data) return "";
  const names = Object.keys(data)
    .filter((k) => k !== "reason")
    .map((k) => FIELD[k] ?? k);
  return names.length ? ` (${names.join(", ")})` : "";
}

/** One pt-BR sentence per audit entry, without the actor (rendered separately). */
export function describeActivity(entry: AuditEntry): string {
  const d = (entry.data ?? {}) as Record<string, unknown>;
  switch (entry.action) {
    case "risk.created":
      return d.source === "assessment" ? `identificou o risco${quoted(entry)} no diagnóstico` : `registrou o risco${quoted(entry)}`;
    case "risk.updated":
      return typeof d.reason === "string" && d.reason.startsWith("assessment:")
        ? `atualizou o risco${quoted(entry)} pelo diagnóstico`
        : `editou o risco${quoted(entry)}${changedFields(d)}`;
    case "risk.status_changed":
      return `mudou o risco${quoted(entry)} para ${RISK_STATUS_LABELS[String(d.to)] ?? String(d.to)}`;
    case "action.created":
      return `criou a ação${quoted(entry)}`;
    case "action.updated":
      return `editou a ação${quoted(entry)}${changedFields(d)}`;
    case "action.status_changed":
      return `mudou a ação${quoted(entry)} para ${ACTION_STATUS_LABELS[String(d.to)] ?? String(d.to)}`;
    case "evidence.added":
      return `anexou uma evidência (${d.kind === "file" ? "arquivo" : d.kind === "link" ? "link" : d.kind === "document" ? "documento" : "nota"})`;
    case "document.created":
      return `adicionou o documento${quoted(entry)}`;
    case "document.updated":
      return `editou o documento${quoted(entry)}${changedFields(d)}`;
    case "document.file_uploaded":
      return `enviou um arquivo para o documento${quoted(entry)}`;
    case "document.deleted":
      return `removeu o documento “${String(d.name ?? "")}”`;
    case "evidence.deleted":
      return "removeu uma evidência";
    case "control.created":
      return `registrou o controle${quoted(entry)}`;
    case "control.updated":
      return typeof (d.status as { to?: string } | undefined)?.to === "string"
        ? `mudou o controle${quoted(entry)} para ${CONTROL_STATUS_LABELS[String((d.status as { to: string }).to)] ?? String((d.status as { to: string }).to)}`
        : `editou o controle${quoted(entry)}${changedFields(d)}`;
    case "control.deleted":
      return `removeu o controle “${String(d.title ?? "")}”`;
    case "control.linked":
      return `vinculou o controle${quoted(entry)} ao risco “${String(d.risk_title ?? "")}”`;
    case "control.unlinked":
      return `desvinculou o controle${quoted(entry)} de um risco`;
    case "risk.planned":
      return `planejou o risco${quoted(entry)} (controle e ação em um passo)`;
    case "profile.updated":
      return `atualizou o perfil da organização${changedFields(d)}`;
    case "agent.asked":
      return d.outcome === "answered" || d.outcome === "deterministic"
        ? `perguntou ao agente: “${String(d.question ?? "")}”`
        : `perguntou ao agente (sem resposta: ${String(d.outcome ?? "")})`;
    case "assessment.started":
      return `iniciou o diagnóstico (${d.mode === "short" ? "rápido" : "completo"})`;
    case "assessment.answered":
      return `respondeu a pergunta ${String(d.question ?? "")}`;
    case "assessment.completed":
      return `concluiu o diagnóstico (${Number(d.created ?? 0)} riscos novos, ${Number(d.updated ?? 0)} atualizados)`;
    case "assessment.reopened":
      return "reabriu o diagnóstico";
    case "organization.created":
      return "criou a organização";
    case "organization.updated":
      return `atualizou a organização${changedFields(d)}`;
    case "membership.invited":
      return `convidou ${String(d.email ?? "um membro")} como ${String(d.role ?? "")}`;
    case "membership.accepted":
      return "entrou na organização";
    case "membership.created":
      return `adicionou um membro como ${ROLE_LABEL[String(d.role)] ?? String(d.role ?? "")}`;
    case "membership.role_changed":
      return `alterou o papel de um membro para ${ROLE_LABEL[String(d.to ?? d.role)] ?? String(d.to ?? d.role ?? "")}`;
    case "membership.removed":
      return "removeu um membro";
    default:
      return entry.action;
  }
}

export const ACTIVITY_ENTITY_HREF = (entry: AuditEntry): string | null => {
  if (!entry.entity_id) return null;
  if (entry.entity_type === "risk") return `/riscos/${entry.entity_id}`;
  if (entry.entity_type === "action") return `/acoes/${entry.entity_id}`;
  if (entry.entity_type === "document" && entry.action !== "document.deleted") return `/documentos/${entry.entity_id}`;
  if (entry.entity_type === "control" && entry.action !== "control.deleted") return `/controles/${entry.entity_id}`;
  if (entry.entity_type === "assessment") return "/diagnostico";
  return null;
};
