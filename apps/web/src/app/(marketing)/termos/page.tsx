import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocumentPage } from "@/components/marketing/legal-notice";
import { TERMS } from "@/lib/marketing/legal";
import { site } from "@/lib/marketing/site";

/** Termos de Uso (D13), owner-approved text from `lib/marketing/legal.ts`; published once `site.legalReady`. */
export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso da plataforma Compliance OS.",
  alternates: { canonical: `${site.siteUrl}/termos` },
};

export default function TermosPage() {
  if (!site.legalReady) notFound();
  return <LegalDocumentPage document={TERMS} />;
}
