import { CircleCheck, ClipboardList, Clock, ListChecks, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { SeverityDot } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, isOverdue } from "@/lib/domain/labels";
import { isManager, type Overview, type Priorities } from "@/lib/domain/queries";
import { refHref, type Score } from "@/lib/domain/score";
import { CardError, IconTile } from "./card";

type Step = {
  icon: ReactNode;
  title: string;
  text?: ReactNode;
  meta?: ReactNode;
  button?: { href: string; label: string; primary?: boolean };
};

const ICON = { size: 20, strokeWidth: 1.5, "aria-hidden": true } as const;

/**
 * Card 3 — Próximo passo (visual-v2 §4.5): the reference's third slot answers "what do I do next?".
 * First matching case wins: start or finish the diagnóstico (the page's only primary button),
 * then the top-priority action, the riskiest unplanned risk, the score's next step, or "nothing
 * urgent". Viewers never get a write action.
 */
export function NextStepCard({
  assessment,
  prio,
  score,
  role,
  className = "",
}: {
  assessment: Overview["assessment"] | null;
  prio: Priorities | null;
  score: Score | null;
  role: string;
  className?: string;
}) {
  const canAnswer = role !== "viewer";
  const top = prio?.items[0];
  const unplanned = prio?.unplanned[0];
  const next = score?.next_actions?.[0];
  let step: Step;

  if (assessment?.status === "none") {
    step = canAnswer
      ? {
          icon: <ClipboardList {...ICON} />,
          title: "Comece pelo diagnóstico",
          text: "Responda às perguntas por área. O diagnóstico gera seus primeiros riscos, as ações recomendadas e o score.",
          button: { href: "/diagnostico", label: "Iniciar diagnóstico", primary: true },
        }
      : { icon: <ClipboardList {...ICON} />, title: "Diagnóstico não iniciado", text: "Peça a um membro da equipe para iniciar o diagnóstico." };
  } else if (assessment?.status === "in_progress") {
    const pct = assessment.total ? Math.round((assessment.answered / assessment.total) * 100) : 0;
    step = {
      icon: <ClipboardList {...ICON} />,
      title: "Conclua o diagnóstico",
      text: `${assessment.answered} de ${assessment.total} perguntas respondidas. O progresso fica salvo.`,
      meta: (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Progresso do diagnóstico"
          className="h-1.5 overflow-hidden rounded-pill bg-surface-hover"
        >
          <div className="h-full bg-primary-text transition-[width] duration-(--duration-complex) ease-(--ease-out)" style={{ width: `${pct}%` }} />
        </div>
      ),
      button: canAnswer ? { href: "/diagnostico", label: "Continuar diagnóstico", primary: true } : undefined,
    };
  } else if (top) {
    const late = isOverdue(top.due_date, false);
    step = {
      icon: <ListChecks {...ICON} />,
      title: top.title,
      text: top.reasons.join(" · "),
      meta: (
        <ul className="flex flex-col gap-1 text-caption text-text-secondary">
          {top.risk_title ? (
            <li className="flex min-w-0 items-center gap-2">
              {top.risk_severity ? <SeverityDot severity={top.risk_severity} size={8} /> : null}
              <span className="truncate">{top.risk_title}</span>
            </li>
          ) : null}
          <li className="flex flex-wrap items-center gap-x-2">
            <span>{top.owner?.name ?? "Sem responsável"}</span>
            <span aria-hidden>·</span>
            <span className={`inline-flex items-center gap-1 tabular-nums ${late ? "text-danger-text" : ""}`}>
              {late ? <Clock aria-hidden size={12} strokeWidth={1.5} /> : null}
              {top.due_date ? formatDate(top.due_date) : "sem prazo"}
              {late ? " · atrasada" : ""}
            </span>
          </li>
          {top.score_gain != null && top.score_gain > 0 ? (
            <li className="font-medium text-success-text">+{top.score_gain} pts no score ao concluir com evidência</li>
          ) : null}
        </ul>
      ),
      button: { href: `/acoes/${top.action_id}`, label: "Ver ação" },
    };
  } else if (unplanned) {
    step = {
      icon: <TriangleAlert {...ICON} />,
      title: `Planejar: ${unplanned.title}`,
      text: `Risco ${unplanned.severity === "critico" ? "crítico" : "alto"} sem ação planejada.`,
      meta:
        unplanned.score_gain != null && unplanned.score_gain > 0 ? (
          <p className="text-caption font-medium text-success-text">+{unplanned.score_gain} pts no score ao tratar com evidência</p>
        ) : undefined,
      button: isManager(role)
        ? { href: `/riscos/${unplanned.risk_id}#plano`, label: "Planejar" }
        : { href: `/riscos/${unplanned.risk_id}`, label: "Ver risco" },
    };
  } else if (next) {
    step = { icon: <ListChecks {...ICON} />, title: next.label, button: { href: refHref(next), label: "Abrir" } };
  } else if (!prio) {
    // Without the priorities we cannot know that nothing is pending: say so instead of "all clear".
    return (
      <section aria-labelledby="proximo-passo" className={`flex min-w-0 flex-col rounded-lg border border-border bg-surface-elevated p-4 sm:p-6 ${className}`}>
        <p className="mb-3 text-label uppercase text-text-secondary">Próximo passo</p>
        <h2 id="proximo-passo" className="sr-only">
          Próximo passo
        </h2>
        <CardError what="o próximo passo" />
      </section>
    );
  } else {
    step = {
      icon: <CircleCheck {...ICON} className="text-success-text" />,
      title: "Nada urgente agora",
      text: "Nenhuma ação pendente e nenhum risco crítico ou alto sem ação. Mantenha as evidências em dia.",
      button: { href: "/controles", label: "Ver controles" },
    };
  }

  return (
    <section aria-labelledby="proximo-passo" className={`flex min-w-0 flex-col rounded-lg border border-border bg-surface-elevated p-4 sm:p-6 ${className}`}>
      <p className="mb-3 text-label uppercase text-text-secondary">Próximo passo</p>
      <IconTile>{step.icon}</IconTile>
      <h2 id="proximo-passo" className="mt-3 line-clamp-2 text-h3 text-text-primary">
        <span className="sr-only">Próximo passo: </span>
        {step.title}
      </h2>
      {step.text ? <p className="mt-1 line-clamp-3 text-body-sm text-text-secondary">{step.text}</p> : null}
      {step.meta ? <div className="mt-3">{step.meta}</div> : null}
      {step.button ? (
        <div className="mt-auto pt-4">
          <ButtonLink href={step.button.href} variant={step.button.primary ? "primary" : "outline"} className="w-full">
            {step.button.label}
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
