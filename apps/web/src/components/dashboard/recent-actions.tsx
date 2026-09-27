import { ListChecks } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ACTION_STATUS } from "@/lib/domain/labels";
import type { Overview } from "@/lib/domain/queries";
import { fullDateTime, relativeTime } from "@/lib/domain/time";
import { CardError, DashCard, IconTile } from "./card";

/**
 * Card 6 — Últimas ações (visual-v2 §4.5): the five most recently updated actions, any status,
 * with the status pill and a relative time ("há 2 dias") that carries the full date.
 */
export function RecentActionsCard({ actions, className = "" }: { actions: Overview["actions"]["recent"] | null; className?: string }) {
  if (!actions) {
    return (
      <DashCard id="ultimas-acoes" title="Últimas ações" className={className}>
        <CardError what="as ações" />
      </DashCard>
    );
  }
  return (
    <DashCard id="ultimas-acoes" title="Últimas ações" link={{ href: "/acoes", label: "Ver todas" }} className={className}>
      {actions.length === 0 ? (
        <p className="text-body-sm text-text-secondary">
          Nenhuma ação ainda. As ações nascem dos riscos: abra um risco crítico ou alto e use Planejar.{" "}
          <Link href="/riscos" className="font-medium text-primary-text hover:text-primary-text-hover hover:underline">
            Ver riscos
          </Link>
        </p>
      ) : (
        <ul className="-my-2 flex flex-col divide-y divide-border">
          {actions.map((a) => {
            const st = ACTION_STATUS[a.status];
            return (
              <li key={a.id} className="flex min-h-13 flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="max-sm:hidden">
                  <IconTile small>
                    <ListChecks size={16} strokeWidth={1.5} />
                  </IconTile>
                </span>
                <Link
                  href={`/acoes/${a.id}`}
                  className="min-w-0 flex-1 text-body-sm font-medium text-text-primary hover:underline max-sm:line-clamp-2 sm:truncate"
                >
                  {a.title}
                </Link>
                <span className="flex shrink-0 items-center gap-3 sm:contents">
                  <span className="sm:w-[132px]">{st ? <Badge label={st.label} tone={st.tone} icon={st.icon} /> : null}</span>
                  <time dateTime={a.updated_at} title={fullDateTime(a.updated_at)} className="text-caption text-text-muted sm:w-[88px] sm:text-right">
                    <span className="sr-only">Atualizada </span>
                    {relativeTime(a.updated_at)}
                  </time>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}
