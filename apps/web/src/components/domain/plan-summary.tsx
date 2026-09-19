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
 * Presentational half of the risk-to-action recommendation (D29): the basis line and the
 * Controle / Ação / Evidência esperada list. Server-safe; `PlanPanel` wraps it with the form.
 */
export function PlanSummary({ rec }: { rec: PlanRecommendation }) {
  return (
    <>
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
    </>
  );
}
