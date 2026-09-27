import Link from "next/link";
import { SeverityDot } from "@/components/ui/badge";
import type { Overview } from "@/lib/domain/queries";
import { CardError, CardLink, DashCard } from "./card";

const ROWS = [
  { key: "critico", label: "Críticos" },
  { key: "alto", label: "Altos" },
  { key: "medio", label: "Médios" },
  { key: "baixo", label: "Baixos" },
] as const;

/**
 * Card 2 — Riscos em atenção (visual-v2 §4.5): open risks per severity, each row a filtered link;
 * a zero row is plain muted text. Footer: risks without an owner and in review (v1 "Status atual").
 */
export function RisksAttentionCard({ risks, assessed, className = "" }: { risks: Overview["risks"] | null; assessed: boolean; className?: string }) {
  if (!risks) {
    return (
      <DashCard id="riscos-atencao" title="Riscos em atenção" className={className}>
        <CardError what="os riscos" />
      </DashCard>
    );
  }
  // "Ver todos" lives in the footer: the 3-column card is too narrow for title + link on one line.
  const footer = (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {risks.without_owner > 0 || risks.in_review > 0 ? (
        <>
          <Link href="/riscos?status=abertos" className="hover:underline">
            <span className={`font-semibold tabular-nums ${risks.without_owner > 0 ? "text-warning-text" : "text-text-primary"}`}>{risks.without_owner}</span> sem responsável
          </Link>
          <Link href="/riscos?status=em_revisao" className="hover:underline">
            <span className="font-semibold tabular-nums text-text-primary">{risks.in_review}</span> em revisão
          </Link>
        </>
      ) : null}
      <span className="ml-auto">
        <CardLink href="/riscos?status=abertos">Ver todos</CardLink>
      </span>
    </p>
  );

  return (
    <DashCard
      id="riscos-atencao"
      title="Riscos em atenção"
      caption={assessed ? `${risks.open} em aberto` : undefined}
      footer={footer}
      className={className}
    >
      {!assessed ? (
        <p className="text-body-sm text-text-secondary">Seus riscos aparecem aqui depois do diagnóstico.</p>
      ) : risks.open === 0 ? (
        <p className="text-body-sm text-text-secondary">Nenhum risco em aberto. Revise o diagnóstico periodicamente.</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {ROWS.map((row) => {
            const count = risks.by_severity[row.key] ?? 0;
            const inner = (
              <>
                <SeverityDot severity={row.key} />
                <span className={`flex-1 text-body-sm ${count ? "text-text-primary" : "text-text-muted"}`}>{row.label}</span>
                <span className={`text-body-sm font-semibold tabular-nums ${count ? "text-text-primary" : "text-text-muted"}`}>{count}</span>
              </>
            );
            return (
              <li key={row.key}>
                {count > 0 ? (
                  <Link
                    href={`/riscos?status=abertos&severity=${row.key}`}
                    className="flex h-10 items-center gap-3 rounded-md px-2 transition-colors duration-(--duration-fast) hover:bg-surface-hover"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex h-10 items-center gap-3 px-2">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}
