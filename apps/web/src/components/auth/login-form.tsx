"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useSubmit } from "./use-submit";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { pending, error, fields, submit } = useSubmit<unknown>();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void submit("/api/v1/auth/login", { email: f.get("email"), password: f.get("password") }, () => {
          router.replace(next && next.startsWith("/") ? next : "/");
          router.refresh();
        });
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="email" name="email" type="email" label="E-mail" autoComplete="email" required error={fields.email} />
      <TextField id="password" name="password" type="password" label="Senha" autoComplete="current-password" required error={fields.password} />
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <div className="flex justify-between text-body-sm">
        <Link href="/recuperar-senha" className="text-info-text underline underline-offset-2">
          Esqueci minha senha
        </Link>
        <Link href="/criar-conta" className="text-info-text underline underline-offset-2">
          Criar conta
        </Link>
      </div>
    </form>
  );
}
