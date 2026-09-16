import { CircleAlert, Info, Radar as RadarIcon, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { Radar } from "@/lib/domain/queries";
import { radarHref } from "@/lib/domain/radar";

const TONE = {
  danger: { icon: CircleAlert, text: "text-danger-text", ring: "border-danger-border" },
  warning: { icon: TriangleAlert, text: "text-warning-text", ring: "border-warning-border" },
  info: { icon: Info, text: "text-info-text", ring: "border-info-border" },
} as const;

/**
 * Risk Radar (D30, brief §10): "what needs attention today", ranked by tone then count. Server
 * component — plain links, no client JavaScript. Every line says why it matters and where to act.
 */
export function RadarPanel({ radar }: { radar: Radar }) {
  return (
    <section aria-labelledby="radar" className="rounded-lg border border-border bg-surface-elevated p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="radar" className="flex items-center gap-2 text-h3">
          <RadarIcon aria-hidden size={18} strokeWidth={1.5} className="text-text-secondary" />
          O que precisa de atenção hoje
        </h2>
        <span className="text-caption text-text-secondary">
          {radar.counts.danger} {radar.counts.danger === 1 ? "crítico" : "críticos"} · {radar.counts.warning} {radar.counts.warning === 1 ? "alerta" : "alertas"} · {radar.counts.info} {radar.counts.info === 1 ? "aviso" : "avisos"}
        </span>
      </div>
      {radar.items.length === 0 ? (
        <p className="mt-3 text-body-sm text-text-secondary">Nada exige atenção agora. Mantenha as evidências em dia e revise o diagnóstico periodicamente.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {radar.items.map((it) => {
            const tone = TONE[it.tone as keyof typeof TONE] ?? TONE.info;
            const Icon = tone.icon;
            return (
              <li key={it.kind} className={`rounded-md border-l-2 ${tone.ring} bg-surface-base px-3 py-2`}>
                <Link href={radarHref(it.route)} className="group flex items-start gap-2">
                  <Icon aria-hidden size={16} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${tone.text}`} />
                  <span className="min-w-0">
                    <span className="block text-body-sm font-medium text-text-primary group-hover:underline">{it.title}</span>
                    <span className="block text-caption text-text-secondary">{it.reason}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
