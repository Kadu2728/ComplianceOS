import Link from "next/link";
import { ACTIVITY_ENTITY_HREF, type AuditEntry, describeActivity } from "@/lib/domain/activity";

const when = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Audit entries as sentences: "Ana Souza mudou o risco “MFA” para Em andamento · 12/09/2026 14:03". */
export function ActivityList({ entries, compact = false }: { entries: AuditEntry[]; compact?: boolean }) {
  return (
    <ol className={`divide-y divide-border ${compact ? "" : "rounded-lg border border-border bg-surface-elevated"}`}>
      {entries.map((e) => {
        const href = ACTIVITY_ENTITY_HREF(e);
        const sentence = describeActivity(e);
        return (
          <li key={e.id} className={`flex flex-col gap-1 ${compact ? "py-2.5" : "px-4 py-3"} text-body-sm md:flex-row md:items-baseline md:justify-between md:gap-4`}>
            <span className="text-text-primary">
              <span className="font-medium">{e.actor_name ?? "Sistema"}</span>{" "}
              {href ? (
                <Link href={href} className="hover:underline">
                  {sentence}
                </Link>
              ) : (
                sentence
              )}
            </span>
            <time dateTime={e.created_at} className="shrink-0 tabular-nums text-caption text-text-secondary">
              {when.format(new Date(e.created_at))}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
