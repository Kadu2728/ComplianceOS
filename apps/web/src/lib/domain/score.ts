import type { paths } from "@/lib/api/schema";
import type { Tone } from "@/lib/domain/labels";

export type Score =
  paths["/api/v1/orgs/{org_id}/score"]["get"]["responses"]["200"]["content"]["application/json"];
export type ScoreRef = { kind: "risk" | "action" | "assessment" | "evidence"; id?: string | null };

/** Band tones mirror severity semantics (tokens.md §2): never color-only, always with the label. */
export const BAND_TONE: Record<string, Tone> = {
  inicial: "danger",
  estruturando: "warning",
  organizado: "info",
  maduro: "success",
};

/** Where a score item points to. The API describes records, the app owns the routes. */
export function refHref(ref: ScoreRef): string {
  switch (ref.kind) {
    case "risk":
      return ref.id ? `/riscos/${ref.id}` : "/riscos";
    case "action":
      return ref.id ? `/acoes/${ref.id}` : "/acoes";
    case "assessment":
      return "/diagnostico";
    case "evidence":
      return "/riscos";
  }
}

const pt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const day = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });
/** Calendar day (organization timezone) of an instant such as `computed_at`. */
export const formatInstantDay = (iso: string) => day.format(new Date(iso));
export const formatPoints = (n: number) => pt.format(n);
export const formatPercent = (weight: number) => `${Math.round(weight * 100)}%`;
export const formatDelta = (diff: number) => (diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : "0");
