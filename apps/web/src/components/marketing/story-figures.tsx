import { Sparkles } from "lucide-react";
import { ActivityList } from "@/components/domain/activity-list";
import { PlanSummary } from "@/components/domain/plan-summary";
import { PrioritiesPanel } from "@/components/domain/priorities-panel";
import { RiskTable } from "@/components/domain/risk-table";
import { Badge } from "@/components/ui/badge";
import { ACTION_STATUS, CATEGORY, CONTROL_KIND, CONTROL_STATUS, DOCUMENT_CATEGORY, DOCUMENT_STATUS, EFFORT, EVIDENCE_VALIDITY, formatDate } from "@/lib/domain/labels";
import { DEMO_PLAN, demoActivity, demoControlGraph, demoPlanAction, demoPriorities, demoRisks } from "@/lib/marketing/fixtures";

export type StoryKey = "risco" | "importa" | "acao" | "evidencia" | "maturidade";

/**
 * The five product fragments of "Veja o risco…" (03-ux-spec §4.6), each a real component (or a
 * composition of the real `Badge` + label maps) on the illustrative fixture. Rendered inside
 * `ProductFigure`, so links and buttons are inert.
 */
export function StoryFigure({ story, now }: { story: StoryKey; now: Date }) {
  switch (story) {
    case "risco":
      // The app table is laid out for the 1200px shell; inside the 7/12 story column its min-content
      // width (five columns × 32px padding) exceeds the frame and the status pills get clipped.
      // Tighter cell padding keeps the real component intact and the row inside the figure.
      return (
        <div className="[&_td]:px-2 [&_th]:px-2">
          <RiskTable risks={demoRisks(now)} />
        </div>
      );
    case "importa":
      return <PrioritiesPanel prio={demoPriorities(now, 4)} compact={false} />;
    case "acao":
      return <PlanFigure now={now} />;
    case "evidencia":
      return <ControlGraphFigure now={now} />;
    case "maturidade":
      return (
        <div className="rounded-lg border border-border bg-surface-elevated">
          <ActivityList entries={demoActivity(now)} />
        </div>
      );
  }
}

function PlanFigure({ now }: { now: Date }) {
  const action = demoPlanAction(now);
  const st = ACTION_STATUS[action.status]!;
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-electric-blue/40 bg-info-tint/40 p-5">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden size={18} strokeWidth={1.5} className="text-info-text" />
          <h2 className="text-h3">Plano recomendado</h2>
        </div>
        <PlanSummary rec={DEMO_PLAN} />
      </section>
      <div className="rounded-lg border border-border bg-surface-elevated p-4">
        <p className="text-body-sm font-medium text-text-primary">{action.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
          <Badge label={st.label} tone={st.tone} icon={st.icon} />
          <span>{action.owner}</span>
          <span className="tabular-nums">{formatDate(action.due_date)}</span>
          <span>esforço {EFFORT[action.effort]?.toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
}

function ControlGraphFigure({ now }: { now: Date }) {
  const g = demoControlGraph(now);
  const control = CONTROL_STATUS[g.control.status]!;
  const evidence = EVIDENCE_VALIDITY[g.evidence.validity]!;
  const document = DOCUMENT_STATUS[g.document.status]!;
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-border bg-surface-elevated p-5">
        <p className="text-label uppercase text-text-secondary">Controle</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-body font-medium text-text-primary">{g.control.title}</h2>
          <Badge label={control.label} tone={control.tone} icon={control.icon} />
        </div>
        <p className="mt-1 text-caption text-text-secondary">
          {CONTROL_KIND[g.control.kind]} · {CATEGORY[g.control.category]} · {control.hint}
        </p>
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-label uppercase text-text-secondary">Evidência</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-body-sm">
            <span className="font-medium text-text-primary">{g.evidence.title}</span>
            <Badge label={evidence.label} tone={evidence.tone} />
          </div>
          <p className="mt-1 text-caption text-text-secondary tabular-nums">
            {g.evidence.kind} · válida até {formatDate(g.evidence.valid_until)}
          </p>
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface-elevated p-5">
        <p className="text-label uppercase text-text-secondary">Documento</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-body font-medium text-text-primary">{g.document.name}</h2>
          <Badge label={document.label} tone={document.tone} icon={document.icon} />
        </div>
        <p className="mt-1 text-caption text-text-secondary">
          {DOCUMENT_CATEGORY[g.document.category]} · versão {g.document.version} · {g.document.owner}
        </p>
      </section>
    </div>
  );
}
