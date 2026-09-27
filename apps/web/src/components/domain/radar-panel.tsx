import { Radar as RadarIcon } from "lucide-react";
import { RadarItem } from "@/components/domain/radar-item";
import type { Radar } from "@/lib/domain/queries";
import { radarCountsLine } from "@/lib/domain/radar";

/**
 * Risk Radar (D30, visual-v2 §4.5 section 7): "what needs attention today", ranked by tone then
 * count. Server component — plain links, no client JavaScript. Every line says why it matters and
 * where to act. `#radar` is the target of the module card and of the bell's footer link.
 */
export function RadarPanel({ radar, className = "" }: { radar: Radar; className?: string }) {
  return (
    <section aria-labelledby="radar" className={`scroll-mt-24 rounded-lg border border-border bg-surface-elevated p-4 sm:p-6 ${className}`}>
      <p className="mb-1 text-label uppercase text-text-secondary">Risk Radar</p>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="radar" className="flex items-center gap-2 text-h3">
          <RadarIcon aria-hidden size={18} strokeWidth={1.5} className="text-primary-text" />
          O que precisa de atenção hoje
        </h2>
        <span className="text-caption text-text-secondary">{radarCountsLine(radar.counts)}</span>
      </div>
      {radar.items.length === 0 ? (
        <p className="mt-3 text-body-sm text-text-secondary">Nada exige atenção agora. Mantenha as evidências em dia e revise o diagnóstico periodicamente.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {radar.items.map((it) => (
            <li key={it.kind}>
              <RadarItem item={it} inset />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
