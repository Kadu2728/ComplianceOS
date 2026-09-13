import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function CriarContaPage() {
  return (
    <>
      <AuthHeading title="Criar conta" description="Você será o responsável pela organização criada." />
      <SignupForm />
    </>
  );
}
