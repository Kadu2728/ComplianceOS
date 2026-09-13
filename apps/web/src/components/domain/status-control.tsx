"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";

/**
 * Status change (brand §34 "Resolve"): a select of the transitions the API allows from the
 * current status, plus "Aplicar". The API remains the authority — a rejected transition shows
 * its message. Transition tables mirror app/services/domain.py.
 */
const RISK_NEXT: Record<string, string[]> = {
  aberto: ["em_andamento", "em_revisao", "aceito"],
  em_andamento: ["em_revisao", "aberto", "aceito"],
  em_revisao: ["resolvido", "em_andamento", "aberto"],
  resolvido: ["aberto"],
  aceito: ["aberto"],
};
const ACTION_NEXT: Record<string, string[]> = {
  a_fazer: ["em_andamento", "bloqueada"],
  em_andamento: ["em_revisao", "concluida", "bloqueada", "a_fazer"],
  em_revisao: ["concluida", "em_andamento"],
  bloqueada: ["a_fazer", "em_andamento"],
  concluida: ["a_fazer"],
};

export function StatusControl({
  kind,
  path,
  current,
  labels,
}: {
  kind: "risk" | "action";
  path: string; // /api/v1/orgs/{org}/risks/{id}
  current: string;
  labels: Record<string, string>; // plain strings only: this is a client component
}) {
  const router = useRouter();
  const options = (kind === "risk" ? RISK_NEXT : ACTION_NEXT)[current] ?? [];
  const [next, setNext] = useState(options[0] ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (options.length === 0) return null;
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const r = await api(`${path}/status`, { method: "POST", body: { status: next } });
        setPending(false);
        if (!r.ok) {
          setError(r.error.message || humanMessage(r.error));
          return;
        }
        router.refresh();
      }}
    >
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1.5 text-body-sm font-medium text-text-primary">
          Mover para
          <select
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface-elevated px-3 text-body font-normal"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {labels[o] ?? o}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Aplicando…" : "Aplicar"}
        </Button>
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </form>
  );
}
