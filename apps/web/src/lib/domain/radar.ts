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
