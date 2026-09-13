"use client";

import { useRouter } from "next/navigation";
import { useSubmit } from "@/components/auth/use-submit";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/fields";
import { TextField } from "@/components/ui/text-field";
import { DOCUMENT_CATEGORY, DOCUMENT_REVIEW_STATE } from "@/lib/domain/labels";
import type { MemberOption } from "./risk-form";

export type DocumentInitial = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  version: string;
  review_state: string;
  owner_membership_id: string | null;
  valid_until: string | null;
  tags: string[];
  url: string | null;
};

/** Create (POST) or edit (`initial` → PATCH). Status is derived by the API from situação + validade. */
export function DocumentForm({ orgId, members, initial }: { orgId: string; members: MemberOption[]; initial?: DocumentInitial }) {
  const router = useRouter();
  const { pending, error, fields, submit } = useSubmit<{ id: string }>();
  const backHref = initial ? `/documentos/${initial.id}` : "/documentos";

  return (
    <form
      className="flex max-w-[640px] flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const owner = String(f.get("owner_membership_id") ?? "");
        const valid = String(f.get("valid_until") ?? "");
        const url = String(f.get("url") ?? "").trim();
        const tags = String(f.get("tags") ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        void submit(
          initial ? `/api/v1/orgs/${orgId}/documents/${initial.id}` : `/api/v1/orgs/${orgId}/documents`,
          {
            name: f.get("name"),
            description: String(f.get("description") ?? "").trim() || null,
            category: f.get("category"),
            version: String(f.get("version") ?? "").trim() || "1.0",
            review_state: f.get("review_state"),
            owner_membership_id: owner || null,
            valid_until: valid || null,
            tags,
            url: url || null,
          },
          (doc) => {
            router.push(`/documentos/${doc.id}`);
            router.refresh();
          },
          initial ? "PATCH" : "POST",
        );
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="name" name="name" label="Documento" required minLength={2} maxLength={200} placeholder="Ex.: Política de Privacidade" error={fields.name} defaultValue={initial?.name} />
      <TextAreaField id="description" name="description" label="Descrição" hint="O que este documento cobre e quando deve ser revisado." defaultValue={initial?.description ?? ""} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField id="category" name="category" label="Categoria" required defaultValue={initial?.category ?? "politica"}>
          {Object.entries(DOCUMENT_CATEGORY).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </SelectField>
        <TextField id="version" name="version" label="Versão" maxLength={32} placeholder="1.0" defaultValue={initial?.version ?? "1.0"} error={fields.version} />
      </div>
      <SelectField id="review_state" name="review_state" label="Situação" required defaultValue={initial?.review_state ?? "vigente"} hint="“Faltante” registra um documento que a empresa ainda precisa produzir.">
        {Object.entries(DOCUMENT_REVIEW_STATE).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label} — {v.hint}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField id="owner_membership_id" name="owner_membership_id" label="Responsável" defaultValue={initial?.owner_membership_id ?? ""}>
          <option value="">Sem responsável</option>
          {members.map((m) => (
            <option key={m.membership_id} value={m.membership_id}>
              {m.name}
            </option>
          ))}
        </SelectField>
        <TextField id="valid_until" name="valid_until" type="date" label="Válido até" hint="Sem data = sem vencimento." defaultValue={initial?.valid_until ?? ""} />
      </div>
      <TextField id="tags" name="tags" label="Tags" hint="Separadas por vírgula, até 10." placeholder="lgpd, site, clientes" defaultValue={initial?.tags.join(", ") ?? ""} error={fields.tags} />
      <TextField id="url" name="url" type="url" label="Link externo" hint="Opcional — quando o documento vive em outro sistema (Drive, Notion, etc.)." placeholder="https://" defaultValue={initial?.url ?? ""} error={fields.url} />
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (initial ? "Salvando…" : "Adicionando…") : initial ? "Salvar alterações" : "Adicionar documento"}
        </Button>
        <ButtonLink href={backHref} variant="secondary">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  );
}
