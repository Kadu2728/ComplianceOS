"use client";

import { useRouter } from "next/navigation";
import { useSubmit } from "@/components/auth/use-submit";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

/** Organization name (owner only — `org.update`). */
export function OrganizationForm({ orgId, name }: { orgId: string; name: string }) {
  const router = useRouter();
  const { pending, error, fields, submit } = useSubmit<{ name: string }>();
  return (
    <form
      className="flex max-w-[480px] flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void submit(`/api/v1/orgs/${orgId}`, { name: String(f.get("name") ?? "").trim() }, () => router.refresh(), "PATCH");
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="org-name" name="name" label="Nome da organização" required minLength={2} maxLength={120} defaultValue={name} error={fields.name} />
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar nome"}
        </Button>
      </div>
    </form>
  );
}
