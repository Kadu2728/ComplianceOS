"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

export function ReopenButton({ orgId, mode, label, variant = "secondary" }: { orgId: string; mode?: "short" | "full"; label: string; variant?: "primary" | "secondary" | "tertiary" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant={variant}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await api(`/api/v1/orgs/${orgId}/assessment/reopen`, { method: "POST", body: mode ? { mode } : {} });
        setPending(false);
        router.refresh();
      }}
    >
      {pending ? "Abrindo…" : label}
    </Button>
  );
}
