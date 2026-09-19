import Link from "next/link";
import { PrioritiesList } from "@/components/domain/priorities-list";
import type { Priorities } from "@/lib/domain/queries";

/**
 * "O que fazer primeiro" card of the Visão geral (D30): title, "Ver todas" link, the one-line
 * explanation of the ordering and the list. Server component; `prio` null renders the
 * unavailable message. Extracted from `(app)/page.tsx` so the landing showcase renders the
 * exact same composition instead of a copy.
 */
export function PrioritiesPanel({
  prio,
  compact = true,
  className = "",
}: {
  prio: Priorities | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  return (
    <section aria-labelledby="prioridades" className={`rounded-lg border border-border bg-surface-elevated p-5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="prioridades" className="text-h3">O que fazer primeiro</h2>
        <Link href="/acoes?status=pendentes" className="text-body-sm text-info-text hover:underline">Ver todas</Link>
      </div>
      <p className="mt-1 text-caption text-text-secondary">Ordenado por risco reduzido, contexto do perfil, urgência e esforço. O número verde é o ganho estimado no score ao concluir com evidência.</p>
      {prio ? <PrioritiesList prio={prio} compact={compact} /> : <p className="mt-3 text-body-sm text-text-secondary">Prioridades indisponíveis no momento.</p>}
    </section>
  );
}
