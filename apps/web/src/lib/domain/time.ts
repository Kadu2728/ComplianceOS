/**
 * Relative time for activity lists (visual-v2 §4.5 "Últimas ações"): "há 5 minutos", "há 3 horas",
 * "ontem", "anteontem", "há 5 dias"; from 30 days on, the date. Locale pt-BR, zone America/Sao_Paulo.
 */
const RELATIVE = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const DATE = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });
const DATE_TIME = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const DAY_KEY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

/** Whole calendar days between two instants in São Paulo (0 = same day). */
function calendarDays(from: Date, to: Date): number {
  const a = Date.parse(DAY_KEY.format(from));
  const b = Date.parse(DAY_KEY.format(to));
  return Math.round((b - a) / 86_400_000);
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const minutes = Math.round((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return RELATIVE.format(-minutes, "minute");
  const days = calendarDays(then, now);
  if (days === 0) return RELATIVE.format(-Math.floor(minutes / 60), "hour");
  if (days < 30) return RELATIVE.format(-days, "day");
  return DATE.format(then);
}

export function fullDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
