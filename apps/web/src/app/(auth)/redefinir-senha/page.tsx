import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function RedefinirSenhaPage() {
  return (
    <>
      <AuthHeading title="Redefinir senha" />
      <Suspense>
        <ResetForm />
      </Suspense>
    </>
  );
}
