export const PAGE_SIZE = 25; // app-shell.md §6

export type PageQuery = { page: number; limit: number; offset: number };

/** Reads `?page=N` (1-based) from a page's searchParams; anything invalid means page 1. */
export function pageQuery(raw: string | string[] | undefined, limit = PAGE_SIZE): PageQuery {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "1", 10);
  const page = Number.isFinite(n) && n >= 1 ? n : 1;
  return { page, limit, offset: (page - 1) * limit };
}
