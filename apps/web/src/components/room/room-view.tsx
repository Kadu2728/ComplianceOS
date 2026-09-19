import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY, CONTROL_KIND, CONTROL_STATUS, DOCUMENT_CATEGORY, DOCUMENT_STATUS, formatDate } from "@/lib/domain/labels";
import type { RoomPublic } from "@/lib/domain/queries";
import { BAND_TONE, formatInstantDay } from "@/lib/domain/score";

/**
 * The Compliance Room as a visitor sees it (D36). Server component, no interactivity, no data
 * beyond the public payload. `downloadBase` is the public download prefix; in the owner's
 * preview it is null and files are listed without a link (the preview is not a link holder).
 * `titleTag` lets a page that already has its own <h1> (the landing showcase) embed the room
 * without a second document title; the visitor page keeps the default.
 */
export function RoomView({
  room,
  downloadBase,
  titleTag: Title = "h1",
}: {
  room: RoomPublic;
  downloadBase: string | null;
  titleTag?: "h1" | "p";
}) {
  const documents = room.documents;
  const controls = room.controls;
  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-text-secondary">Sala de compliance</p>
        <Title className="text-h1">{room.title}</Title>
        {room.title !== room.organization_name ? <p className="text-body text-text-secondary">{room.organization_name}</p> : null}
        {room.intro ? <p className="mt-2 max-w-[70ch] text-body-lg whitespace-pre-line">{room.intro}</p> : null}
      </header>

      {room.score ? (
        <section aria-labelledby="sala-score" className="rounded-lg border border-border bg-surface-elevated p-6">
          <h2 id="sala-score" className="text-label uppercase text-text-secondary">Indicador de maturidade</h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="text-score tabular-nums">{room.score.score}</span>
            <span className="text-body-sm text-text-secondary">/ 100</span>
            <Badge label={room.score.band.label} tone={BAND_TONE[room.score.band.key] ?? "neutral"} />
          </div>
          <p className="mt-2 text-caption text-text-secondary">
            Score de Compliance calculado pela plataforma a partir do diagnóstico, dos riscos, controles, ações e evidências registrados pela organização. Atualizado em {formatInstantDay(room.score.computed_at)}.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="sala-documentos" className="flex flex-col gap-3">
        <h2 id="sala-documentos" className="text-h3">Documentos</h2>
        {documents.length === 0 ? (
          <p className="text-body-sm text-text-secondary">Nenhum documento compartilhado nesta sala.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
            {documents.map((d) => {
              const st = DOCUMENT_STATUS[d.status]!;
              return (
                <li key={d.id} className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-body font-medium">{d.name}</span>
                    <span className="text-caption text-text-secondary">
                      {DOCUMENT_CATEGORY[d.category] ?? d.category} · versão {d.version}
                      {d.valid_until ? ` · válido até ${formatDate(d.valid_until)}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge label={st.label} tone={st.tone} icon={st.icon} />
                    {d.has_file && downloadBase ? (
                      <a
                        href={`${downloadBase}/documents/${d.id}/download`}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-body-sm font-medium text-text-primary hover:bg-surface-hover"
                      >
                        <Download aria-hidden size={16} strokeWidth={1.5} />
                        Baixar
                      </a>
                    ) : d.has_file ? (
                      <span className="text-caption text-text-secondary">arquivo disponível pelo link</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {controls.length > 0 ? (
        <section aria-labelledby="sala-controles" className="flex flex-col gap-3">
          <h2 id="sala-controles" className="text-h3">Controles em vigor</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
            {controls.map((c) => {
              const st = CONTROL_STATUS[c.status]!;
              return (
                <li key={c.id} className="flex flex-col gap-1 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-body font-medium">{c.title}</span>
                    <Badge label={st.label} tone={st.tone} icon={st.icon} />
                  </div>
                  <span className="text-caption text-text-secondary">
                    {CONTROL_KIND[c.kind] ?? c.kind} · {CATEGORY[c.category] ?? c.category}
                  </span>
                  {c.description ? <p className="mt-1 max-w-[70ch] text-body-sm text-text-secondary">{c.description}</p> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {room.contact_email ? (
        <section aria-labelledby="sala-contato" className="flex flex-col gap-1">
          <h2 id="sala-contato" className="text-h3">Contato</h2>
          <a href={`mailto:${room.contact_email}`} className="text-body text-info-text underline decoration-1 underline-offset-2">
            {room.contact_email}
          </a>
        </section>
      ) : null}

      <footer className="flex flex-col gap-1 border-t border-border pt-4 text-caption text-text-secondary">
        <p>{room.caveat}</p>
        <p>
          {room.link ? `Acesso válido até ${formatInstantDay(room.link.expires_at)}. ` : ""}
          Gerado em {formatInstantDay(room.generated_at)} · Compliance OS
        </p>
      </footer>
    </article>
  );
}
