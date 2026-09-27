/**
 * Client-side helpers for the header search (visual-v2 §5.10). Matching mirrors the API: case- and
 * accent-insensitive, folded per code point so match offsets map back onto the original title.
 */

export type SearchKind = "risk" | "action" | "control" | "document";

export const SEARCH_GROUP_LABEL: Record<SearchKind, string> = {
  risk: "Riscos",
  action: "Ações",
  control: "Controles",
  document: "Documentos",
};

export const SEARCH_HREF: Record<SearchKind, (id: string) => string> = {
  risk: (id) => `/riscos/${id}`,
  action: (id) => `/acoes/${id}`,
  control: (id) => `/controles/${id}`,
  document: (id) => `/documentos/${id}`,
};

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;

function foldChar(ch: string): string {
  const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return base.length === 1 ? base : ch.toLowerCase();
}

/** Splits `title` into [before, match, after] around the first folded match of `query`, or null. */
export function splitMatch(title: string, query: string): [string, string, string] | null {
  const chars = Array.from(title);
  const folded = chars.map(foldChar);
  const needle = Array.from(query.trim()).map(foldChar);
  if (needle.length === 0) return null;
  for (let i = 0; i + needle.length <= folded.length; i++) {
    let hit = true;
    for (let j = 0; j < needle.length; j++) {
      if (folded[i + j] !== needle[j]) {
        hit = false;
        break;
      }
    }
    if (hit) {
      return [chars.slice(0, i).join(""), chars.slice(i, i + needle.length).join(""), chars.slice(i + needle.length).join("")];
    }
  }
  return null;
}

/** Today in São Paulo as YYYY-MM-DD, to flag overdue actions like the API does. */
export function todayInSaoPaulo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}
