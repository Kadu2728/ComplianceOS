import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { RecoverForm } from "@/components/auth/recover-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <>
      <AuthHeading title="Recuperar senha" description="Enviaremos um link para o seu e-mail." />
      <RecoverForm />
    </>
  );
}
