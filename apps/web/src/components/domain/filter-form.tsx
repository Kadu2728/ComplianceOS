"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * A GET form whose selects apply on change. With JavaScript the navigation is client-side
 * (router.push keeps the shell); without it the browser submits the same form (the "Filtrar"
 * button only shows then). Page number is dropped on every change: filters start at page 1.
 */
export function FilterForm({ action, children }: { action: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label="Filtros"
      className="mb-4 flex flex-wrap items-center gap-2"
      onChange={(e) => {
        const data = new FormData(e.currentTarget);
        const q = new URLSearchParams();
        for (const [k, v] of data.entries()) {
          if (typeof v === "string" && v !== "") q.set(k, v);
        }
        const s = q.toString();
        router.push(s ? `${action}?${s}` : action);
      }}
    >
      {children}
      <noscript>
        <button type="submit" className="h-9 rounded-md border border-border px-3 text-body-sm">
          Filtrar
        </button>
      </noscript>
    </form>
  );
}

export const FILTER_SELECT =
  "h-9 max-w-full rounded-md border border-border bg-surface-elevated px-2 text-body-sm text-text-primary";
