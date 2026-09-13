"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useSubmit } from "./use-submit";

export function RecoverForm() {
  const [sent, setSent] = useState(false);
  const { pending, error, fields, submit } = useSubmit<unknown>();

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">
          Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha. Ele expira em 60 minutos.
        </Alert>
        <Link href="/entrar" className="text-body-sm text-info-text underline underline-offset-2">
          Voltar para o login
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
        void submit("/api/v1/auth/password-reset/request", { email: f.get("email") }, () => setSent(true));
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="email" name="email" type="email" label="E-mail" autoComplete="email" required error={fields.email} />
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Enviar link de redefinição"}
      </Button>
    </form>
  );
}
