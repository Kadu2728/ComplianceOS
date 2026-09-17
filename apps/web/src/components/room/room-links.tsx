"use client";

import { Copy, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { api, humanMessage } from "@/lib/api/client";
import type { RoomLink, RoomLinkCreated } from "@/lib/domain/queries";
import { formatInstantDay } from "@/lib/domain/score";

/**
 * Time-boxed links (D36, threat model T2). One link per recipient: the label makes a leak
 * attributable; the token is shown once, right after creation, and never again.
 */
export function RoomLinks({ orgId, links, enabled }: { orgId: string; links: RoomLink[]; enabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ label: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function revoke(link: RoomLink) {
    if (!window.confirm(`Revogar o link “${link.label}”? Quem o tiver deixa de acessar a sala imediatamente.`)) return;
    setRevoking(link.id);
    const r = await api<{ message: string }>(`/api/v1/orgs/${orgId}/room/links/${link.id}`, { method: "DELETE" });
    setRevoking(null);
    if (!r.ok) return setError(r.error.message || humanMessage(r.error));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_auto] md:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          setPending(true);
          setError(null);
          setCreated(null);
          setCopied(false);
          const r = await api<RoomLinkCreated>(`/api/v1/orgs/${orgId}/room/links`, {
            method: "POST",
            body: { label: String(f.get("label") ?? "").trim(), expires_in_days: Number(f.get("expires_in_days") ?? 30) },
          });
          setPending(false);
          if (!r.ok) return setError(r.error.message || humanMessage(r.error));
          setCreated({ label: r.data.link.label, url: `${window.location.origin}/sala/${r.data.token}` });
          form.reset();
          router.refresh();
        }}
      >
        <TextField id="link-label" name="label" label="Para quem" placeholder="Ex.: Procurement do Cliente X" required minLength={2} maxLength={80} />
        <TextField id="link-days" name="expires_in_days" type="number" label="Validade (dias)" defaultValue={30} min={1} max={90} required />
        <Button type="submit" disabled={pending}>{pending ? "Criando…" : "Criar link"}</Button>
      </form>
      {!enabled ? <p className="text-caption text-warning-text">A sala está desligada: os links só funcionam depois de publicá-la.</p> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {created ? (
        <div className="rounded-md border border-info-border bg-info-tint p-4">
          <p className="text-body-sm font-medium text-info-text">Link criado para “{created.label}”. Copie agora — ele não será mostrado de novo.</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
            <code className="flex-1 overflow-x-auto rounded-md border border-border bg-surface-elevated px-3 py-2 text-caption text-text-primary">{created.url}</code>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(created.url);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              <Copy aria-hidden size={16} strokeWidth={1.5} />
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      ) : null}

      {links.length === 0 ? (
        <p className="text-body-sm text-text-secondary">Nenhum link criado. Cada destinatário recebe o seu, com validade própria.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {links.map((l) => (
            <li key={l.id} className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Link2 aria-hidden size={18} strokeWidth={1.5} className="shrink-0 text-text-secondary" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-body-sm font-medium">{l.label}</span>
                  <span className="text-caption text-text-secondary">
                    {l.revoked_at ? `revogado em ${formatInstantDay(l.revoked_at)}` : `válido até ${formatInstantDay(l.expires_at)}`} · {l.view_count} {l.view_count === 1 ? "visita" : "visitas"}
                    {l.last_viewed_at ? ` · última em ${formatInstantDay(l.last_viewed_at)}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge label={l.revoked_at ? "Revogado" : l.active ? "Ativo" : "Expirado"} tone={l.active ? "success" : "neutral"} />
                {l.active ? (
                  <Button type="button" variant="tertiary" onClick={() => revoke(l)} disabled={revoking === l.id}>
                    {revoking === l.id ? "Revogando…" : "Revogar"}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
