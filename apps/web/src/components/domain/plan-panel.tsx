"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";
import type { MemberOption } from "./risk-form";

export type PlanRecommendation = {
  planned: boolean;
  existing_action?: { id: string; title: string } | null;
  control?: { code: string; title: string; description: string; exists: boolean; already_linked: boolean } | null;
  action_title?: string | null;
  default_due_date: string;
  default_owner_membership_id: string;
  expected_evidence?: string | null;
  basis: string;
};

/**
 * Risk-to-Action engine (D29): "O que eu faço agora?". Shows the recommended control, action,
 * owner, deadline and expected evidence, and applies them in one step. Managers only (the API
 * enforces it); everyone else sees the recommendation as guidance.
 */
export function PlanPanel({
  orgId,
  riskId,
  rec,
  members,
  canPlan,
}: {
  orgId: string;
  riskId: string;
  rec: PlanRecommendation;
  members: MemberOption[];
  canPlan: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!rec.action_title && !rec.control) return null;

  return (
    <section aria-labelledby="plano" className="rounded-lg border border-electric-blue/40 bg-info-tint/40 p-5">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden size={18} strokeWidth={1.5} className="text-info-text" />
        <h2 id="plano" className="text-h3">Plano recomendado</h2>
      </div>
      <p className="mt-1 text-caption text-text-secondary">{rec.basis} · recomendação operacional, não é orientação jurídica.</p>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-body-sm md:grid-cols-[140px_1fr]">
        {rec.control ? (
          <>
            <dt className="text-text-secondary">Controle</dt>
            <dd>
              <span className="font-medium">{rec.control.title}</span>
              <span className="ml-2 text-caption text-text-secondary">
                {rec.control.already_linked ? "já vinculado" : rec.control.exists ? "já existe na organização" : "será criado como planejado"}
              </span>
              <p className="mt-0.5 text-caption text-text-secondary">{rec.control.description}</p>
            </dd>
          </>
        ) : null}
        {rec.action_title ? (
          <>
            <dt className="text-text-secondary">Ação</dt>
            <dd className="font-medium">{rec.action_title}</dd>
          </>
        ) : null}
        <dt className="text-text-secondary">Evidência esperada</dt>
        <dd>{rec.expected_evidence ?? "—"}</dd>
      </dl>

      {rec.planned && rec.existing_action ? (
        <p className="mt-4 text-body-sm">
          Já planejado:{" "}
          <Link href={`/acoes/${rec.existing_action.id}`} className="font-medium text-info-text underline underline-offset-2">
            {rec.existing_action.title}
          </Link>
        </p>
      ) : canPlan ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setPending(true);
            setError(null);
            const r = await api<{ action: { id: string } }>(`/api/v1/orgs/${orgId}/risks/${riskId}/plan`, {
              method: "POST",
              body: {
                owner_membership_id: String(f.get("owner_membership_id") ?? "") || null,
                due_date: String(f.get("due_date") ?? "") || null,
              },
            });
            setPending(false);
            if (!r.ok) return setError(r.error.message || humanMessage(r.error));
            router.refresh();
          }}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="plan-owner" className="text-body-sm font-medium">Responsável</label>
              <select id="plan-owner" name="owner_membership_id" defaultValue={rec.default_owner_membership_id} className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body">
                {members.map((m) => (
                  <option key={m.membership_id} value={m.membership_id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="plan-due" className="text-body-sm font-medium">Prazo</label>
              <input id="plan-due" name="due_date" type="date" defaultValue={rec.default_due_date} className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body" />
            </div>
            <Button type="submit" disabled={pending}>{pending ? "Planejando…" : "Planejar em um passo"}</Button>
          </div>
          <p className="text-caption text-text-secondary">Cria a ação com responsável e prazo, associa o controle ao risco e registra tudo no histórico. O prazo sugerido é um padrão do produto, não um prazo legal.</p>
          {error ? <Alert tone="danger">{error}</Alert> : null}
        </form>
      ) : (
        <p className="mt-4 text-caption text-text-secondary">Um administrador pode aplicar este plano em um passo.</p>
      )}
    </section>
  );
}
