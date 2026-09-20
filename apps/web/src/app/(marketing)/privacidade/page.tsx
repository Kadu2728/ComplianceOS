import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/marketing/legal-notice";
import { PRIVACY } from "@/lib/marketing/legal";
import { site } from "@/lib/marketing/site";

/** Política de Privacidade (D13), owner-approved text from `lib/marketing/legal.ts`; published once `site.legalReady`. */
export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade da plataforma Compliance OS.",
  alternates: { canonical: `${site.siteUrl}/privacidade` },
};

export default function PrivacidadePage() {
  if (!site.legalReady) notFound();
  return <LegalDocumentPage document={PRIVACY} />;
}
