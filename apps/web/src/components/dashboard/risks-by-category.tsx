import Link from "next/link";
import { SeverityDot } from "@/components/ui/badge";
import { CATEGORY, SEVERITY } from "@/lib/domain/labels";
import type { OverviewCategory } from "@/lib/domain/queries";
import { CardError, DashCard } from "./card";

const ORDER = ["critico", "alto", "medio", "baixo"] as const;
const SHOWN = 5;

/**
 * Card 5 — Riscos por categoria (visual-v2 §4.5): open risks per area, already ordered by the API
 * (worst severity, then count). One dot + the highest severity present, never colour alone; the
 * full per-severity breakdown is read to screen readers.
 */
export function RisksByCategoryCard({
  categories,
  assessed,
  className = "",
}: {
  categories: OverviewCategory[] | null;
  assessed: boolean;
  className?: string;
}) {
  const link = { href: "/riscos?status=abertos", label: "Ver todos" };
  if (!categories) {
    return (
      <DashCard id="riscos-categoria" title="Riscos por categoria" className={className}>
        <CardError what="as categorias" />
      </DashCard>
    );
  }
  const shown = categories.slice(0, SHOWN);
  const more = categories.length - shown.length;
  return (
    <DashCard
      id="riscos-categoria"
      title="Riscos por categoria"
      caption="Riscos em aberto por área"
      link={link}
      footer={
        more > 0 ? (
          <Link href="/riscos?status=abertos" className="hover:underline">
            +{more} {more === 1 ? "área" : "áreas"}
          </Link>
        ) : undefined
      }
      className={className}
    >
      {categories.length === 0 ? (
        <p className="text-body-sm text-text-secondary">{assessed ? "Nenhum risco em aberto." : "As áreas aparecem depois do diagnóstico."}</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {shown.map((c) => {
            const worst = ORDER.find((k) => (c.by_severity[k] ?? 0) > 0) ?? "baixo";
            const s = c.by_severity;
            return (
              <li key={c.category}>
                <Link
                  href="/riscos?status=abertos"
                  className="flex h-10 items-center gap-3 rounded-md px-2 transition-colors duration-(--duration-fast) hover:bg-surface-hover"
                >
                  <span className="min-w-0 flex-1 truncate text-body-sm text-text-primary">{CATEGORY[c.category] ?? c.category}</span>
                  <span className="flex w-24 shrink-0 items-center gap-2 text-body-sm text-text-secondary">
                    <SeverityDot severity={worst} size={8} />
                    {SEVERITY[worst]?.label}
                  </span>
                  <span className="w-8 shrink-0 text-right text-body-sm font-semibold text-text-primary tabular-nums">{c.open}</span>
                  <span className="sr-only">
                    : {c.open} em aberto — {s.critico ?? 0} críticos, {s.alto ?? 0} altos, {s.medio ?? 0} médios, {s.baixo ?? 0} baixos
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}
