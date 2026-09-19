"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useSubmit } from "./use-submit";

export function SignupForm() {
  const router = useRouter();
  const { pending, error, fields, submit } = useSubmit<unknown>();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void submit(
          "/api/v1/auth/signup",
          {
            name: f.get("name"),
            email: f.get("email"),
            password: f.get("password"),
            organization_name: f.get("organization_name"),
          },
          () => {
            router.replace("/");
            router.refresh();
          },
        );
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TextField id="organization_name" name="organization_name" label="Nome da empresa" autoComplete="organization" required error={fields.organization_name} />
      <TextField id="name" name="name" label="Seu nome" autoComplete="name" required error={fields.name} />
      <TextField id="email" name="email" type="email" label="E-mail de trabalho" autoComplete="email" required error={fields.email} />
      <TextField id="password" name="password" type="password" label="Senha" autoComplete="new-password" required minLength={10} hint="Mínimo de 10 caracteres." error={fields.password} />
      <Button type="submit" disabled={pending}>
        {pending ? "Criando conta…" : "Criar conta"}
      </Button>
      {/* TODO(D13): when `site.legalReady` is true, show "Ao criar a conta, você concorda com as
          Condições do beta e leu o Aviso de privacidade (beta)." linking /termos and /privacidade
          (04-legal-review.md §3.1). No logic until the notices pass human legal review. */}
      <p className="text-body-sm text-text-secondary">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-info-text underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </form>
  );
}
