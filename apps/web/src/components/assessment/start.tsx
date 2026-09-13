"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";

/** Mode choice (assessment-v1-scope.md §4): short = first value in ~5 min; full = complete picture. */
export function AssessmentStart({
  orgId,
  shortSize,
  fullSize,
  canAnswer,
}: {
  orgId: string;
  shortSize: number;
  fullSize: number;
  canAnswer: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"short" | "full" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(mode: "short" | "full") {
    setPending(mode);
    setError(null);
    const r = await api(`/api/v1/orgs/${orgId}/assessment/start`, { method: "POST", body: { mode } });
    setPending(null);
    if (!r.ok) return setError(humanMessage(r.error));
    router.refresh();
  }

  const options = [
    { mode: "short" as const, title: "Diagnóstico rápido", size: shortSize, time: "cerca de 5 minutos", text: "As perguntas de maior impacto. Gera os primeiros riscos e um score preliminar." },
    { mode: "full" as const, title: "Diagnóstico completo", size: fullSize, time: "15 a 20 minutos", text: "Sete seções. Você pode parar e continuar depois; cada resposta é salva." },
  ];
  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {options.map((o) => (
          <section key={o.mode} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-elevated p-6">
            <h2 className="text-h3">{o.title}</h2>
            <p className="text-body-sm text-text-secondary">
              {o.size} perguntas · {o.time}
            </p>
            <p className="text-body text-text-primary">{o.text}</p>
            <div className="mt-auto pt-2">
              <Button variant={o.mode === "short" ? "primary" : "secondary"} disabled={!canAnswer || pending !== null} onClick={() => start(o.mode)}>
                {pending === o.mode ? "Iniciando…" : o.mode === "short" ? "Começar pelo rápido" : "Fazer o completo"}
              </Button>
            </div>
          </section>
        ))}
      </div>
      {!canAnswer ? <p className="text-body-sm text-text-secondary">Seu perfil é somente leitura. Peça a um administrador ou membro para iniciar o diagnóstico.</p> : null}
      <p className="text-caption text-text-secondary">
        Diagnóstico baseado nas suas respostas. Evidências fortalecem o score. O conteúdo regulatório desta versão ainda está em verificação e não substitui orientação jurídica.
      </p>
    </div>
  );
}
