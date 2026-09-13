import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { InviteForm } from "@/components/auth/invite-form";

export const metadata: Metadata = { title: "Convite" };

export default function ConvitePage() {
  return (
    <>
      <AuthHeading title="Aceitar convite" description="Você foi convidado(a) para uma organização." />
      <Suspense>
        <InviteForm />
      </Suspense>
    </>
  );
}
