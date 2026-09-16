"use client";

import { useRouter } from "next/navigation";
import { useSubmit } from "@/components/auth/use-submit";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/fields";
import { TextField } from "@/components/ui/text-field";
import type { MemberOption } from "./risk-form";

export type ControlInitial = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  kind: string;
  status: string;
  owner_membership_id: string | null;
  document_id: string | null;
  review_date: string | null;
};

/** Plain label maps only: this is a client component (labels.ts holds icons too). */
const CATEGORIES: [string, string][] = [
  ["dados", "Dados e finalidades"],
  ["acesso", "Acesso e armazenamento"],
  ["seguranca", "Segurança"],
  ["fornecedores", "Fornecedores e terceiros"],
  ["documentacao", "Políticas e registros"],
  ["titulares", "Titulares"],
  ["incidentes", "Incidentes"],
  ["pessoas", "Pessoas e responsabilidades"],
];
const KINDS: [string, string][] = [
  ["preventivo", "Preventivo — evita que o risco aconteça"],
  ["detectivo", "Detectivo — percebe quando acontece"],
  ["corretivo", "Corretivo — reduz o dano depois"],
];
const STATUSES: [string, string][] = [
  ["planejado", "Planejado"],
  ["parcial", "Parcial"],
  ["implementado", "Implementado"],
  ["inativo", "Inativo"],
];

/**
 * Create or edit a control (Control Graph, D27). "Verificado" is never offered here: the API
 * grants it only through the status control, and only with evidence attached.
 */
export function ControlForm({
  orgId,
  members,
  documents,
  riskId,
  initial,
}: {
  orgId: string;
  members: MemberOption[];
  documents: { id: string; name: string }[];
  riskId?: string; // link on creation (from a risk page)
  initial?: ControlInitial;
}) {
  const router = useRouter();
  const { pending, error, fields, submit } = useSubmit<{ id: string }>();
  return (
    <form
      className="flex max-w-[640px] flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const str = (k: string) => String(f.get(k) ?? "").trim();
        const body: Record<string, unknown> = {
          title: str("title"),
          description: str("description") || null,
          category: str("category"),
          kind: str("kind"),
          status: str("status"),
          owner_membership_id: str("owner_membership_id") || null,
          document_id: str("document_id") || null,
          review_date: str("review_date") || null,
        };
        if (!initial && riskId) body.risk_id = riskId;
        void submit(
          initial ? `/api/v1/orgs/${orgId}/controls/${initial.id}` : `/api/v1/orgs/${orgId}/controls`,
          body,
          (control) => {
            router.push(`/controles/${control.id}`);
            router.refresh();
          },
          initial ? "PATCH" : "POST",
        );
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="control-title" name="title" label="Controle" required minLength={3} maxLength={200} placeholder="Ex.: Autenticação multifator nos sistemas críticos" error={fields.title} defaultValue={initial?.title} />
      <TextAreaField id="control-description" name="description" label="O que o controle faz" hint="Descreva a salvaguarda em uma ou duas frases: o que existe, onde e para quem." defaultValue={initial?.description ?? ""} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField id="control-category" name="category" label="Categoria" defaultValue={initial?.category ?? "acesso"}>
          {CATEGORIES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
        <SelectField id="control-kind" name="kind" label="Tipo" defaultValue={initial?.kind ?? "preventivo"}>
          {KINDS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
        <SelectField id="control-status" name="status" label="Maturidade" hint="“Verificado” só pelo status do controle, com evidência anexada." defaultValue={initial?.status === "verificado" ? "implementado" : (initial?.status ?? "planejado")}>
          {STATUSES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </SelectField>
        <SelectField id="control-owner" name="owner_membership_id" label="Responsável" defaultValue={initial?.owner_membership_id ?? ""}>
          <option value="">Sem responsável</option>
          {members.map((m) => (
            <option key={m.membership_id} value={m.membership_id}>{m.name}</option>
          ))}
        </SelectField>
        <SelectField id="control-document" name="document_id" label="Documento que formaliza" defaultValue={initial?.document_id ?? ""}>
          <option value="">Nenhum</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </SelectField>
        <TextField id="control-review" name="review_date" type="date" label="Próxima revisão" defaultValue={initial?.review_date ?? ""} />
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (initial ? "Salvando…" : "Criando…") : initial ? "Salvar alterações" : "Criar controle"}
        </Button>
        <ButtonLink href={initial ? `/controles/${initial.id}` : riskId ? `/riscos/${riskId}` : "/controles"} variant="secondary">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  );
}
