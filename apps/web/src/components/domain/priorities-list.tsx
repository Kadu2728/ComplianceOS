import { ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ACTION_STATUS, EFFORT, SEVERITY, formatDate, isOverdue } from "@/lib/domain/labels";
import type { Priorities } from "@/lib/domain/queries";

/**
 * Smart prioritization (D30): the actions that reduce the most risk for the least effort, each
 * with its reasons and the score it would gain; then the high risks that still have no action.
 */
export function PrioritiesList({ prio, compact = false }: { prio: Priorities; compact?: boolean }) {
  const items = compact ? prio.items.slice(0, 5) : prio.items;
  const unplanned = compact ? prio.unplanned.slice(0, 3) : prio.unplanned;
  if (items.length === 0 && unplanned.length === 0) {
    return <p className="mt-3 text-body-sm text-text-secondary">Nenhuma ação pendente e nenhum risco crítico/alto sem ação.</p>;
  }
  return (
    <div className="mt-3 flex flex-col gap-4">
      {items.length > 0 ? (
        <ol className="divide-y divide-border">
          {items.map((it, i) => {
            const st = ACTION_STATUS[it.status]!;
            const late = isOverdue(it.due_date, false);
            return (
              <li key={it.action_id} className="flex flex-col gap-1 py-2.5 text-body-sm">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/acoes/${it.action_id}`} className="font-medium text-text-primary hover:underline">
                    <span className="mr-2 text-caption tabular-nums text-text-secondary">{i + 1}.</span>
                    {it.title}
                  </Link>
                  {it.score_gain != null && it.score_gain > 0 ? (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-caption font-medium tabular-nums text-success-text" title="Ganho estimado no score ao concluir com evidência">
                      <ArrowUpRight aria-hidden size={12} strokeWidth={1.5} />+{it.score_gain}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                  {it.risk_severity ? <Badge label={SEVERITY[it.risk_severity]!.label} tone={SEVERITY[it.risk_severity]!.tone} icon={SEVERITY[it.risk_severity]!.icon} /> : null}
                  <Badge label={st.label} tone={st.tone} icon={st.icon} />
                  <span>{it.owner?.name ?? "Sem responsável"}</span>
                  <span className={`inline-flex items-center gap-1 tabular-nums ${late ? "text-danger-text" : ""}`}>
                    {late ? <Clock aria-hidden size={12} strokeWidth={1.5} /> : null}
                    {it.due_date ? formatDate(it.due_date) : "sem prazo"}
                  </span>
                  {it.effort ? <span>esforço {EFFORT[it.effort]?.toLowerCase()}</span> : null}
                </div>
                <p className="text-caption text-text-secondary">{it.reasons.join(" · ")}</p>
              </li>
            );
          })}
        </ol>
      ) : null}
      {unplanned.length > 0 ? (
        <div>
          <h3 className="text-body-sm font-medium">Riscos críticos/altos sem ação</h3>
          <ul className="mt-1 divide-y divide-border">
            {unplanned.map((r) => {
              const sev = SEVERITY[r.severity]!;
              return (
                <li key={r.risk_id} className="flex items-center justify-between gap-3 py-2 text-body-sm">
                  <Link href={`/riscos/${r.risk_id}`} className="font-medium text-text-primary hover:underline">{r.title}</Link>
                  <span className="flex shrink-0 items-center gap-2 text-caption text-text-secondary">
                    <Badge label={sev.label} tone={sev.tone} icon={sev.icon} />
                    {r.score_gain != null && r.score_gain > 0 ? <span className="tabular-nums text-success-text">+{r.score_gain}</span> : null}
                    <Link href={`/riscos/${r.risk_id}#plano`} className="text-info-text underline underline-offset-2">Planejar</Link>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
