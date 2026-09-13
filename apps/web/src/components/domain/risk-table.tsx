import { Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { paths } from "@/lib/api/schema";
import { RISK_STATUS, SEVERITY, formatDate, isOverdue } from "@/lib/domain/labels";

export type RiskRow =
  paths["/api/v1/orgs/{org_id}/risks"]["get"]["responses"]["200"]["content"]["application/json"]["items"][number];

/** Riscos list (app-shell.md §6): desktop table, stacked cards below md. Server component. */
export function RiskTable({ risks }: { risks: RiskRow[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-border bg-surface-elevated md:block">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-border text-left text-label uppercase text-text-secondary">
              <th className="px-4 py-3 font-medium">Severidade</th>
              <th className="px-4 py-3 font-medium">Risco</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <Row key={r.id} risk={r} />
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {risks.map((r) => (
          <Card key={r.id} risk={r} />
        ))}
      </ul>
    </>
  );
}

function Deadline({ risk }: { risk: RiskRow }) {
  const done = risk.status === "resolvido" || risk.status === "aceito";
  const overdue = isOverdue(risk.due_date, done);
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${overdue ? "text-danger-text" : ""}`}>
      {overdue ? <Clock aria-hidden size={14} strokeWidth={1.5} /> : null}
      {formatDate(risk.due_date)}
      {overdue ? <span className="sr-only">(atrasado)</span> : null}
    </span>
  );
}

function Row({ risk }: { risk: RiskRow }) {
  const sev = SEVERITY[risk.severity]!;
  const st = RISK_STATUS[risk.status]!;
  return (
    <tr className="h-11 border-b border-border last:border-0 hover:bg-surface-hover">
      <td className="px-4">
        <Badge label={sev.label} tone={sev.tone} icon={sev.icon} />
      </td>
      <td className="px-4">
        <Link href={`/riscos/${risk.id}`} className="font-medium text-text-primary hover:underline">
          {risk.title}
        </Link>
      </td>
      <td className="px-4 text-text-secondary">{risk.owner?.name ?? "—"}</td>
      <td className="px-4 text-text-secondary">
        <Deadline risk={risk} />
      </td>
      <td className="px-4">
        <Badge label={st.label} tone={st.tone} icon={st.icon} />
      </td>
    </tr>
  );
}

function Card({ risk }: { risk: RiskRow }) {
  const sev = SEVERITY[risk.severity]!;
  const st = RISK_STATUS[risk.status]!;
  return (
    <li className="rounded-lg border border-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/riscos/${risk.id}`} className="font-medium text-text-primary">
          {risk.title}
        </Link>
        <Badge label={st.label} tone={st.tone} icon={st.icon} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
        <Badge label={sev.label} tone={sev.tone} icon={sev.icon} />
        <span>{risk.owner?.name ?? "Sem responsável"}</span>
        <span>·</span>
        <Deadline risk={risk} />
      </div>
    </li>
  );
}
