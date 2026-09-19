import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalNotice } from "@/components/marketing/legal-notice";
import { site } from "@/lib/marketing/site";

/**
 * Interim conditions of use (D13 pending; text from 04-legal-review.md §3.3). Publishable only
 * with a real legal entity and mailbox (`site.legalReady`) and after human legal review — until
 * then the route does not exist.
 */
export const metadata: Metadata = {
  title: "Condições do beta",
  robots: { index: false, follow: false },
};

export default function TermosPage() {
  if (!site.legalReady || !site.contactEmail || !site.legalEntity) notFound();
  return (
    <LegalNotice
      title="Condições de uso — versão interina do beta"
      paragraphs={[
        "O Compliance OS está em beta: um período de teste gratuito, sem cartão e sem cobrança. Os termos de uso completos serão publicados antes da abertura ao público.",
        "O que o produto é: uma plataforma para organizar diagnóstico, riscos, controles, ações, evidências e documentos. Ele não emite parecer jurídico, não certifica, não audita e não garante conformidade com nenhuma lei. As decisões sobre a sua operação continuam sendo suas e dos profissionais que você escolher.",
        "Sua conta: quem cria a organização é o responsável por ela e pelos usuários que convidar. Registre apenas dados que você tem o direito de usar.",
        "Estágio beta: algumas funções ainda não estão disponíveis (por exemplo, upload de arquivos), e o serviço pode passar por ajustes e interrupções. Mantenha cópia do que for importante para você.",
        `Para dúvidas ou para encerrar a sua conta, escreva para ${site.contactEmail}.`,
        `Responsável pelo serviço: ${site.legalEntity}.`,
      ]}
    />
  );
}
