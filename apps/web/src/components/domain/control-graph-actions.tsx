"use client";

import { Link2, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, humanMessage } from "@/lib/api/client";

/** Control maturity ladder (brand §34 "Resolve"): the API is the authority (verificado needs proof). */
const NEXT: Record<string, string[]> = {
  planejado: ["parcial", "implementado", "inativo"],
  parcial: ["implementado", "planejado", "inativo"],
  implementado: ["verificado", "parcial", "inativo"],
  verificado: ["implementado", "inativo"],
  inativo: ["planejado", "implementado"],
};

export function ControlStatusControl({
  orgId,
  controlId,
  current,
  labels,
  evidenceCount,
}: {
  orgId: string;
  controlId: string;
  current: string;
  labels: Record<string, string>;
  evidenceCount: number;
}) {
  const router = useRouter();
  const options = NEXT[current] ?? [];
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
        const r = await api(`/api/v1/orgs/${orgId}/controls/${controlId}`, { method: "PATCH", body: { status: next } });
        setPending(false);
        if (!r.ok) return setError(r.error.message || humanMessage(r.error));
        router.refresh();
      }}
    >
      <label htmlFor="control-next" className="text-body-sm font-medium">Mudar maturidade para</label>
      <div className="flex gap-2">
        <select id="control-next" value={next} onChange={(e) => setNext(e.target.value)} className="h-10 flex-1 rounded-md border border-border bg-surface-elevated px-3 text-body">
          {options.map((o) => (
            <option key={o} value={o} disabled={o === "verificado" && evidenceCount === 0}>
              {labels[o] ?? o}{o === "verificado" && evidenceCount === 0 ? " (anexe evidência)" : ""}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={pending}>{pending ? "Aplicando…" : "Aplicar"}</Button>
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </form>
  );
}

/** Link or unlink a risk ↔ control edge (managers). Used on both the risk and the control page. */
export function LinkRiskControl({
  orgId,
  controlId,
  riskId,
  options,
  mode,
}: {
  orgId: string;
  controlId?: string; // fixed when on a control page
  riskId?: string; // fixed when on a risk page
  options: { id: string; label: string }[];
  mode: "link" | "unlink";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState(options[0]?.id ?? "");
  if (mode === "unlink" && controlId && riskId) {
    return (
      <button
        type="button"
        disabled={pending}
        aria-label="Desvincular"
        title="Desvincular"
        onClick={async () => {
          setPending(true);
          const r = await api(`/api/v1/orgs/${orgId}/controls/${controlId}/risks/${riskId}`, { method: "DELETE" });
          setPending(false);
          if (!r.ok) return setError(r.error.message || humanMessage(r.error));
          router.refresh();
        }}
        className="flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-danger-text disabled:opacity-40"
      >
        <Unlink aria-hidden size={14} strokeWidth={1.5} />
      </button>
    );
  }
  if (options.length === 0) return null;
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const c = controlId ?? choice;
        const rk = riskId ?? choice;
        const r = await api(`/api/v1/orgs/${orgId}/controls/${c}/risks/${rk}`, { method: "POST" });
        setPending(false);
        if (!r.ok) return setError(r.error.message || humanMessage(r.error));
        router.refresh();
      }}
    >
      <div className="flex gap-2">
        <select aria-label={controlId ? "Risco a vincular" : "Controle a vincular"} value={choice} onChange={(e) => setChoice(e.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-border bg-surface-elevated px-2 text-body-sm">
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" disabled={pending}>
          <Link2 aria-hidden size={16} strokeWidth={1.5} /> {pending ? "Vinculando…" : "Vincular"}
        </Button>
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </form>
  );
}
