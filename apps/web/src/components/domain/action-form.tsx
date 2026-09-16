"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSubmit } from "@/components/auth/use-submit";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/fields";
import { TextField } from "@/components/ui/text-field";
import type { MemberOption } from "./risk-form";

export type RiskOption = { id: string; title: string };
export type ControlChoice = { id: string; title: string };
export type ActionInitial = {
  id: string;
  title: string;
  description: string | null;
  risk_id: string | null;
  control_id: string | null;
  owner_membership_id: string | null;
  due_date: string | null;
  effort: string | null;
};

/**
 * Create an action. Inline (on a risk page: `riskId` fixed, compact) or as a full page
 * (`risks` selectable). After creating, the page is refreshed so the list is server-rendered.
 */
export function ActionForm({
  orgId,
  members,
  riskId,
  risks,
  controls = [],
  controlId,
  compact = false,
  onDone,
  initial,
}: {
  orgId: string;
  members: MemberOption[];
  riskId?: string;
  risks?: RiskOption[];
  controls?: ControlChoice[]; // the control this action implements (Control Graph, D27)
  controlId?: string; // preselected (from a control page)
  compact?: boolean;
  onDone?: () => void;
  initial?: ActionInitial; // edit mode → PATCH
}) {
  const router = useRouter();
  const { pending, error, fields, submit } = useSubmit<{ id: string }>();
  const [open, setOpen] = useState(!compact);

  if (compact && !open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Nova ação
      </Button>
    );
  }
  return (
    <form
      className={`flex flex-col gap-4 ${compact ? "rounded-lg border border-border bg-surface-base p-4" : "max-w-[640px]"}`}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const owner = String(f.get("owner_membership_id") ?? "");
        const due = String(f.get("due_date") ?? "");
        const risk = riskId ?? String(f.get("risk_id") ?? "");
        const control = String(f.get("control_id") ?? "");
        const effort = String(f.get("effort") ?? "");
        void submit(
          initial ? `/api/v1/orgs/${orgId}/actions/${initial.id}` : `/api/v1/orgs/${orgId}/actions`,
          {
            title: f.get("title"),
            description: String(f.get("description") ?? "").trim() || null,
            risk_id: risk || null,
            control_id: control || null,
            owner_membership_id: owner || null,
            due_date: due || null,
            effort: effort || null,
          },
          (action) => {
            if (compact) {
              setOpen(false);
              onDone?.();
              router.refresh();
            } else {
              router.push(`/acoes/${action.id}`);
              router.refresh();
            }
          },
          initial ? "PATCH" : "POST",
        );
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="action-title" name="title" label="Ação" required minLength={3} maxLength={200} placeholder="Ex.: Ativar MFA no e-mail corporativo" error={fields.title} defaultValue={initial?.title} />
      {!compact ? <TextAreaField id="action-description" name="description" label="Descrição" defaultValue={initial?.description ?? ""} /> : null}
      {!riskId && risks ? (
        <SelectField id="action-risk" name="risk_id" label="Risco relacionado" defaultValue={initial?.risk_id ?? ""}>
          <option value="">Nenhum</option>
          {risks.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </SelectField>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField id="action-owner" name="owner_membership_id" label="Responsável" defaultValue={initial?.owner_membership_id ?? ""}>
          <option value="">Sem responsável</option>
          {members.map((m) => (
            <option key={m.membership_id} value={m.membership_id}>
              {m.name}
            </option>
          ))}
        </SelectField>
        <TextField id="action-due" name="due_date" type="date" label="Prazo" defaultValue={initial?.due_date ?? ""} />
        {controls.length > 0 ? (
          <SelectField id="action-control" name="control_id" label="Implementa o controle" hint="Opcional. Liga a ação ao controle que ela cria ou melhora." defaultValue={initial?.control_id ?? controlId ?? ""}>
            <option value="">Nenhum</option>
            {controls.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </SelectField>
        ) : null}
        <SelectField id="action-effort" name="effort" label="Esforço" hint="Usado na priorização: menor esforço para o mesmo risco vem primeiro." defaultValue={initial?.effort ?? ""}>
          <option value="">Não informado (médio)</option>
          <option value="baixo">Baixo — horas</option>
          <option value="medio">Médio — dias</option>
          <option value="alto">Alto — semanas ou terceiros</option>
        </SelectField>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (initial ? "Salvando…" : "Criando…") : initial ? "Salvar alterações" : "Criar ação"}
        </Button>
        {compact ? (
          <Button type="button" variant="tertiary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        ) : (
          <ButtonLink href={initial ? `/acoes/${initial.id}` : "/acoes"} variant="secondary">
            Cancelar
          </ButtonLink>
        )}
      </div>
    </form>
  );
}
