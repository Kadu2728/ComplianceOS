import type { LucideIcon } from "lucide-react";
import { DoorOpen, FileText, Layers, ListChecks, MessageSquareText, Radar as RadarIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconTile } from "./card";

export type ModuleData = {
  agent: { freeText: boolean; questions: number } | null;
  controls: { total: number; verificado: number | null } | null;
  radar: { allClear: boolean; danger: number; warning: number } | null;
  actions: { pending: number; overdue: number } | null;
  documents: { total: number; atualizado: number; attention: number } | null;
  room: { owner: boolean; enabled: boolean | null };
  /** Before the diagnóstico the radar and agent sections are not rendered: no dead anchors. */
  assessed: boolean;
};

type Module = { name: string; icon: LucideIcon; href: string | null; description: string; metric: ReactNode };

const DASH = "—";
const AFTER = <span className="font-normal text-text-muted">Disponível após o diagnóstico</span>;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function modules(d: ModuleData): Module[] {
  return [
    {
      name: "Risk Brain",
      icon: MessageSquareText,
      href: d.assessed ? "#agente" : null,
      // No AI claim unless the model is enabled for this installation (CLAUDE.md §7, D35).
      description: d.agent?.freeText
        ? "Perguntas sobre seus riscos, respondidas por IA a partir dos seus registros."
        : "Perguntas prontas sobre seus riscos, respondidas a partir dos seus registros.",
      metric: !d.assessed ? AFTER : !d.agent ? DASH : d.agent.freeText ? "IA habilitada" : plural(d.agent.questions, "pergunta pronta", "perguntas prontas"),
    },
    {
      name: "Control Graph",
      icon: Layers,
      href: "/controles",
      description: "Relação entre riscos, controles, ações e evidências.",
      metric: !d.controls
        ? DASH
        : d.controls.total === 0
          ? "Nenhum controle ainda"
          : d.controls.verificado == null
            ? DASH
            : `${d.controls.verificado} de ${d.controls.total} verificados`,
    },
    {
      name: "Risk Radar",
      icon: RadarIcon,
      href: d.assessed ? "#radar" : null,
      description: "O que precisa de atenção hoje, com o motivo.",
      metric: !d.assessed ? (
        AFTER
      ) : !d.radar ? (
        DASH
      ) : d.radar.allClear ? (
        "Nada urgente hoje"
      ) : (
        <>
          <span className={d.radar.danger > 0 ? "text-danger-text" : undefined}>{plural(d.radar.danger, "crítico", "críticos")}</span> ·{" "}
          {plural(d.radar.warning, "alerta", "alertas")}
        </>
      ),
    },
    {
      name: "Action Plan",
      icon: ListChecks,
      href: "/acoes",
      description: "Riscos viram ações com responsável e prazo.",
      metric: !d.actions ? (
        DASH
      ) : (
        <>
          {plural(d.actions.pending, "pendente", "pendentes")}
          {d.actions.overdue > 0 ? <span className="text-danger-text"> · {plural(d.actions.overdue, "atrasada", "atrasadas")}</span> : null}
        </>
      ),
    },
    {
      name: "Evidence Vault",
      icon: FileText,
      href: "/documentos",
      description: "Documentos com validade, versão e responsável.",
      metric: !d.documents ? (
        DASH
      ) : d.documents.total === 0 ? (
        "Nenhum documento ainda"
      ) : d.documents.attention > 0 ? (
        <span className="text-warning-text">{plural(d.documents.attention, "precisa de atenção", "precisam de atenção")}</span>
      ) : (
        plural(d.documents.atualizado, "atualizado", "atualizados")
      ),
    },
    {
      name: "Compliance Room",
      icon: DoorOpen,
      href: d.room.owner ? "/sala" : null,
      description: "Mostre sua maturidade a clientes e parceiros.",
      metric: d.room.owner ? (d.room.enabled == null ? DASH : d.room.enabled ? "Publicada" : "Não publicada") : (
        <span className="font-normal text-text-muted">Gerida pelo proprietário da organização</span>
      ),
    },
  ];
}

function Face({ m }: { m: Module }) {
  return (
    <>
      <IconTile>
        <m.icon size={20} strokeWidth={1.5} />
      </IconTile>
      <span className="text-h3 text-text-primary">{m.name}</span>
      <span className="line-clamp-2 text-caption text-text-secondary max-sm:hidden">{m.description}</span>
      <span className="mt-auto text-caption font-medium text-text-primary tabular-nums">{m.metric}</span>
    </>
  );
}

const CARD = "flex h-full min-h-28 flex-col gap-3 rounded-lg border border-border bg-surface-elevated p-4 sm:min-h-42 sm:p-5";

/**
 * Card group 4 — the product's modules (visual-v2 §4.5, §5.5): names stay in English as module
 * names, descriptions in Portuguese and honest, and each card carries a live metric so it is a
 * status, not a decorative tile. Compliance Room is a link only for the owner.
 */
export function ModuleCards({ data, className = "" }: { data: ModuleData; className?: string }) {
  return (
    <section aria-labelledby="modulos" className={className}>
      <h2 id="modulos" className="sr-only">
        Módulos
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6 wide:grid-cols-6">
        {modules(data).map((m) => (
          <li key={m.name}>
            {m.href ? (
              m.href.startsWith("#") ? (
                <a href={m.href} className={`${CARD} transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-hover`}>
                  <Face m={m} />
                </a>
              ) : (
                <Link href={m.href} className={`${CARD} transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-hover`}>
                  <Face m={m} />
                </Link>
              )
            ) : (
              <div className={CARD}>
                <Face m={m} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
