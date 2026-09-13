"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { ICON_STROKE } from "./nav-items";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
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
      className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-body-sm text-text-secondary hover:bg-surface-hover disabled:opacity-40"
    >
      <LogOut aria-hidden size={20} strokeWidth={ICON_STROKE} />
      <span>{pending ? "Saindo…" : "Sair"}</span>
    </button>
  );
}
