"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useSubmit } from "./use-submit";

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = useState(false);
  const { pending, error, fields, submit } = useSubmit<unknown>();

  if (!token) return <Alert tone="danger">Link inválido. Solicite uma nova redefinição de senha.</Alert>;
  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">Senha atualizada. Entre novamente para continuar.</Alert>
        <Link href="/entrar" className="text-body-sm text-info-text underline underline-offset-2">
          Ir para o login
        </Link>
      </div>
    );
  }
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void submit("/api/v1/auth/password-reset/confirm", { token, password: f.get("password") }, () => setDone(true));
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="password" name="password" type="password" label="Nova senha" autoComplete="new-password" required minLength={10} hint="Mínimo de 10 caracteres." error={fields.password} />
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Definir nova senha"}
      </Button>
    </form>
  );
}
