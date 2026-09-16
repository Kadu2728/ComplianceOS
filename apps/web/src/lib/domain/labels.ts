import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CalendarX,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleCheckBig,
  CircleDot,
  CircleEllipsis,
  CircleSlash,
  FileQuestion,
  Info,
  OctagonAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

/** pt-BR labels + icons for domain enums (docs/design/tokens.md §7). Color is never the only signal. */

export type Tone = "danger" | "warning" | "info" | "success" | "neutral";

export const SEVERITY: Record<string, { label: string; tone: Tone; icon: LucideIcon }> = {
  critico: { label: "Crítico", tone: "danger", icon: OctagonAlert },
  alto: { label: "Alto", tone: "warning", icon: TriangleAlert },
  medio: { label: "Médio", tone: "info", icon: CircleAlert },
  baixo: { label: "Baixo", tone: "neutral", icon: Info },
};

export const RISK_STATUS: Record<string, { label: string; tone: Tone; icon: LucideIcon }> = {
  aberto: { label: "Aberto", tone: "neutral", icon: Circle },
  em_andamento: { label: "Em andamento", tone: "info", icon: CircleDot },
  em_revisao: { label: "Em revisão", tone: "warning", icon: CircleEllipsis },
  resolvido: { label: "Resolvido", tone: "success", icon: CircleCheck },
  aceito: { label: "Aceito", tone: "neutral", icon: ShieldCheck },
};

export const ACTION_STATUS: Record<string, { label: string; tone: Tone; icon: LucideIcon }> = {
  a_fazer: { label: "A fazer", tone: "neutral", icon: Circle },
  em_andamento: { label: "Em andamento", tone: "info", icon: CircleDot },
  em_revisao: { label: "Em revisão", tone: "warning", icon: CircleEllipsis },
  concluida: { label: "Concluída", tone: "success", icon: CircleCheck },
  bloqueada: { label: "Bloqueada", tone: "danger", icon: CircleSlash },
};

export const CATEGORY: Record<string, string> = {
  dados: "Dados e finalidades",
  acesso: "Acesso e armazenamento",
  seguranca: "Segurança",
  fornecedores: "Fornecedores e terceiros",
  documentacao: "Políticas e registros",
  titulares: "Titulares",
  incidentes: "Incidentes",
  pessoas: "Pessoas e responsabilidades",
};

export const PROBABILITY: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" };
export const IMPACT: Record<number, string> = { 1: "Baixo", 2: "Moderado", 3: "Alto", 4: "Severo" };

/** Same matrix as the API (docs/product/assessment-v1-scope.md §7) — preview only; the API decides. */
export function previewSeverity(p: number, i: number): keyof typeof SEVERITY {
  const s = p * i;
  return s >= 12 ? "critico" : s >= 8 ? "alto" : s >= 4 ? "medio" : "baixo";
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}

export function isOverdue(due: string | null | undefined, done: boolean): boolean {
  if (!due || done) return false;
  const today = new Date().toISOString().slice(0, 10);
  return due.slice(0, 10) < today;
}

/** Label-only maps, safe to pass across the server → client boundary. */
/** Document status is derived by the API from review state + validity (D26). */
export const DOCUMENT_STATUS: Record<string, { label: string; tone: Tone; icon: LucideIcon }> = {
  atualizado: { label: "Atualizado", tone: "success", icon: CircleCheck },
  vencendo: { label: "Vencendo", tone: "warning", icon: CalendarClock },
  vencido: { label: "Vencido", tone: "danger", icon: CalendarX },
  faltante: { label: "Faltante", tone: "danger", icon: FileQuestion },
  em_revisao: { label: "Em revisão", tone: "info", icon: CircleEllipsis },
};

export const DOCUMENT_CATEGORY: Record<string, string> = {
  politica: "Política",
  procedimento: "Procedimento",
  contrato: "Contrato",
  registro: "Registro",
  treinamento: "Treinamento",
  certificacao: "Certificação",
  outro: "Outro",
};

export const DOCUMENT_REVIEW_STATE: Record<string, { label: string; hint: string }> = {
  vigente: { label: "Vigente", hint: "O documento existe e está em uso" },
  em_revisao: { label: "Em revisão", hint: "Está sendo revisado ou atualizado" },
  faltante: { label: "Faltante", hint: "Ainda não existe — registre a lacuna" },
};

export const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
  viewer: "Leitura",
};

/** Control maturity ladder (D27): planejado → parcial → implementado → verificado; inativo aside. */
export const CONTROL_STATUS: Record<string, { label: string; tone: Tone; icon: LucideIcon; hint: string }> = {
  planejado: { label: "Planejado", tone: "neutral", icon: Circle, hint: "Definido, ainda não existe na prática" },
  parcial: { label: "Parcial", tone: "warning", icon: CircleDot, hint: "Existe em parte da operação" },
  implementado: { label: "Implementado", tone: "info", icon: CircleCheck, hint: "Em uso; falta comprovar" },
  verificado: { label: "Verificado", tone: "success", icon: CircleCheckBig, hint: "Em uso e comprovado com evidência" },
  inativo: { label: "Inativo", tone: "neutral", icon: CircleSlash, hint: "Desativado ou substituído" },
};
export const CONTROL_KIND: Record<string, string> = {
  preventivo: "Preventivo",
  detectivo: "Detectivo",
  corretivo: "Corretivo",
};
export const EFFORT: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };
export const EVIDENCE_VALIDITY: Record<string, { label: string; tone: Tone }> = {
  vigente: { label: "Vigente", tone: "success" },
  vencendo: { label: "Vencendo", tone: "warning" },
  vencida: { label: "Vencida", tone: "danger" },
};
export const SEGMENT: Record<string, string> = {
  software_saas: "Software / SaaS",
  servicos: "Serviços",
  comercio: "Comércio",
  industria: "Indústria",
  saude: "Saúde",
  educacao: "Educação",
  financeiro: "Financeiro",
  outro: "Outro",
};
export const HEADCOUNT: Record<string, string> = {
  ate_9: "Até 9 pessoas",
  de_10_a_49: "10 a 49",
  de_50_a_199: "50 a 199",
  acima_de_200: "200 ou mais",
};
export const CUSTOMER_TYPE: Record<string, string> = { b2b: "Empresas (B2B)", b2c: "Pessoas físicas (B2C)", ambos: "Ambos" };
export const TRISTATE: Record<string, string> = { sim: "Sim", nao: "Não", nao_sei: "Não sei" };
export const DATA_CATEGORY: Record<string, string> = {
  cadastrais: "Cadastrais (nome, CPF, endereço)",
  contato: "Contato (e-mail, telefone)",
  financeiros: "Financeiros / pagamento",
  saude: "Saúde",
  biometricos: "Biométricos",
  criancas_adolescentes: "Crianças e adolescentes",
  geolocalizacao: "Geolocalização",
  comportamentais: "Comportamentais / navegação",
  credenciais: "Credenciais de acesso",
};

export const RISK_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(RISK_STATUS).map(([k, v]) => [k, v.label]),
);
export const ACTION_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ACTION_STATUS).map(([k, v]) => [k, v.label]),
);
export const CONTROL_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(CONTROL_STATUS).map(([k, v]) => [k, v.label]),
);
