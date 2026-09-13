"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSubmit } from "@/components/auth/use-submit";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/fields";
import { TextField } from "@/components/ui/text-field";
import { CATEGORY, IMPACT, PROBABILITY, SEVERITY, previewSeverity } from "@/lib/domain/labels";

export type MemberOption = { membership_id: string; name: string };
export type RiskInitial = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  probability: number;
  impact: number;
  owner_membership_id: string | null;
  due_date: string | null;
  treatment: string | null;
};

/** Create (no `initial`) or edit (`initial` → PATCH). The API derives severity in both cases. */
export function RiskForm({ orgId, members, initial }: { orgId: string; members: MemberOption[]; initial?: RiskInitial }) {
  const router = useRouter();
  const { pending, error, fields, submit } = useSubmit<{ id: string }>();
  const [probability, setProbability] = useState(initial?.probability ?? 2);
  const [impact, setImpact] = useState(initial?.impact ?? 3);
  const preview = SEVERITY[previewSeverity(probability, impact)]!;
  const backHref = initial ? `/riscos/${initial.id}` : "/riscos";

  return (
    <form
      className="flex max-w-[640px] flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const owner = String(f.get("owner_membership_id") ?? "");
        const due = String(f.get("due_date") ?? "");
        void submit(
          initial ? `/api/v1/orgs/${orgId}/risks/${initial.id}` : `/api/v1/orgs/${orgId}/risks`,
          {
            title: f.get("title"),
            description: String(f.get("description") ?? "").trim() || null,
            category: f.get("category"),
            probability,
            impact,
            owner_membership_id: owner || null,
            due_date: due || null,
            treatment: String(f.get("treatment") ?? "").trim() || null,
          },
          (risk) => {
            router.push(`/riscos/${risk.id}`);
            router.refresh();
          },
          initial ? "PATCH" : "POST",
        );
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="title" name="title" label="Risco" required minLength={3} maxLength={200} placeholder="Ex.: Sistemas críticos sem MFA" error={fields.title} defaultValue={initial?.title} />
      <TextAreaField id="description" name="description" label="Por que este risco existe" hint="Contexto que ajuda quem for tratar o risco a entender o problema." defaultValue={initial?.description ?? ""} />
      <SelectField id="category" name="category" label="Categoria" required defaultValue={initial?.category ?? "acesso"}>
        {Object.entries(CATEGORY).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField id="probability" name="probability" label="Probabilidade" value={probability} onChange={(e) => setProbability(Number(e.target.value))}>
          {Object.entries(PROBABILITY).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </SelectField>
        <SelectField id="impact" name="impact" label="Impacto" value={impact} onChange={(e) => setImpact(Number(e.target.value))}>
          {Object.entries(IMPACT).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="flex items-center gap-3 rounded-md border border-border bg-surface-base px-3 py-2 text-body-sm">
        <span className="text-text-secondary">Severidade calculada:</span>
        <Badge label={preview.label} tone={preview.tone} icon={preview.icon} />
        <span className="text-caption text-text-secondary">probabilidade × impacto</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField id="owner_membership_id" name="owner_membership_id" label="Responsável" defaultValue={initial?.owner_membership_id ?? ""}>
          <option value="">Sem responsável</option>
          {members.map((m) => (
            <option key={m.membership_id} value={m.membership_id}>
              {m.name}
            </option>
          ))}
        </SelectField>
        <TextField id="due_date" name="due_date" type="date" label="Prazo" defaultValue={initial?.due_date ?? ""} />
      </div>
      <TextAreaField id="treatment" name="treatment" label="Tratamento previsto" hint="Opcional. O plano detalhado vive nas ações ligadas a este risco." defaultValue={initial?.treatment ?? ""} />
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (initial ? "Salvando…" : "Registrando…") : initial ? "Salvar alterações" : "Registrar risco"}
        </Button>
        <ButtonLink href={backHref} variant="secondary">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  );
}
