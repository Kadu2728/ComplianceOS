/**
 * List filters for risks and actions: URL search params → API query string → page hrefs.
 * Pure functions (unit-tested); the API is the authority on what each parameter means.
 */

type Params = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function one(params: Params, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

/** UI status choices → API `status` values (the API takes a list). */
export const RISK_STATUS_FILTERS = {
  abertos: ["aberto", "em_andamento", "em_revisao"],
  aberto: ["aberto"],
  em_andamento: ["em_andamento"],
  em_revisao: ["em_revisao"],
  resolvido: ["resolvido"],
  aceito: ["aceito"],
} as const;
export const RISK_STATUS_FILTER_LABELS: Record<keyof typeof RISK_STATUS_FILTERS, string> = {
  abertos: "Em aberto",
  aberto: "Aberto",
  em_andamento: "Em andamento",
  em_revisao: "Em revisão",
  resolvido: "Resolvido",
  aceito: "Aceito",
};
export const SEVERITIES = ["critico", "alto", "medio", "baixo"] as const;

export type RiskFilters = {
  status?: keyof typeof RISK_STATUS_FILTERS;
  severity?: (typeof SEVERITIES)[number];
  owner?: string;
};

export function parseRiskFilters(params: Params): RiskFilters {
  const status = one(params, "status");
  const severity = one(params, "severity");
  const owner = one(params, "owner");
  return {
    status: status && status in RISK_STATUS_FILTERS ? (status as RiskFilters["status"]) : undefined,
    severity: SEVERITIES.find((s) => s === severity),
    owner: owner && UUID.test(owner) ? owner : undefined,
  };
}

export function riskQuery(f: RiskFilters): string {
  const q = new URLSearchParams();
  for (const s of f.status ? RISK_STATUS_FILTERS[f.status] : []) q.append("status", s);
  if (f.severity) q.append("severity", f.severity);
  if (f.owner) q.append("owner_membership_id", f.owner);
  const s = q.toString();
  return s ? `&${s}` : "";
}

export const ACTION_STATUS_FILTERS = {
  pendentes: ["a_fazer", "em_andamento", "em_revisao", "bloqueada"],
  a_fazer: ["a_fazer"],
  em_andamento: ["em_andamento"],
  em_revisao: ["em_revisao"],
  bloqueada: ["bloqueada"],
  concluida: ["concluida"],
} as const;
export const ACTION_STATUS_FILTER_LABELS: Record<keyof typeof ACTION_STATUS_FILTERS, string> = {
  pendentes: "Pendentes",
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  em_revisao: "Em revisão",
  bloqueada: "Bloqueada",
  concluida: "Concluída",
};

export type ActionFilters = {
  status?: keyof typeof ACTION_STATUS_FILTERS;
  overdue?: boolean;
  owner?: string;
};

export function parseActionFilters(params: Params): ActionFilters {
  const status = one(params, "status");
  const owner = one(params, "owner");
  return {
    status: status && status in ACTION_STATUS_FILTERS ? (status as ActionFilters["status"]) : undefined,
    overdue: one(params, "overdue") === "1" || undefined,
    owner: owner && UUID.test(owner) ? owner : undefined,
  };
}

export function actionQuery(f: ActionFilters): string {
  const q = new URLSearchParams();
  for (const s of f.status ? ACTION_STATUS_FILTERS[f.status] : []) q.append("status", s);
  if (f.overdue) q.append("overdue", "true");
  if (f.owner) q.append("owner_membership_id", f.owner);
  const s = q.toString();
  return s ? `&${s}` : "";
}

/** `/riscos?status=abertos&severity=critico` — only the filters that are set; the base alone otherwise. */
export function filterHref(base: string, filters: Record<string, string | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === false || v === "") continue;
    q.set(k, v === true ? "1" : v);
  }
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export function hasFilters(filters: Record<string, unknown>): boolean {
  return Object.values(filters).some((v) => v !== undefined && v !== false && v !== "");
}
