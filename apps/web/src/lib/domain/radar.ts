/**
 * The API describes attention items with a route hint ("risks:critical"); the app owns the URLs.
 * Unknown hints fall back to the overview so a newer API never produces a broken link.
 */
export const RADAR_ROUTES: Record<string, string> = {
  "risks:critical": "/riscos?status=abertos&severity=critico",
  "risks:high": "/riscos?status=abertos&severity=alto",
  "risks:open": "/riscos?status=abertos",
  "risks:review": "/riscos?status=em_revisao",
  "actions:overdue": "/acoes?overdue=1",
  "actions:pending": "/acoes?status=pendentes",
  "actions:blocked": "/acoes?status=bloqueada",
  "controls:implementado": "/controles?status=implementado",
  "evidence:expired": "/controles",
  "evidence:expiring": "/controles",
  "documents:vencido": "/documentos?status=vencido",
  "documents:faltante": "/documentos?status=faltante",
  "documents:vencendo": "/documentos?status=vencendo",
  profile: "/configuracoes#perfil",
  assessment: "/diagnostico",
};

export function radarHref(route: string): string {
  return RADAR_ROUTES[route] ?? "/";
}

/** "3 críticos · 2 alertas · 1 aviso" — the radar counts line (dashboard section and bell). */
export function radarCountsLine(counts: Record<string, number>): string {
  const n = (k: string) => counts[k] ?? 0;
  const part = (k: string, one: string, many: string) => `${n(k)} ${n(k) === 1 ? one : many}`;
  return [part("danger", "crítico", "críticos"), part("warning", "alerta", "alertas"), part("info", "aviso", "avisos")].join(" · ");
}
