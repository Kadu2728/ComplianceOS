"use client";

import { FileText, Files, Link2, StickyNote, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

type Evidence =
  paths["/api/v1/orgs/{org_id}/evidence"]["get"]["responses"]["200"]["content"]["application/json"][number];

const ICON = { note: StickyNote, link: Link2, file: FileText, document: Files } as const;
type Kind = keyof typeof ICON;
export type DocumentOption = { id: string; name: string };
export type ControlOption = { id: string; title: string };
const VALIDITY: Record<string, { label: string; className: string }> = {
  vencendo: { label: "vence em breve", className: "text-warning-text" },
  vencida: { label: "vencida", className: "text-danger-text" },
};

/**
 * Evidence list + add (note / link / file / document citation) + delete for a risk, an action or
 * a control (brand §34). `documents` are the organization's documents a citation can point to
 * (D26); `controls` lets a proof also be attached to the control it demonstrates (D34), and an
 * optional validity turns "proof" into "current proof".
 */
export function EvidencePanel({
  orgId,
  target,
  items,
  canDelete,
  documents = [],
  controls = [],
}: {
  orgId: string;
  target: { risk_id?: string; action_id?: string; control_id?: string };
  items: Evidence[];
  canDelete: boolean;
  documents?: DocumentOption[];
  controls?: ControlOption[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("note");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/v1/orgs/${orgId}/evidence`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setPending(true);
    setError(null);
    let failed: string | null = null;
    if (kind === "file") {
      const body = new FormData();
      const file = f.get("file");
      if (file instanceof File && file.size > 0) body.append("file", file);
      if (target.risk_id) body.append("risk_id", target.risk_id);
      if (target.action_id) body.append("action_id", target.action_id);
      const control = target.control_id ?? String(f.get("control_id") ?? "");
      if (control) body.append("control_id", control);
      const note = String(f.get("note") ?? "").trim();
      if (note) body.append("note", note);
      const valid = String(f.get("valid_until") ?? "");
      if (valid) body.append("valid_until", valid);
      const res = await fetch(`${base}/files`, { method: "POST", body, credentials: "same-origin" });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string; code?: string } | null;
        failed =
          res.status === 415
            ? "Tipo de arquivo não permitido (use PDF, PNG, JPG, TXT, CSV, DOCX ou XLSX)."
            : res.status === 413
              ? "Arquivo acima do limite de 10 MB."
              : (err?.message ?? "Não foi possível enviar o arquivo.");
      }
    } else {
      const r = await api(base, {
        method: "POST",
        body: {
          kind,
          ...target,
          note: String(f.get("note") ?? "").trim() || null,
          url: kind === "link" ? String(f.get("url") ?? "") : null,
          document_id: kind === "document" ? String(f.get("document_id") ?? "") || null : null,
          control_id: target.control_id ?? (String(f.get("control_id") ?? "") || null),
          valid_until: String(f.get("valid_until") ?? "") || null,
        },
      });
      if (!r.ok) failed = r.error.message || humanMessage(r.error);
    }
    setPending(false);
    if (failed) {
      setError(failed);
      return;
    }
    form.reset();
    router.refresh();
  }

  async function remove(id: string) {
    const r = await api(`${base}/${id}`, { method: "DELETE" });
    if (!r.ok) setError(humanMessage(r.error));
    else router.refresh();
  }

  return (
    <section aria-labelledby="evidencias" className="flex flex-col gap-4">
      <h2 id="evidencias" className="text-h3">
        Evidências
      </h2>
      {items.length === 0 ? (
        <p className="text-body-sm text-text-secondary">
          Nenhuma evidência ainda. Registre uma nota, um link, um arquivo ou cite um documento que comprove o controle.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface-elevated">
          {items.map((ev) => {
            const Icon = ICON[ev.kind];
            return (
              <li key={ev.id} className="flex items-start gap-3 px-4 py-3 text-body-sm">
                <Icon aria-hidden size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-text-secondary" />
                <div className="min-w-0 flex-1">
                  {ev.kind === "link" && ev.url ? (
                    <a href={ev.url} target="_blank" rel="noreferrer noopener" className="break-all text-info-text underline underline-offset-2">
                      {ev.url}
                    </a>
                  ) : ev.kind === "file" ? (
                    <a href={`${base}/${ev.id}/download`} className="text-info-text underline underline-offset-2">
                      {ev.filename}
                    </a>
                  ) : ev.kind === "document" && ev.document ? (
                    <Link href={`/documentos/${ev.document.id}`} className="text-info-text underline underline-offset-2">
                      {ev.document.name}
                    </Link>
                  ) : null}
                  {ev.note ? <p className="whitespace-pre-wrap text-text-primary">{ev.note}</p> : null}
                  <p className="mt-1 text-caption text-text-secondary">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(ev.created_at))}
                    {ev.size_bytes ? ` · ${Math.max(1, Math.round(ev.size_bytes / 1024))} KB` : ""}
                    {ev.valid_until ? (
                      <span className={VALIDITY[ev.validity]?.className ?? ""}>
                        {" · "}válida até {ev.valid_until.slice(8, 10)}/{ev.valid_until.slice(5, 7)}/{ev.valid_until.slice(0, 4)}
                        {VALIDITY[ev.validity] ? ` (${VALIDITY[ev.validity]!.label})` : ""}
                      </span>
                    ) : null}
                    {ev.control_id && !target.control_id ? <span> · comprova um controle</span> : null}
                  </p>
                </div>
                {canDelete ? (
                  <button type="button" onClick={() => remove(ev.id)} aria-label="Remover evidência" className="flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-danger-text">
                    <Trash2 aria-hidden size={16} strokeWidth={1.5} />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-base p-4">
        <div role="radiogroup" aria-label="Tipo de evidência" className="flex flex-wrap gap-2">
          {(["note", "link", "file", "document"] as const).map((k) => (
            <label key={k} className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-body-sm ${kind === k ? "border-electric-blue bg-info-tint text-info-text" : "border-border bg-surface-elevated text-text-secondary"}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {k === "note" ? "Nota" : k === "link" ? "Link" : k === "file" ? "Arquivo" : "Documento"}
            </label>
          ))}
        </div>
        {kind === "document" ? (
          documents.length === 0 ? (
            <p className="text-body-sm text-text-secondary">
              Nenhum documento cadastrado ainda. <Link href="/documentos/novo" className="text-info-text underline underline-offset-2">Adicione um documento</Link> para citá-lo aqui.
            </p>
          ) : (
            <select name="document_id" required aria-label="Documento" className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body">
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )
        ) : null}
        {kind === "link" ? (
          <input name="url" type="url" required placeholder="https://…" aria-label="URL" className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body" />
        ) : null}
        {kind === "file" ? (
          <input name="file" type="file" required aria-label="Arquivo" accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.xlsx" className="text-body-sm" />
        ) : null}
        <textarea name="note" required={kind === "note"} placeholder={kind === "note" ? "O que foi feito e quando" : kind === "document" ? "Por que este documento comprova o controle (opcional)" : "Observação (opcional)"} aria-label="Nota" className="min-h-20 rounded-md border border-border bg-surface-elevated px-3 py-2 text-body" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {!target.control_id && controls.length > 0 ? (
            <label className="flex flex-col gap-1 text-caption text-text-secondary">
              Comprova o controle (opcional)
              <select name="control_id" className="h-9 rounded-md border border-border bg-surface-elevated px-2 text-body-sm text-text-primary">
                <option value="">Nenhum</option>
                {controls.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1 text-caption text-text-secondary">
            Válida até (opcional)
            <input name="valid_until" type="date" className="h-9 rounded-md border border-border bg-surface-elevated px-2 text-body-sm text-text-primary" />
          </label>
        </div>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Salvando…" : "Adicionar evidência"}
          </Button>
        </div>
      </form>
    </section>
  );
}
