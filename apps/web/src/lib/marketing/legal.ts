import { site } from "@/lib/marketing/site";

/**
 * Definitive legal documents (decision D13), written and approved by the owner on 2026-09-19 and
 * reproduced verbatim — this file is content, not copy to be edited by engineering. The contact
 * mailbox comes from `site.ts` so the documents and the footer never drift apart.
 */

export type LegalBlock = { type: "p"; text: string } | { type: "ul"; items: string[] } | { type: "h3"; text: string };
export type LegalSection = { heading: string; blocks: LegalBlock[] };
export type LegalDocument = { title: string; updated: string; sections: LegalSection[] };

const EMAIL = site.contactEmail ?? "complianceos1199@gmail.com";
const RESPONSAVEL = site.legalEntity ?? "Carlos Eduardo Diogo";

const p = (text: string): LegalBlock => ({ type: "p", text });
const ul = (...items: string[]): LegalBlock => ({ type: "ul", items });
const h3 = (text: string): LegalBlock => ({ type: "h3", text });

export const TERMS: LegalDocument = {
  title: "Termos de Uso — Compliance OS",
  updated: "19 de setembro de 2026",
  sections: [
    {
      heading: "1. Sobre estes Termos",
      blocks: [
        p("Estes Termos de Uso regulam o acesso e a utilização da plataforma Compliance OS, uma solução SaaS destinada a apoiar empresas e profissionais na organização, gestão e acompanhamento de processos relacionados a compliance, riscos, controles, documentos e informações de conformidade."),
        p("Ao criar uma conta, contratar um plano ou utilizar a plataforma, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso."),
        p("Caso não concorde com estes termos, o usuário não deverá utilizar a plataforma."),
      ],
    },
    {
      heading: "2. Responsável pelo serviço",
      blocks: [p("Compliance OS"), p(`E-mail de contato: ${EMAIL}`), p(`Responsável: ${RESPONSAVEL}`)],
    },
    {
      heading: "3. Definições",
      blocks: [
        p("Compliance OS: plataforma SaaS disponibilizada para apoiar processos de compliance, riscos e conformidade."),
        p("Usuário: pessoa física que cria uma conta ou utiliza a plataforma."),
        p("Cliente: pessoa física ou jurídica que contrata um plano pago do Compliance OS."),
        p("Conta: registro individual utilizado para acesso à plataforma."),
        p("Plano: modalidade de assinatura disponibilizada pelo Compliance OS, com suas respectivas funcionalidades, limites e condições comerciais."),
      ],
    },
    {
      heading: "4. Objeto da plataforma",
      blocks: [
        p("O Compliance OS fornece ferramentas destinadas a auxiliar o usuário na organização e gestão de atividades relacionadas a compliance, riscos, controles, documentos, evidências e processos internos."),
        p("A plataforma é uma ferramenta de apoio operacional e organizacional."),
        p("O Compliance OS não substitui assessoria jurídica, consultoria especializada, auditoria independente, contador, profissional de segurança da informação, encarregado de proteção de dados ou qualquer outro profissional especializado."),
        p("A utilização da plataforma não constitui garantia de conformidade legal ou regulatória do Cliente."),
        p("A responsabilidade pelas decisões tomadas com base nas informações, documentos, registros ou resultados produzidos por meio da plataforma permanece com o usuário ou Cliente."),
      ],
    },
    {
      heading: "5. Cadastro e conta",
      blocks: [
        p("Para utilizar determinadas funcionalidades, o usuário deverá criar uma conta fornecendo informações verdadeiras, completas e atualizadas."),
        p("O usuário é responsável por:"),
        ul(
          "manter seus dados cadastrais atualizados;",
          "proteger suas credenciais de acesso;",
          "não compartilhar sua senha;",
          "comunicar imediatamente qualquer acesso não autorizado;",
          "utilizar sua conta de acordo com estes Termos.",
        ),
        p("O usuário não deverá utilizar dados falsos, criar contas fraudulentas ou tentar obter acesso a contas de terceiros."),
      ],
    },
    {
      heading: "6. Assinaturas e pagamentos",
      blocks: [
        p("O acesso às funcionalidades pagas do Compliance OS depende da contratação de um plano de assinatura."),
        p("Os planos, preços, periodicidade, funcionalidades e eventuais limites serão apresentados no momento da contratação."),
        p("Os pagamentos poderão ser processados por meio da Kiwify, que atua como plataforma de processamento da transação conforme suas próprias condições e políticas."),
        p("A contratação poderá ocorrer mediante pagamento recorrente, conforme o plano escolhido."),
        p("O acesso às funcionalidades vinculadas ao plano pago será disponibilizado de acordo com a confirmação do pagamento e os mecanismos de integração existentes entre a plataforma de pagamento e o Compliance OS."),
      ],
    },
    {
      heading: "7. Renovação e cancelamento",
      blocks: [
        p("As assinaturas poderão ser renovadas automaticamente conforme a periodicidade escolhida pelo Cliente no momento da contratação."),
        p("O Cliente poderá solicitar o cancelamento de sua assinatura conforme as condições apresentadas no momento da contratação e os procedimentos disponibilizados pela plataforma de pagamento."),
        p("O cancelamento interromperá futuras cobranças, sem prejuízo de valores eventualmente devidos referentes ao período já contratado."),
        p("Quando aplicável, direitos de arrependimento, reembolso e demais direitos previstos na legislação serão respeitados."),
      ],
    },
    {
      heading: "8. Suspensão ou encerramento da conta",
      blocks: [
        p("O Compliance OS poderá suspender ou encerrar uma conta quando houver:"),
        ul(
          "violação destes Termos;",
          "utilização fraudulenta da plataforma;",
          "tentativa de acesso não autorizado;",
          "utilização da plataforma para atividades ilícitas;",
          "comprometimento da segurança da plataforma;",
          "inadimplência;",
          "determinação legal ou regulatória.",
        ),
        p("Sempre que possível e adequado, o usuário será informado sobre a razão da suspensão ou encerramento."),
      ],
    },
    {
      heading: "9. Uso proibido",
      blocks: [
        p("É proibido utilizar o Compliance OS para:"),
        ul(
          "praticar atividades ilícitas;",
          "violar direitos de terceiros;",
          "tentar obter acesso não autorizado à plataforma;",
          "explorar vulnerabilidades de segurança;",
          "distribuir malware ou código malicioso;",
          "realizar ataques contra a infraestrutura;",
          "interferir no funcionamento da plataforma;",
          "utilizar informações de terceiros sem autorização;",
          "realizar engenharia reversa da plataforma, salvo quando permitido pela legislação aplicável;",
          "utilizar a plataforma de maneira que possa causar danos à infraestrutura ou a outros usuários.",
        ),
      ],
    },
    {
      heading: "10. Conteúdo inserido pelo usuário",
      blocks: [
        p("O usuário permanece responsável pelo conteúdo, documentos, informações e dados inseridos na plataforma."),
        p("O usuário declara possuir os direitos ou autorizações necessárias para inserir e utilizar essas informações."),
        p("O Compliance OS não assume responsabilidade pela legalidade, exatidão ou legitimidade dos conteúdos inseridos pelo usuário."),
      ],
    },
    {
      heading: "11. Propriedade intelectual",
      blocks: [
        p("A plataforma, incluindo seu código, arquitetura, identidade visual, marca, interface, textos, elementos gráficos, funcionalidades e demais componentes, pertence ao Compliance OS ou aos respectivos titulares de direitos."),
        p("A contratação de uma assinatura não transfere ao usuário qualquer direito de propriedade sobre a plataforma."),
        p("O usuário recebe apenas uma licença limitada, não exclusiva, revogável e não transferível para utilizar o serviço durante o período contratado e de acordo com estes Termos."),
      ],
    },
    {
      heading: "12. Disponibilidade do serviço",
      blocks: [
        p("O Compliance OS buscará manter a plataforma disponível e funcional, mas não garante disponibilidade ininterrupta."),
        p("Podem ocorrer indisponibilidades decorrentes de manutenção, atualizações, falhas de infraestrutura, problemas de provedores terceiros, falhas de internet, incidentes de segurança, eventos de força maior ou outras situações fora do controle razoável do Compliance OS."),
      ],
    },
    {
      heading: "13. Segurança",
      blocks: [
        p("O Compliance OS adotará medidas técnicas e administrativas razoáveis para proteger os dados tratados pela plataforma contra acessos não autorizados, perda, destruição, alteração ou tratamento inadequado, considerando a natureza dos dados e os riscos envolvidos."),
        p("Nenhum sistema conectado à internet pode garantir segurança absoluta."),
        p("O usuário também é responsável por adotar boas práticas de segurança, especialmente na proteção de suas credenciais e dispositivos."),
      ],
    },
    {
      heading: "14. Privacidade e proteção de dados",
      blocks: [
        p("O tratamento de dados pessoais realizado pelo Compliance OS é descrito em sua Política de Privacidade."),
        p("A Política de Privacidade integra estes Termos de Uso e deve ser consultada pelo usuário antes da utilização da plataforma."),
      ],
    },
    {
      heading: "15. Serviços de terceiros",
      blocks: [
        p("O funcionamento do Compliance OS poderá depender de serviços de terceiros, incluindo serviços de hospedagem, infraestrutura, banco de dados, autenticação, processamento de pagamentos e outros serviços necessários à operação."),
        p("Atualmente, os principais serviços utilizados são:"),
        ul(
          "Vercel, para infraestrutura/hospedagem da aplicação;",
          "Neon, para infraestrutura do banco de dados;",
          "Google, conforme os serviços específicos utilizados pela plataforma;",
          "Kiwify, para processamento das vendas e assinaturas.",
        ),
      ],
    },
    {
      heading: "16. Alterações da plataforma",
      blocks: [
        p("O Compliance OS poderá modificar, atualizar, adicionar ou remover funcionalidades para melhorar a plataforma."),
        p("Alterações relevantes nas condições de uso poderão ser comunicadas aos usuários por meios razoáveis."),
      ],
    },
    {
      heading: "17. Alterações destes Termos",
      blocks: [
        p("Estes Termos poderão ser atualizados periodicamente para refletir mudanças legais, regulatórias, comerciais ou tecnológicas."),
        p("A versão vigente será disponibilizada na plataforma."),
      ],
    },
    {
      heading: "18. Limitação de responsabilidade",
      blocks: [
        p("O Compliance OS fornece uma ferramenta tecnológica de apoio e não garante determinado resultado de negócio, jurídico, regulatório ou operacional."),
        p("O usuário permanece responsável pelas informações inseridas, pelas decisões tomadas, pelos processos internos de sua organização e pelo cumprimento das obrigações legais aplicáveis à sua atividade."),
        p("Nenhuma disposição destes Termos pretende excluir ou limitar direitos que não possam ser excluídos ou limitados pela legislação aplicável."),
      ],
    },
    {
      heading: "19. Atendimento",
      blocks: [p("Dúvidas, solicitações ou comunicações relacionadas à plataforma poderão ser encaminhadas para:"), p(EMAIL)],
    },
    {
      heading: "20. Legislação aplicável",
      blocks: [p("Estes Termos serão interpretados de acordo com as leis da República Federativa do Brasil.")],
    },
    {
      heading: "21. Aceite",
      blocks: [p("Ao criar uma conta, contratar um plano ou utilizar o Compliance OS, o usuário declara que leu e concorda com estes Termos de Uso.")],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: "Política de Privacidade — Compliance OS",
  updated: "19 de setembro de 2026",
  sections: [
    {
      heading: "1. Apresentação",
      blocks: [
        p("Esta Política de Privacidade explica como o Compliance OS coleta, utiliza, armazena, protege e eventualmente compartilha dados pessoais relacionados à utilização de sua plataforma."),
        p("O documento foi elaborado considerando a Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)."),
        p("O Compliance OS busca tratar dados pessoais de maneira transparente, adequada e limitada às finalidades necessárias para a prestação de seus serviços."),
      ],
    },
    {
      heading: "2. Responsável pelo tratamento",
      blocks: [p(`Responsável: ${RESPONSAVEL}`), p("Serviço: Compliance OS"), p(`E-mail: ${EMAIL}`)],
    },
    {
      heading: "3. Encarregado e canal de comunicação",
      blocks: [
        p("Para facilitar o exercício dos direitos relacionados à proteção de dados, o Compliance OS disponibiliza o seguinte canal:"),
        p(`E-mail: ${EMAIL}`),
        p(`Responsável pelo atendimento: ${RESPONSAVEL}`),
      ],
    },
    {
      heading: "4. Quais dados podemos coletar",
      blocks: [
        p("Dependendo da forma como o usuário utiliza a plataforma, podemos tratar:"),
        h3("4.1. Dados de cadastro"),
        ul("nome;", "endereço de e-mail;", "informações necessárias para criação e gerenciamento da conta;", "credenciais de autenticação."),
        h3("4.2. Dados relacionados à utilização"),
        p("Podemos tratar informações necessárias para funcionamento e segurança da plataforma, como:"),
        ul(
          "registros de acesso;",
          "endereço IP;",
          "informações técnicas do dispositivo e navegador;",
          "registros de erros;",
          "informações relacionadas às ações realizadas dentro da plataforma.",
        ),
        h3("4.3. Dados inseridos pelo usuário"),
        p("O usuário poderá inserir documentos, informações, registros, evidências, dados empresariais e outras informações necessárias para utilização das funcionalidades do Compliance OS."),
        p("O usuário é responsável por garantir que possui autorização adequada para inserir dados de terceiros na plataforma."),
      ],
    },
    {
      heading: "5. Finalidades do tratamento",
      blocks: [
        p("Os dados pessoais poderão ser utilizados para:"),
        ul(
          "criar e administrar contas;",
          "autenticar usuários;",
          "fornecer as funcionalidades do Compliance OS;",
          "processar e administrar assinaturas;",
          "realizar cobranças;",
          "fornecer suporte;",
          "comunicar informações relacionadas ao serviço;",
          "prevenir fraudes e abusos;",
          "proteger a segurança da plataforma;",
          "identificar e solucionar erros;",
          "cumprir obrigações legais e regulatórias;",
          "exercer direitos em processos judiciais, administrativos ou arbitrais;",
          "melhorar a estabilidade e funcionamento da plataforma.",
        ),
        p("O tratamento será realizado conforme as hipóteses legais aplicáveis a cada situação."),
      ],
    },
    {
      heading: "6. Bases legais",
      blocks: [
        p("Dependendo da finalidade e do contexto, o tratamento poderá estar fundamentado em hipóteses legais previstas na LGPD, incluindo:"),
        ul(
          "execução de contrato ou de procedimentos preliminares relacionados ao contrato;",
          "cumprimento de obrigação legal ou regulatória;",
          "exercício regular de direitos;",
          "legítimo interesse, quando aplicável e observados os requisitos legais;",
          "consentimento, quando necessário.",
        ),
      ],
    },
    {
      heading: "7. Pagamentos e assinaturas",
      blocks: [
        p("As compras e assinaturas poderão ser processadas pela Kiwify."),
        p("Os dados necessários para processamento do pagamento poderão ser tratados diretamente pela Kiwify de acordo com suas próprias políticas, termos e procedimentos."),
        p("O Compliance OS não deve armazenar dados completos de cartão de crédito quando o processamento for realizado diretamente pela plataforma de pagamento."),
      ],
    },
    {
      heading: "8. Serviços e fornecedores",
      blocks: [
        p("Para disponibilizar o Compliance OS, poderemos utilizar fornecedores de infraestrutura e tecnologia."),
        p("Atualmente, estão previstos:"),
        ul(
          "Vercel: hospedagem e infraestrutura da aplicação;",
          "Neon: infraestrutura do banco de dados;",
          "Google: conforme os serviços efetivamente integrados à plataforma;",
          "Kiwify: processamento de vendas e assinaturas.",
        ),
        p("O compartilhamento com fornecedores será limitado ao necessário para execução dos serviços correspondentes."),
      ],
    },
    {
      heading: "9. Analytics e rastreamento",
      blocks: [
        p("O Compliance OS não utiliza ferramentas de analytics, publicidade comportamental ou rastreamento de terceiros, além dos serviços efetivamente necessários para a operação da plataforma."),
        p("Caso novas ferramentas de analytics, publicidade, monitoramento ou rastreamento sejam implementadas, esta Política poderá ser atualizada para refletir o novo tratamento."),
      ],
    },
    {
      heading: "10. Cookies",
      blocks: [
        p("O Compliance OS poderá utilizar cookies e tecnologias semelhantes estritamente necessários para:"),
        ul("autenticação;", "manutenção da sessão;", "segurança;", "funcionamento da plataforma;", "armazenamento de preferências necessárias à utilização do serviço."),
        p("Caso sejam utilizados cookies não essenciais ou tecnologias destinadas a análise, publicidade ou rastreamento, o usuário será informado conforme aplicável."),
      ],
    },
    {
      heading: "11. Armazenamento dos dados",
      blocks: [
        p("Os dados são armazenados utilizando serviços de infraestrutura tecnológica contratados pelo Compliance OS, incluindo a infraestrutura da Vercel e do Neon."),
        p("O período de armazenamento dependerá da finalidade do tratamento, da relação contratual e das obrigações legais aplicáveis."),
        p("Os dados não serão mantidos por período superior ao necessário para cumprir as finalidades para as quais foram coletados, salvo quando houver fundamento legal que permita ou exija sua conservação."),
      ],
    },
    {
      heading: "12. Exclusão de conta",
      blocks: [
        p("O usuário poderá solicitar a exclusão de sua conta pelo endereço:"),
        p(EMAIL),
        p("As solicitações de exclusão serão analisadas e processadas em até 30 dias, sempre que possível."),
        p("A exclusão poderá não abranger informações cuja conservação seja necessária para cumprimento de obrigação legal ou regulatória, exercício regular de direitos, prevenção de fraude ou outras hipóteses previstas na legislação aplicável."),
      ],
    },
    {
      heading: "13. Direitos dos titulares",
      blocks: [
        p("Nos termos da LGPD e observadas as condições legais aplicáveis, o titular poderá solicitar:"),
        ul(
          "confirmação da existência de tratamento;",
          "acesso aos dados;",
          "correção de dados incompletos, inexatos ou desatualizados;",
          "anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;",
          "portabilidade, quando regulamentada e aplicável;",
          "eliminação dos dados tratados com base no consentimento, observadas as hipóteses legais de conservação;",
          "informações sobre compartilhamento de dados;",
          "revogação do consentimento, quando essa for a base legal utilizada;",
          "oposição ao tratamento nas hipóteses previstas na LGPD;",
          "revisão de decisões tomadas unicamente com base em tratamento automatizado, quando aplicável.",
        ),
      ],
    },
    {
      heading: "14. Como solicitar o exercício dos direitos",
      blocks: [
        p("O titular poderá enviar sua solicitação para:"),
        p(EMAIL),
        p("Para proteger os dados pessoais, poderemos solicitar informações adicionais para confirmar a identidade do solicitante quando necessário."),
      ],
    },
    {
      heading: "15. Segurança da informação",
      blocks: [
        p("O Compliance OS adota medidas técnicas e administrativas destinadas a proteger os dados pessoais contra acessos não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou tratamento inadequado."),
        p("Apesar dessas medidas, nenhum sistema conectado à internet oferece garantia absoluta de segurança."),
      ],
    },
    {
      heading: "16. Incidentes de segurança",
      blocks: [
        p("Caso ocorra um incidente de segurança envolvendo dados pessoais que possa acarretar risco ou dano relevante aos titulares, o Compliance OS adotará as medidas cabíveis previstas na legislação e regulamentação aplicáveis."),
        p("Quando necessário, serão realizadas as comunicações exigidas às autoridades e aos titulares."),
      ],
    },
    {
      heading: "17. Dados de terceiros inseridos pelo Cliente",
      blocks: [
        p("O Compliance OS poderá permitir que Clientes insiram dados pessoais de seus próprios colaboradores, clientes, fornecedores ou outras pessoas."),
        p("Nesses casos, o Cliente deverá garantir que possui fundamento jurídico adequado para o tratamento e que fornece as informações necessárias aos titulares, quando aplicável."),
        p("O Cliente permanece responsável pela legitimidade dos dados que inserir na plataforma e pelas instruções fornecidas ao Compliance OS."),
      ],
    },
    {
      heading: "18. Transferência internacional",
      blocks: [
        p("Alguns fornecedores de tecnologia utilizados pelo Compliance OS poderão processar ou armazenar dados em infraestrutura localizada fora do Brasil."),
        p("Quando houver transferência internacional de dados pessoais, o Compliance OS adotará as medidas e mecanismos exigidos pela legislação e regulamentação aplicáveis."),
      ],
    },
    {
      heading: "19. Menores de idade",
      blocks: [
        p("O Compliance OS não é destinado a crianças."),
        p("Caso seja identificado tratamento inadequado de dados de crianças ou adolescentes, serão adotadas medidas cabíveis considerando a legislação aplicável e o melhor interesse desses titulares."),
      ],
    },
    {
      heading: "20. Alterações desta Política",
      blocks: [
        p("Esta Política poderá ser atualizada para refletir alterações legais, regulatórias, novas funcionalidades, mudanças nos fornecedores ou alterações nas operações de tratamento."),
        p("A versão atualizada será disponibilizada na plataforma."),
      ],
    },
    {
      heading: "21. Contato",
      blocks: [p("Para dúvidas, solicitações ou assuntos relacionados à privacidade e proteção de dados:"), p(EMAIL)],
    },
    {
      heading: "22. Vigência",
      blocks: [
        p("Esta Política de Privacidade entra em vigor na data indicada no início do documento e permanecerá válida enquanto estiver publicada na plataforma, podendo ser atualizada conforme descrito nesta Política."),
      ],
    },
  ],
};
