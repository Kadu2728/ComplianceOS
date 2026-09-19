import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalNotice } from "@/components/marketing/legal-notice";
import { site } from "@/lib/marketing/site";

/**
 * Interim privacy notice (D13 pending; text from 04-legal-review.md §3.2). Publishable only with
 * a real controller and mailbox (`site.legalReady`) and after human legal review — until then
 * the route does not exist.
 */
export const metadata: Metadata = {
  title: "Aviso de privacidade (beta)",
  robots: { index: false, follow: false },
};

export default function PrivacidadePage() {
  if (!site.legalReady || !site.contactEmail || !site.legalEntity) notFound();
  return (
    <LegalNotice
      title="Aviso de privacidade — versão interina do beta"
      paragraphs={[
        "O Compliance OS está em beta. Este aviso resume, em linguagem simples, o que fazemos com os seus dados enquanto a política de privacidade completa não é publicada — o que acontecerá antes da abertura ao público.",
        "Ao criar a conta, coletamos o nome da empresa, o seu nome, o seu e-mail de trabalho e uma senha, guardada apenas em forma protegida. Usamos esses dados para criar e operar a sua conta e para falar com você sobre o serviço.",
        "O que você registra no produto — riscos, controles, ações, evidências, documentos e respostas do diagnóstico — são registros da sua organização. Usamos esses registros apenas para prestar o serviço.",
        "Os dados ficam em banco de dados hospedado em São Paulo (Brasil), em provedores de nuvem contratados pela Compliance OS. A lista de provedores e as informações sobre eventual transferência internacional constarão da política completa.",
        "Usamos apenas os cookies necessários para manter a sua sessão.",
        `Para acessar, corrigir ou excluir seus dados, ou para qualquer dúvida, escreva para ${site.contactEmail}.`,
        `Responsável pelo tratamento: ${site.legalEntity}.`,
      ]}
    />
  );
}
