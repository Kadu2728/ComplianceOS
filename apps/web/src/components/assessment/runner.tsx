"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";
import type { paths } from "@/lib/api/schema";

type Questions =
  paths["/api/v1/orgs/{org_id}/assessment/questions"]["get"]["responses"]["200"]["content"]["application/json"];
type Answer = "sim" | "parcial" | "nao" | "nao_se_aplica" | "nao_sei";
type Local = { value: Answer; justification: string; saved: boolean; error?: string };

const OPTIONS: { value: Answer; label: string; hint: string }[] = [
  { value: "sim", label: "Sim", hint: "Implementado e em uso" },
  { value: "parcial", label: "Parcialmente", hint: "Existe, mas incompleto ou informal" },
  { value: "nao", label: "Não", hint: "Não implementado" },
  { value: "nao_se_aplica", label: "Não se aplica", hint: "Exige uma justificativa curta" },
  { value: "nao_sei", label: "Não sei", hint: "Vamos marcar para confirmar" },
];

/**
 * Section-by-section runner (brand §47–§48): question → answer → context → next. Every answer is
 * saved immediately (PUT); the API is the authority on completeness and derivation.
 */
export function AssessmentRunner({ orgId, data, canAnswer }: { orgId: string; data: Questions; canAnswer: boolean }) {
  const router = useRouter();
  const base = `/api/v1/orgs/${orgId}/assessment`;
  const [sectionIdx, setSectionIdx] = useState(() => {
    const i = data.sections.findIndex((s) => s.questions.some((q) => !q.answer));
    return i === -1 ? 0 : i;
  });
  const [local, setLocal] = useState<Record<string, Local>>(() => {
    const out: Record<string, Local> = {};
    for (const s of data.sections)
      for (const q of s.questions)
        if (q.answer) out[q.code] = { value: q.answer.value, justification: q.answer.justification ?? "", saved: true };
    return out;
  });
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const timers = useRef<Record<string, number>>({});

  const total = data.sections.reduce((n, s) => n + s.questions.length, 0);
  const answered = useMemo(() => Object.values(local).filter((l) => l.saved).length, [local]);
  const section = data.sections[sectionIdx]!;

  async function save(code: string, value: Answer, justification: string) {
    if (value === "nao_se_aplica" && !justification.trim()) {
      setLocal((s) => ({ ...s, [code]: { value, justification, saved: false } }));
      return;
    }
    const r = await api(`${base}/answers/${code}`, {
      method: "PUT",
      body: { value, justification: justification.trim() || null },
    });
    setLocal((s) => ({
      ...s,
      [code]: { value, justification, saved: r.ok, error: r.ok ? undefined : r.error.message || humanMessage(r.error) },
    }));
  }

  function choose(code: string, value: Answer) {
    const justification = local[code]?.justification ?? "";
    setLocal((s) => ({ ...s, [code]: { value, justification, saved: false } }));
    void save(code, value, justification);
  }

  function justify(code: string, text: string) {
    const value = local[code]?.value ?? "nao_se_aplica";
    setLocal((s) => ({ ...s, [code]: { value, justification: text, saved: false } }));
    window.clearTimeout(timers.current[code]);
    timers.current[code] = window.setTimeout(() => void save(code, value, text), 600);
  }

  async function complete() {
    setCompleting(true);
    setCompleteError(null);
    const r = await api(`${base}/complete`, { method: "POST" });
    setCompleting(false);
    if (!r.ok) return setCompleteError(r.error.message || humanMessage(r.error));
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <nav aria-label="Seções do diagnóstico" className="flex flex-col gap-1 lg:sticky lg:top-6 lg:self-start">
        <div className="mb-2 px-3">
          <div className="flex items-baseline justify-between text-body-sm">
            <span className="font-medium">Progresso</span>
            <span className="tabular-nums text-text-secondary">{answered} de {total}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface-hover" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered} aria-label="Perguntas respondidas">
            <div className="h-full bg-electric-blue transition-[width] duration-(--duration-complex) ease-(--ease-out)" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
          </div>
        </div>
        {data.sections.map((s, i) => {
          const done = s.questions.filter((q) => local[q.code]?.saved).length;
          const active = i === sectionIdx;
          return (
            <button key={s.number} type="button" onClick={() => setSectionIdx(i)} aria-current={active ? "step" : undefined} className={`flex h-10 items-center justify-between rounded-md px-3 text-left text-body-sm hover:bg-surface-hover ${active ? "bg-surface-hover font-medium text-text-primary" : "text-text-secondary"}`}>
              <span className="truncate">{s.number}. {s.name}</span>
              <span className="ml-2 shrink-0 tabular-nums text-caption">{done === s.questions.length ? <Check aria-label="completa" size={14} strokeWidth={1.5} className="inline text-success-text" /> : `${done}/${s.questions.length}`}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col gap-6">
        <div>
          <span className="text-label uppercase text-text-secondary">Seção {section.number} de {data.sections.length}</span>
          <h2 className="mt-1 text-h2">{section.name}</h2>
        </div>
        <ol className="flex flex-col gap-4">
          {section.questions.map((q, i) => {
            const state = local[q.code];
            return (
              <li key={q.code} className="rounded-lg border border-border bg-surface-elevated p-5">
                <fieldset disabled={!canAnswer}>
                  <legend className="text-body font-medium text-text-primary">
                    <span className="mr-2 text-text-secondary tabular-nums">{i + 1}.</span>
                    {q.text}
                  </legend>
                  <div role="radiogroup" aria-label={`Resposta ${q.code}`} className="mt-4 flex flex-wrap gap-2">
                    {OPTIONS.map((o) => {
                      const checked = state?.value === o.value;
                      return (
                        <label key={o.value} title={o.hint} className={`inline-flex h-10 cursor-pointer items-center rounded-md border px-3 text-body-sm ${checked ? "border-electric-blue bg-info-tint font-medium text-info-text" : "border-border bg-surface-elevated text-text-primary hover:bg-surface-hover"}`}>
                          <input type="radio" name={q.code} value={o.value} checked={checked} onChange={() => choose(q.code, o.value)} className="sr-only" />
                          {o.label}
                        </label>
                      );
                    })}
                  </div>
                  {state?.value === "nao_se_aplica" ? (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <label htmlFor={`${q.code}-j`} className="text-body-sm font-medium">Por que não se aplica?</label>
                      <input id={`${q.code}-j`} value={state.justification} onChange={(e) => justify(q.code, e.target.value)} maxLength={500} className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body" placeholder="Ex.: não tratamos dados de menores" />
                    </div>
                  ) : null}
                  <p className="mt-4 text-body-sm text-text-secondary">
                    <span className="font-medium text-text-primary">Por que importa: </span>
                    {q.help_text}
                  </p>
                  {q.expected_evidence ? (
                    <p className="mt-2 text-caption text-text-secondary">Evidência esperada: {q.expected_evidence}</p>
                  ) : null}
                  <p className="mt-2 text-caption" aria-live="polite">
                    {state?.error ? <span className="text-danger-text">{state.error}</span> : state?.saved ? <span className="text-success-text">Salvo</span> : state ? <span className="text-text-secondary">{state.value === "nao_se_aplica" && !state.justification.trim() ? "Informe a justificativa para salvar" : "Salvando…"}</span> : null}
                  </p>
                </fieldset>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex gap-2">
            <Button variant="secondary" disabled={sectionIdx === 0} onClick={() => setSectionIdx((i) => i - 1)}>
              <ChevronLeft aria-hidden size={16} strokeWidth={1.5} /> Anterior
            </Button>
            <Button variant="secondary" disabled={sectionIdx === data.sections.length - 1} onClick={() => setSectionIdx((i) => i + 1)}>
              Próxima <ChevronRight aria-hidden size={16} strokeWidth={1.5} />
            </Button>
          </div>
          <div className="flex flex-col items-end gap-2">
            {completeError ? <Alert tone="danger">{completeError}</Alert> : null}
            <Button disabled={!canAnswer || answered < total || completing} onClick={complete} title={answered < total ? `${total - answered} pergunta(s) sem resposta` : undefined}>
              {completing ? "Concluindo…" : "Concluir diagnóstico"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
