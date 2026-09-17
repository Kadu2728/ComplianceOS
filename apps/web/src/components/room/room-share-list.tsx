"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { api, humanMessage } from "@/lib/api/client";

export type ShareItem = {
  id: string;
  title: string;
  subtitle: string;
  shared: boolean;
  /** Why the record cannot be shared right now (faltante document, control not implemented). */
  blocked?: string;
};

/** Explicit, per-record sharing (D36, threat model T3). Each toggle is one audited request. */
export function RoomShareList({
  orgId,
  kind,
  items,
  emptyText,
}: {
  orgId: string;
  kind: "documents" | "controls";
  items: ShareItem[];
  emptyText: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((i) => [i.id, i.shared])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(item: ShareItem, shared: boolean) {
    setBusy(item.id);
    setError(null);
    const r = await api<{ id: string; shared: boolean }>(`/api/v1/orgs/${orgId}/room/${kind}/${item.id}`, {
      method: "PUT",
      body: { shared },
    });
    setBusy(null);
    if (!r.ok) return setError(r.error.message || humanMessage(r.error));
    setState((s) => ({ ...s, [item.id]: r.data.shared }));
    router.refresh();
  }

  if (items.length === 0) return <p className="text-body-sm text-text-secondary">{emptyText}</p>;
  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <ul className="divide-y divide-border rounded-md border border-border">
        {items.map((item) => {
          const checked = state[item.id] ?? false;
          return (
            <li key={item.id} className="flex items-start gap-3 p-3">
              <input
                id={`share-${kind}-${item.id}`}
                type="checkbox"
                checked={checked}
                disabled={busy !== null || (!checked && !!item.blocked)}
                onChange={(e) => toggle(item, e.target.checked)}
                className="mt-1 size-4 accent-electric-blue disabled:opacity-40"
              />
              <label htmlFor={`share-${kind}-${item.id}`} className="flex flex-1 flex-col gap-0.5">
                <span className="text-body-sm font-medium">{item.title}</span>
                <span className="text-caption text-text-secondary">{item.subtitle}</span>
                {!checked && item.blocked ? <span className="text-caption text-warning-text">{item.blocked}</span> : null}
              </label>
              {busy === item.id ? <span className="text-caption text-text-secondary">Salvando…</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
