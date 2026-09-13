import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <>
      <AuthHeading title="Entrar" description="Acesse a operação de compliance da sua empresa." />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
