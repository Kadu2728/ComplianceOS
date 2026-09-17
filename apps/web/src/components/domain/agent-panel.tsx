"use client";

import { MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";
import type { AgentAnswer, AgentAsk, AgentQuestion, AgentStatus } from "@/lib/domain/queries";
import { formatDate } from "@/lib/domain/labels";
import { type ScoreRef, formatInstantDay, refHref } from "@/lib/domain/score";

type Shown = {
  question: string;
  answer: string;
  basis: { kind: string; id: string; title: string }[];
  caveat: string;
  computed_at: string;
  source: "model" | "deterministic";
  model: string | null;
  interpretation: boolean;
  out_of_scope: boolean;
};

const RATE_LIMITED = "Muitas perguntas em sequência. Aguarde um pouco e tente de novo.";

/** Deterministic answers stamp a calendar day; model answers stamp an instant. */
function when(iso: string): string {
  return iso.length === 10 ? formatDate(iso) : formatInstantDay(iso);
}

function errorText(status: number, message: string, fallback: string): string {
  return status === 429 ? RATE_LIMITED : message || fallback;
}

/** Record chips under an answer: the only things the answer may rest on. */
export function BasisList({ basis }: { basis: Shown["basis"] }) {
  if (basis.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-caption text-text-secondary">Base:</span>
      {basis.map((b) => (
        <Link
          key={`${b.kind}-${b.id}`}
          href={refHref({ kind: b.kind as ScoreRef["kind"], id: b.id })}
          className="inline-flex h-6 items-center rounded-pill border border-border px-2 text-caption text-text-primary hover:bg-surface-hover"
        >
          {b.title}
        </Link>
      ))}
    </div>
  );
}

/**
 * Compliance Agent (D32 + D35): one question, one grounded answer, with the records it rests on.
 * Not a chat — no thread, no memory; each answer is computed from today's records. Canonical
 * questions are answered deterministically; free text needs the model (status.free_text).
 */
export function AgentPanel({
  orgId,
  questions,
  status,
  className = "",
}: {
  orgId: string;
  questions: AgentQuestion[];
  status: AgentStatus | null;
  className?: string;
}) {
  const fieldId = useId();
  const [shown, setShown] = useState<Shown | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const freeText = status?.free_text ?? false;
  const maxLength = status?.question_max_length ?? 500;

  async function askCanonical(q: AgentQuestion) {
    setPending(q.key);
    setError(null);
    const r = await api<AgentAnswer>(`/api/v1/orgs/${orgId}/agent/answers/${q.key}`);
    setPending(null);
    if (!r.ok) return setError(errorText(r.status, r.error.message, humanMessage(r.error)));
    setShown({ ...r.data, source: "deterministic", model: null, interpretation: false, out_of_scope: false });
  }

  async function askFree(question: string) {
    setPending("free");
    setError(null);
    const r = await api<AgentAsk>(`/api/v1/orgs/${orgId}/agent/ask`, { method: "POST", body: { question } });
    setPending(null);
    if (!r.ok) return setError(errorText(r.status, r.error.message, humanMessage(r.error)));
    setShown(r.data);
    setText("");
  }

  return (
    <section aria-labelledby="agente" className={`rounded-lg border border-border bg-surface-elevated p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageSquareText aria-hidden size={18} strokeWidth={1.5} className="text-text-secondary" />
        <h2 id="agente" className="text-h3">Agente de compliance</h2>
      </div>
      <p className="mt-1 text-caption text-text-secondary">
        Respostas a partir dos registros desta organização, com a base de cada afirmação. Apoio operacional, não orientação jurídica.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Perguntas prontas">
        {questions.map((q) => {
          const active = shown?.question === q.question;
          return (
            <li key={q.key}>
              <button
                type="button"
                onClick={() => askCanonical(q)}
                disabled={pending !== null}
                aria-pressed={active}
                className={`inline-flex h-8 items-center rounded-pill border px-3 text-body-sm transition-colors duration-(--duration-fast) disabled:opacity-60 ${
                  active
                    ? "border-electric-blue bg-info-tint font-medium text-info-text"
                    : "border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {pending === q.key ? "Consultando…" : q.question}
              </button>
            </li>
          );
        })}
      </ul>

      {freeText ? (
        <form
          className="mt-4 flex flex-col gap-2 md:flex-row md:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const q = text.trim();
            if (q.length >= 3) void askFree(q);
          }}
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor={fieldId} className="text-body-sm font-medium">Sua pergunta</label>
            <input
              id={fieldId}
              name="question"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={maxLength}
              placeholder="Ex.: qual risco tem o prazo mais próximo e quem é o responsável?"
              className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body placeholder:text-text-muted"
            />
          </div>
          <Button type="submit" disabled={pending !== null || text.trim().length < 3}>
            {pending === "free" ? "Consultando…" : "Perguntar"}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-caption text-text-secondary">
          Perguntas livres ficam disponíveis quando o modelo de linguagem é habilitado nesta instalação.
        </p>
      )}

      {error ? (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <div aria-live="polite" className="mt-4">
        {shown ? (
          <div className="rounded-md border border-border bg-surface-base p-4">
            <p className="text-caption text-text-secondary">{shown.question}</p>
            <p className="mt-2 text-body whitespace-pre-line">{shown.answer}</p>
            <BasisList basis={shown.basis} />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
              {shown.interpretation ? <Badge label="Inclui interpretação" tone="warning" /> : null}
              {shown.out_of_scope ? <Badge label="Fora dos registros" tone="neutral" /> : null}
              <span>
                {shown.source === "model"
                  ? `Gerado por modelo de linguagem${shown.model ? ` (${shown.model})` : ""} a partir dos registros`
                  : "Calculado a partir dos registros"}
                {" · "}
                {when(shown.computed_at)}
              </span>
            </div>
            <p className="mt-2 text-caption text-text-secondary">{shown.caveat}</p>
          </div>
        ) : (
          <p className="text-body-sm text-text-secondary">
            Escolha uma pergunta pronta{freeText ? " ou escreva a sua" : ""}. A resposta mostra os registros em que se baseia.
          </p>
        )}
      </div>
    </section>
  );
}
