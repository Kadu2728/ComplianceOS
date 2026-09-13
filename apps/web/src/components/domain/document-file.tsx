"use client";

import { Download, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatInstantDay } from "@/lib/domain/score";

/** Current file of a document: download link + replace (one file at a time; history in Histórico). */
export function DocumentFile({
  orgId,
  documentId,
  filename,
  sizeBytes,
  updatedAt,
  canUpload,
}: {
  orgId: string;
  documentId: string;
  filename: string | null;
  sizeBytes: number | null;
  updatedAt: string | null;
  canUpload: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/v1/orgs/${orgId}/documents/${documentId}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File) || file.size === 0) return;
    setPending(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`${base}/file`, { method: "POST", body, credentials: "same-origin" });
    setPending(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(
        res.status === 415
          ? "Tipo de arquivo não permitido (use PDF, PNG, JPG, TXT, CSV, DOCX ou XLSX)."
          : res.status === 413
            ? "Arquivo acima do limite de 10 MB."
            : (err?.message ?? "Não foi possível enviar o arquivo. Tente novamente — a versão anterior não foi alterada."),
      );
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-border bg-surface-elevated p-5">
      <h2 className="text-h3">Arquivo</h2>
      {filename ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-body-sm">
          <span className="inline-flex items-center gap-2">
            <FileText aria-hidden size={16} strokeWidth={1.5} className="text-text-secondary" />
            <span className="font-medium">{filename}</span>
            <span className="text-caption text-text-secondary">
              {sizeBytes != null ? `${(sizeBytes / 1024).toFixed(0)} KB` : ""}
              {updatedAt ? ` · enviado em ${formatInstantDay(updatedAt)}` : ""}
            </span>
          </span>
          <a href={`${base}/download`} className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-3 text-body-sm hover:bg-surface-hover">
            <Download aria-hidden size={14} strokeWidth={1.5} /> Baixar
          </a>
        </div>
      ) : (
        <p className="mt-2 text-body-sm text-text-secondary">Nenhum arquivo enviado. O documento pode existir só como link ou como registro.</p>
      )}
      {canUpload ? (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <label htmlFor="document-file" className="text-body-sm font-medium">
            {filename ? "Substituir arquivo" : "Enviar arquivo"}
          </label>
          <input id="document-file" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.xlsx" className="text-body-sm" />
          <div>
            <Button type="submit" variant="secondary" disabled={pending}>
              <Upload aria-hidden size={16} strokeWidth={1.5} /> {pending ? "Enviando…" : "Enviar"}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
