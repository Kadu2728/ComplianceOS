"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/fields";
import { api, humanMessage } from "@/lib/api/client";

export type ProfileValue = {
  segment: string | null;
  headcount_band: string | null;
  customer_type: string | null;
  data_categories: string[];
  sells_to_enterprise: boolean | null;
  international_transfers: string | null;
  systems: string[];
  processes: string[];
  notes: string | null;
  complete: boolean;
};

/** Plain label maps (client component). Mirrors labels.ts; keep in sync. */
const SEGMENTS: [string, string][] = [
  ["software_saas", "Software / SaaS"], ["servicos", "Serviços"], ["comercio", "Comércio"], ["industria", "Indústria"],
  ["saude", "Saúde"], ["educacao", "Educação"], ["financeiro", "Financeiro"], ["outro", "Outro"],
];
const HEADCOUNT: [string, string][] = [
  ["ate_9", "Até 9 pessoas"], ["de_10_a_49", "10 a 49"], ["de_50_a_199", "50 a 199"], ["acima_de_200", "200 ou mais"],
];
const CUSTOMERS: [string, string][] = [["b2b", "Empresas (B2B)"], ["b2c", "Pessoas físicas (B2C)"], ["ambos", "Ambos"]];
const TRISTATE: [string, string][] = [["sim", "Sim"], ["nao", "Não"], ["nao_sei", "Não sei"]];
const DATA: [string, string][] = [
  ["cadastrais", "Cadastrais (nome, CPF, endereço)"], ["contato", "Contato (e-mail, telefone)"],
  ["financeiros", "Financeiros / pagamento"], ["saude", "Saúde"], ["biometricos", "Biométricos"],
  ["criancas_adolescentes", "Crianças e adolescentes"], ["geolocalizacao", "Geolocalização"],
  ["comportamentais", "Comportamentais / navegação"], ["credenciais", "Credenciais de acesso"],
];

/**
 * Organization profile — Compliance DNA v1 (D28). The context the engines use to prioritize and
 * to explain; it never decides whether an obligation applies. Managers edit; PUT is partial.
 */
export function ProfileForm({ orgId, value, canEdit }: { orgId: string; value: ProfileValue; canEdit: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const lines = (v: string[]) => v.join("\n");
  const parse = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 20);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        const f = new FormData(e.currentTarget);
        const str = (k: string) => String(f.get(k) ?? "");
        setPending(true);
        setError(null);
        setSaved(false);
        const r = await api(`/api/v1/orgs/${orgId}/profile`, {
          method: "PUT",
          body: {
            segment: str("segment") || null,
            headcount_band: str("headcount_band") || null,
            customer_type: str("customer_type") || null,
            data_categories: f.getAll("data_categories").map(String),
            sells_to_enterprise: str("sells_to_enterprise") === "" ? null : str("sells_to_enterprise") === "sim",
            international_transfers: str("international_transfers") || null,
            systems: parse(str("systems")),
            processes: parse(str("processes")),
            notes: str("notes").trim() || null,
          },
        });
        setPending(false);
        if (!r.ok) return setError(r.error.message || humanMessage(r.error));
        setSaved(true);
        router.refresh();
      }}
    >
      <fieldset disabled={!canEdit} className="contents">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField id="p-segment" name="segment" label="Segmento" defaultValue={value.segment ?? ""}>
            <option value="">Selecione</option>
            {SEGMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </SelectField>
          <SelectField id="p-headcount" name="headcount_band" label="Tamanho da equipe" defaultValue={value.headcount_band ?? ""}>
            <option value="">Selecione</option>
            {HEADCOUNT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </SelectField>
          <SelectField id="p-customers" name="customer_type" label="Para quem vende" defaultValue={value.customer_type ?? ""}>
            <option value="">Selecione</option>
            {CUSTOMERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </SelectField>
          <SelectField id="p-enterprise" name="sells_to_enterprise" label="Vende para empresas maiores que pedem comprovação?" defaultValue={value.sells_to_enterprise == null ? "" : value.sells_to_enterprise ? "sim" : "nao"}>
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </SelectField>
          <SelectField id="p-intl" name="international_transfers" label="Dados pessoais armazenados ou enviados fora do Brasil?" hint="Não sei também é uma resposta válida: o radar sinaliza para confirmar." defaultValue={value.international_transfers ?? ""}>
            <option value="">Selecione</option>
            {TRISTATE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </SelectField>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-sm font-medium">Que tipos de dados pessoais a empresa trata?</legend>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
            {DATA.map(([v, l]) => (
              <label key={v} className="inline-flex items-center gap-2 text-body-sm">
                <input type="checkbox" name="data_categories" value={v} defaultChecked={value.data_categories.includes(v)} className="size-4 accent-electric-blue" />
                {l}
              </label>
            ))}
          </div>
          <p className="text-caption text-text-secondary">Dados sensíveis e de crianças/adolescentes aumentam a prioridade dos riscos de dados, acesso, segurança e titulares.</p>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextAreaField id="p-systems" name="systems" label="Sistemas que guardam dados pessoais" hint="Um por linha, até 20. Ex.: CRM, ERP, e-mail corporativo." defaultValue={lines(value.systems)} />
          <TextAreaField id="p-processes" name="processes" label="Processos com dados pessoais" hint="Um por linha, até 20. Ex.: onboarding de clientes, cobrança, folha." defaultValue={lines(value.processes)} />
        </div>
        <TextAreaField id="p-notes" name="notes" label="Observações" defaultValue={value.notes ?? ""} maxLength={2000} />
      </fieldset>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {saved ? <Alert tone="success">Perfil salvo. A priorização e o radar já consideram o novo contexto.</Alert> : null}
      {canEdit ? (
        <div>
          <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar perfil"}</Button>
        </div>
      ) : (
        <p className="text-caption text-text-secondary">Somente proprietários e administradores editam o perfil.</p>
      )}
    </form>
  );
}
