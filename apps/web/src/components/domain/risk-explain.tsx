"use client";

import { MessageSquareText } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";
import type { AgentAsk } from "@/lib/domain/queries";
import { BasisList } from "./agent-panel";

const QUESTION = "Por que este risco importa para a nossa empresa e o que fazer primeiro?";

/**
 * Contextual explanation of one risk (D35 focus): the model sees the organization bundle plus
 * this risk's record, its controls and open actions. Rendered only when the model is enabled.
 */
export function RiskExplain({ orgId, riskId }: { orgId: string; riskId: string }) {
  const [result, setResult] = useState<AgentAsk | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explain() {
    setPending(true);
    setError(null);
    const r = await api<AgentAsk>(`/api/v1/orgs/${orgId}/agent/ask`, {
      method: "POST",
      body: { question: QUESTION, focus: { kind: "risk", id: riskId } },
    });
    setPending(false);
    if (!r.ok) {
      return setError(r.status === 429 ? "Muitas perguntas em sequência. Aguarde um pouco." : r.error.message || humanMessage(r.error));
    }
    setResult(r.data);
  }

  return (
    <section aria-labelledby="explicar" className="rounded-lg border border-border bg-surface-elevated p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareText aria-hidden size={18} strokeWidth={1.5} className="text-text-secondary" />
          <h2 id="explicar" className="text-h3">Entender este risco</h2>
        </div>
        <Button type="button" variant="secondary" onClick={explain} disabled={pending}>
          {pending ? "Consultando…" : result ? "Explicar de novo" : "Explicar este risco"}
        </Button>
      </div>
      <p className="mt-1 text-caption text-text-secondary">
        {QUESTION} A resposta é gerada a partir dos registros deste risco e da organização.
      </p>
      {error ? (
        <div className="mt-3">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}
      <div aria-live="polite">
        {result ? (
          <div className="mt-4 rounded-md border border-border bg-surface-base p-4">
            <p className="text-body whitespace-pre-line">{result.answer}</p>
            <BasisList basis={result.basis} />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
              {result.interpretation ? <Badge label="Inclui interpretação" tone="warning" /> : null}
              <span>
                Gerado por modelo de linguagem{result.model ? ` (${result.model})` : ""}. {result.caveat}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
