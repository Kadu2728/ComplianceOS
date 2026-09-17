"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { ICON_STROKE } from "./nav-items";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label = pending ? "Saindo…" : "Sair";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await api("/api/v1/auth/logout", { method: "POST" });
        router.replace("/entrar");
        router.refresh();
      }}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={
        compact
          ? "flex size-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors duration-(--duration-fast) hover:bg-surface-hover hover:text-text-primary disabled:opacity-40"
          : "flex h-10 w-full items-center gap-3 rounded-md px-3 text-body-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40"
      }
    >
      <LogOut aria-hidden size={compact ? 18 : 20} strokeWidth={ICON_STROKE} />
      <span className={compact ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}
