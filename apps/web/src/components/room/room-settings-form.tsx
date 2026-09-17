"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/fields";
import { TextField } from "@/components/ui/text-field";
import { api, humanMessage } from "@/lib/api/client";
import type { Room } from "@/lib/domain/queries";

/** Room settings (D36). Publishing is a separate, explicit switch at the top. */
export function RoomSettingsForm({ orgId, room }: { orgId: string; room: Room }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setPending(true);
        setError(null);
        setSaved(false);
        const r = await api<Room>(`/api/v1/orgs/${orgId}/room`, {
          method: "PUT",
          body: {
            enabled: f.get("enabled") === "on",
            title: String(f.get("title") ?? ""),
            intro: String(f.get("intro") ?? ""),
            show_score: f.get("show_score") === "on",
            show_controls: f.get("show_controls") === "on",
            contact_email: String(f.get("contact_email") ?? "").trim() || null,
          },
        });
        setPending(false);
        if (!r.ok) return setError(r.error.message || humanMessage(r.error));
        setSaved(true);
        router.refresh();
      }}
    >
      <label className="flex items-start gap-3 rounded-md border border-border bg-surface-base p-4">
        <input type="checkbox" name="enabled" defaultChecked={room.enabled} className="mt-1 size-4 accent-electric-blue" />
        <span className="flex flex-col gap-0.5">
          <span className="text-body font-medium">Sala publicada</span>
          <span className="text-caption text-text-secondary">
            Desligada, nenhum link funciona — mesmo os já enviados. Ligue apenas depois de conferir a prévia.
          </span>
        </span>
      </label>
      <TextField id="room-title" name="title" label="Título" defaultValue={room.title ?? ""} maxLength={120} placeholder="Nome da organização" />
      <TextAreaField
        id="room-intro"
        name="intro"
        label="Apresentação"
        defaultValue={room.intro ?? ""}
        maxLength={1200}
        hint="Um parágrafo curto sobre como a organização trata dados e segurança. Aparece como declaração da organização, separado dos indicadores da plataforma."
      />
      <TextField id="room-contact" name="contact_email" type="email" label="E-mail de contato (opcional)" defaultValue={room.contact_email ?? ""} hint="Um endereço institucional, nunca o de uma pessoa." />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-body-sm font-medium">O que a sala mostra</legend>
        <label className="flex items-center gap-3 text-body-sm">
          <input type="checkbox" name="show_score" defaultChecked={room.show_score} className="size-4 accent-electric-blue" />
          Score de Compliance (número, faixa e data; nunca os fatores nem o histórico)
        </label>
        <label className="flex items-center gap-3 text-body-sm">
          <input type="checkbox" name="show_controls" defaultChecked={room.show_controls} className="size-4 accent-electric-blue" />
          Controles compartilhados (só implementados ou verificados)
        </label>
        <p className="text-caption text-text-secondary">Riscos, ações, evidências e pessoas nunca aparecem na sala.</p>
      </fieldset>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {saved ? <Alert tone="success">Configurações salvas.</Alert> : null}
      <div>
        <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}
