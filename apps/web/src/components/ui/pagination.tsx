import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

/** "Mostrando 1–25 de 120" + previous/next links (app-shell.md §6). Server component: plain links. */
export function Pagination({ total, limit, offset, href }: { total: number; limit: number; offset: number; href: string }) {
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const last = Math.ceil(total / limit);
  const from = offset + 1;
  const to = Math.min(offset + limit, total);
  // `href` may already carry filters (`/riscos?status=abertos`): append with the right separator.
  const link = (p: number) => (p === 1 ? href : `${href}${href.includes("?") ? "&" : "?"}page=${p}`);
  const cls = "inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-body-sm text-text-primary hover:bg-surface-hover";
  const disabled = "inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-body-sm text-text-secondary opacity-40";
  return (
    <nav aria-label="Paginação" className="mt-4 flex items-center justify-between gap-3 text-body-sm text-text-secondary">
      <span className="tabular-nums">
        Mostrando {from}–{to} de {total}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={link(page - 1)} className={cls} rel="prev">
            <ChevronLeft aria-hidden size={16} strokeWidth={1.5} /> Anterior
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            <ChevronLeft aria-hidden size={16} strokeWidth={1.5} /> Anterior
          </span>
        )}
        {page < last ? (
          <Link href={link(page + 1)} className={cls} rel="next">
            Próxima <ChevronRight aria-hidden size={16} strokeWidth={1.5} />
          </Link>
        ) : (
          <span className={disabled} aria-disabled="true">
            Próxima <ChevronRight aria-hidden size={16} strokeWidth={1.5} />
          </span>
        )}
      </div>
    </nav>
  );
}
