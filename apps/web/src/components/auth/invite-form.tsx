"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useSubmit } from "./use-submit";

export function InviteForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { pending, error, fields, submit } = useSubmit<unknown>();

  if (!token) return <Alert tone="danger">Convite inválido. Peça um novo convite ao administrador.</Alert>;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("name") ?? "").trim();
        const password = String(f.get("password") ?? "");
        void submit(
          "/api/v1/auth/invitations/accept",
          { token, name: name || undefined, password: password || undefined },
          () => {
            router.replace("/");
            router.refresh();
          },
        );
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <p className="text-body-sm text-text-secondary">
        Se você ainda não tem conta, informe seu nome e uma senha. Se já tem, deixe em branco.
      </p>
      <TextField id="name" name="name" label="Seu nome" autoComplete="name" error={fields.name} />
      <TextField id="password" name="password" type="password" label="Senha" autoComplete="new-password" minLength={10} hint="Mínimo de 10 caracteres." error={fields.password} />
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Aceitar convite"}
      </Button>
    </form>
  );
}
