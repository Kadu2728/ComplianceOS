/**
 * Root-route decision (landing vs. application), kept pure so the middleware stays thin and the
 * rule is unit-tested. An anonymous visitor at `/` is shown the landing (rewrite to `/inicio`,
 * URL unchanged); anyone carrying the access cookie keeps the Visão geral at `/`. The refresh
 * cookie is path-scoped to `/api/v1/auth` and therefore invisible here by design (decision D3):
 * after the 15-minute access cookie lapses the visitor sees the landing and its "Entrar" link.
 */
export const LANDING_PATH = "/inicio";

export function shouldShowLanding(pathname: string, hasAccessCookie: boolean): boolean {
  return pathname === "/" && !hasAccessCookie;
}
