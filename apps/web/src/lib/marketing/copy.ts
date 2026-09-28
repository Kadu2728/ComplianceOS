/**
 * Landing copy v2 — `landing-v2/02-copy.md` (Marketing & Growth, 2026-09-27) fitted to the slot
 * limits of `docs/design/landing-v2.md` §9. Sentences tagged [approved] in 02-copy.md keep the
 * wording that passed `04-legal-review.md` (2026-09-18). Engineering does not edit wording here;
 * a copy change is a change to this file only. Every claim is traceable to a product fact
 * (02-copy.md "Claims to verify"); new visitor-facing copy still needs human legal review (D37).
 */

export const NAV = {
  /** Page order (landing-v2 §4.1). "Dúvidas" echoes the FAQ title; there is no "Sobre" page. */
  items: [
    { label: "Como funciona", hash: "#como-funciona" },
    { label: "Produto", hash: "#produto" },
    { label: "Planos", hash: "#planos" },
    { label: "Dúvidas", hash: "#faq" },
  ],
  login: { label: "Entrar", href: "/entrar" },
  cta: { label: "Comece grátis", href: "/criar-conta" },
  skip: "Pular para o conteúdo",
} as const;

export const HERO = {
  eyebrow: "Plataforma de operações de compliance",
  title: ["Conheça seus riscos.", "Controle seu negócio."] as const,
  lead: "Veja onde estão os riscos da sua empresa, o que corrigir primeiro e a prova do que foi feito — em um único sistema. Compliance corporativo sem precisar de um departamento de compliance.",
  /** Always shown: it qualifies the ICP (Product review 2026-09-27, MUST 2). [approved] */
  audience: "Para empresas que precisam mostrar controle sobre dados e riscos a clientes, parceiros e auditores.",
  primary: { label: "Comece grátis", href: "/criar-conta" },
  secondary: { label: "Ver como funciona", href: "#como-funciona" },
  /** Facts, not topics (landing-v2 §4.3.2); the approved hero microcopy. */
  facts: ["Primeiro mês grátis", "Sem cartão de crédito", "12 perguntas para o primeiro Score"],
  callout: ["Mais clareza.", "Mais controle.", "Mais confiança."],
  caption: "Exemplo com dados ilustrativos de uma organização fictícia.",
  /** Numbers are the ones visible in `assets/marketing/hero-desktop.webp` (captured 2026-09-27). */
  desktopAlt:
    "Visão geral do Compliance OS para a organização fictícia Acme Tecnologia Ltda.: Score de Compliance 69 de 100, faixa Organizado, evolução de abril a setembro; riscos em atenção por severidade; próximo passo; e os seis módulos do produto.",
  phoneAlt: "A mesma visão geral no celular.",
} as const;

export const PROBLEM = {
  id: "problema",
  eyebrow: "O problema",
  title: "Compliance não deveria depender de planilhas, documentos espalhados e processos manuais.",
  lead: "Riscos numa planilha do ano passado, políticas numa pasta que ninguém revisa, ações na cabeça de uma pessoa. O Compliance OS reúne riscos, controles, ações e evidências em um único sistema — e mostra o que vem primeiro.",
  cards: [
    { icon: "clock", title: "Processos manuais", text: "Controle feito à mão, em planilhas e e-mails. Nada mostra o que venceu ou atrasou." },
    { icon: "folder", title: "Informações dispersas", text: "Riscos, políticas e provas em lugares diferentes. Ninguém sabe o que está atualizado." },
    { icon: "inbox", title: "Pedidos de clientes", text: "Um cliente maior pede documentação e evidências. A resposta vira uma corrida." },
  ],
} as const;

export const CONTROL_LAYER = {
  id: "control-layer",
  eyebrow: "The Control Layer",
  title: "Uma camada de controle para o seu negócio.",
  lead: "O Compliance OS liga risco, controle, ação e evidência em um único sistema — e mantém tudo visível. Cada item sabe de onde veio, o que resolve e o que prova.",
  cta: { label: "Conheça o produto", href: "#produto" },
  /** Top → bottom; evidence is the base the rest stands on (≤ 14 chars; descriptors ≥ 1024 only). */
  layers: [
    { label: "Visão geral", note: "Score e atenção do dia" },
    { label: "Riscos", note: "Severidade e prioridade" },
    { label: "Controles", note: "Maturidade e documentos" },
    { label: "Ações", note: "Responsável, prazo e estado" },
    { label: "Evidências", note: "Nota, link ou documento" },
  ],
  figureCaption:
    "Ilustração de cinco camadas empilhadas: Visão geral no topo; abaixo, Riscos, Controles, Ações e, na base, Evidências.",
} as const;

export const HOW_IT_WORKS = {
  id: "como-funciona",
  eyebrow: "Como funciona",
  title: "Do diagnóstico à prova, em um único fluxo.",
  /** The core flow (CLAUDE.md §3). The seven areas stay in the Diagnóstico FAQ. */
  steps: [
    { icon: "clipboard", title: "Diagnosticar", text: "42 perguntas em 7 áreas. Modo curto: 12 perguntas e o primeiro Score." },
    { icon: "scan", title: "Entender", text: "Cada lacuna vira um risco com probabilidade, impacto e severidade explicados." },
    { icon: "order", title: "Priorizar", text: "Ações ordenadas por severidade, exposição, urgência e esforço." },
    { icon: "checks", title: "Corrigir", text: "Plano em um passo: controle e ação com responsável e prazo." },
    { icon: "file", title: "Comprovar", text: "Prova por nota, link ou documento, ligada ao que ela comprova." },
    { icon: "history", title: "Monitorar", text: "Score com histórico e o que precisa de atenção hoje." },
  ],
} as const;

export const PRODUCT = {
  id: "produto",
  eyebrow: "Produto",
  title: "Veja o risco. Corrija a lacuna. Prove o controle.",
  lead: "Seis módulos, os mesmos registros. Cada módulo responde a uma pergunta da sua operação — e o que muda em um aparece nos outros.",
  cta: { label: "Comece grátis", href: "/criar-conta" },
  modules: [
    { icon: "brain", name: "Risk Brain", text: "Oito perguntas prontas sobre seus riscos, respondidas a partir dos seus registros." },
    { icon: "graph", name: "Control Graph", text: "Riscos ligados a controles, ações e evidências. Controle só chega a Verificado com evidência." },
    { icon: "radar", name: "Risk Radar", text: "O que precisa de atenção hoje, com o motivo de cada item." },
    { icon: "plan", name: "Action Plan", text: "Riscos viram ações com responsável, prazo e estado — planejadas em um passo." },
    { icon: "vault", name: "Evidence Vault", text: "Evidências com validade; documentos com versão, responsável e status." },
    { icon: "room", name: "Compliance Room", text: "Quando um cliente pedir prova, envie um link do que você liberar, com prazo e revogação.", tag: "Plus e Ultimate" },
  ],
  /** Doubles as the demo-data caption of the preview (landing-v2 §4.7.3). */
  chip: "Visão geral · dados ilustrativos",
  previewAlt: "Visão geral do Compliance OS no celular, com o Score de Compliance e sua evolução, para uma organização fictícia.",
} as const;

/** The reference's "IA + Automação" slot, honest (owner decision 2, 2026-09-27): no AI claim. */
export const AUTOMATION = {
  id: "automacao",
  eyebrow: "Risk Brain + Risk Radar",
  title: "Menos trabalho manual.",
  lead: "O Compliance OS faz as contas que você faria em planilhas: transforma respostas em riscos, ordena prioridades, recalcula o Score e aponta o que precisa de atenção — com o motivo e os registros de origem.",
  cta: { label: "Ver os planos", href: "#planos" },
  items: [
    { icon: "brain", title: "Perguntas respondidas", text: "Risk Brain: 8 perguntas prontas, com os registros de origem." },
    { icon: "radar", title: "Atenção do dia", text: "Risk Radar: o que venceu, atrasou ou ficou sem prova." },
    { icon: "checks", title: "Plano em um passo", text: "Controle, ação sugerida e evidência esperada para cada risco." },
    { icon: "trend", title: "Score explicado", text: "Recalculado a cada mudança, com o que mais o reduz." },
  ],
  // Mandatory as written (legal review L43, 2026-09-27): true while the language model is off (D35).
  footnote:
    "Respostas calculadas por regras explícitas: os mesmos registros geram a mesma resposta. Perguntas em texto livre ainda não estão disponíveis.",
} as const;

export const PLANS = {
  id: "planos",
  eyebrow: "Planos",
  title: "Primeiro mês grátis. Depois, um plano por organização.",
  lead: "Preços em reais, por mês, por organização. O que ainda está desligado está escrito aqui, não nas letras pequenas.",
  /**
   * Trial band (08-plans.md §3): Ultimate for 30 days, no card — it is the account itself, not a
   * Kiwify trial. The Kiwify checkouts charge on the day of purchase (verified 2026-09-26: no trial
   * configured), so the free month is always reached by creating the account first.
   */
  trial: {
    eyebrow: "Primeiro mês",
    title: "30 dias grátis com tudo do Ultimate",
    text: "Sem cartão para começar: crie a conta e use tudo do Ultimate por 30 dias. Depois, assine o plano que fizer sentido, com pagamento pela Kiwify.",
    cta: { label: "Comece grátis", href: "/criar-conta" },
  },
  currency: "R$",
  period: "/mês",
  unit: "por organização",
  /** Tier CTA: "Assinar {name}" → that tier's Kiwify checkout (external, same tab). */
  subscribeLabel: "Assinar",
  /** Secondary path under every tier: the free month, with the plan intent in the URL. */
  trialLinkLabel: "Ou comece com 1 mês grátis",
  /**
   * Plan matrix decided by the Product Strategist (08-plans.md §2); limits are not enforced by the
   * product yet. `checkoutUrl` is the owner-provided Kiwify checkout (2026-09-26); there is no webhook,
   * so a purchase is matched to its organization by e-mail, by hand (D25).
   */
  tiers: [
    {
      slug: "standard",
      checkoutUrl: "https://pay.kiwify.com.br/adfcJVQ",
      name: "Standard",
      price: "39",
      audience: "Para quem precisa organizar a compliance da empresa e saber o que fazer primeiro.",
      limits: ["1 organização", "Até 2 usuários"],
      included: [
        "Diagnóstico completo (42 perguntas em 7 áreas) e modo curto",
        "Riscos com probabilidade, impacto e severidade explicados",
        "Controles do catálogo com maturidade",
        "Ações com responsável, prazo, esforço e estado; plano em um passo",
        "Evidências e Documentos com validade e status",
        "Score de Compliance com histórico e próximos passos",
        "“O que precisa de atenção hoje” e “O que fazer primeiro”",
        "Histórico e papéis Proprietário, Administrador, Membro e Leitura",
      ],
      recommended: false,
    },
    {
      slug: "plus",
      checkoutUrl: "https://pay.kiwify.com.br/LzcnU7s",
      name: "Plus",
      price: "59",
      audience: "Para empresas que precisam provar a maturidade a clientes, parceiros e auditores.",
      limits: ["1 organização", "Até 5 usuários", "Sala de compliance com até 5 links ativos"],
      includedLabel: "Tudo do Standard, mais",
      included: [
        "Sala de compliance: documentos e controles que você escolhe liberar, links com prazo e revogação, cada acesso no Histórico",
        "Score de Compliance na Sala, como indicador de maturidade",
        "Até 5 usuários com responsáveis por risco, ação, controle e documento",
      ],
      recommended: true,
    },
    {
      slug: "ultimate",
      checkoutUrl: "https://pay.kiwify.com.br/dOnCkbF",
      name: "Ultimate",
      price: "89",
      audience: "Para empresas com várias áreas envolvidas, que reportam à diretoria e respondem a vários clientes.",
      limits: ["1 organização", "Até 15 usuários", "Sala de compliance com até 20 links ativos"],
      includedLabel: "Tudo do Plus, mais",
      included: [
        "Resumo executivo: o estado da organização em uma página, para sócios, diretoria e clientes",
        "Lembrete por e-mail de documentos vencendo, para os responsáveis (quando disponível)",
        "Até 15 usuários e até 20 links ativos na Sala",
      ],
      recommended: false,
    },
  ],
  recommendedLabel: "Recomendado",
  footnotes: [
    "Uma segunda organização é uma segunda assinatura.",
    "O pagamento pela Kiwify inicia a assinatura mensal na data da compra. Na compra, use o mesmo e-mail da sua conta no Compliance OS.",
    // [PENDENTE D11] and beta upload lines: true today.
    "No beta, o upload de arquivos, os convites de equipe e a recuperação de senha por e-mail ainda estão desligados; evidências por nota, link e documento funcionam.",
  ],
  contact: {
    title: "Empresas maiores, consultorias e parceiros",
    text: "Várias organizações, exigências específicas de segurança ou acompanhamento próximo? Fale com a gente.",
    ctaLabel: "Fale com a gente",
    mailSubject: "Compliance OS — empresas maiores e parceiros",
  },
} as const;

/**
 * FAQ v2 (02-copy.md §9): the reference's six questions first, then the approved ones that
 * survive. `{contactEmail}` renders as a mailto link to `site.contactEmail`; `link` is appended
 * after the answer; `privacyLink` answers get the Política de Privacidade sentence when published.
 */
export const FAQ = {
  id: "faq",
  eyebrow: "FAQ",
  title: "Tire suas dúvidas.",
  lead: "Respostas curtas, sem promessa de conformidade.",
  more: "Não encontrou sua pergunta? Escreva para {contactEmail}.",
  privacyLink: { prefix: "Os detalhes estão na", label: "Política de Privacidade", href: "/privacidade" },
  items: [
    {
      q: "O que é o Compliance OS?",
      a: "Uma plataforma de operações de compliance. Você responde a um diagnóstico sobre a sua operação; o sistema transforma as lacunas em riscos com severidade explicada e ajuda você a planejar controles e ações com responsável e prazo, registrar evidências e acompanhar um Score de Compliance que mostra o que puxa a nota para baixo. É uma ferramenta de gestão: não emite parecer, não certifica e não garante conformidade.",
    },
    {
      q: "Posso testar gratuitamente?",
      a: "Sim: o primeiro mês é grátis em qualquer plano, sem cartão, e nele você usa tudo do Ultimate. Depois, os planos são Standard (R$ 39), Plus (R$ 59) e Ultimate (R$ 89) por mês, por organização; a diferença está no número de usuários, na Sala de compliance e no Resumo executivo. Para assinar, use o botão do plano: o pagamento é processado pela Kiwify e a cobrança começa na data da compra — por isso, para usar o mês grátis, crie a conta primeiro e assine depois. No beta, o upload de arquivos, os convites de equipe e a recuperação de senha por e-mail ainda estão desligados; evidências por nota, link e documento funcionam.",
    },
    {
      q: "Como funciona o suporte?",
      a: "O suporte é feito por e-mail, pelo endereço {contactEmail}. Informe o nome da organização e descreva o que aconteceu — sem enviar senhas nem dados pessoais além do necessário. No beta, não há chat nem prazo de resposta contratado para o suporte.",
      link: { prefix: "Pedidos sobre dados pessoais seguem a", label: "Política de Privacidade", href: "/privacidade" },
    },
    {
      q: "Quais são os métodos de pagamento?",
      // QA 2026-09-28: the checkouts' server state lists only credit card today; legal-review L51
      // fallback, so the page never names a method Kiwify does not offer.
      a: "O pagamento é feito no checkout da Kiwify, que mostra as formas de pagamento disponíveis e as condições de cada uma. Na compra, use o mesmo e-mail da sua conta no Compliance OS — é por ele que identificamos a assinatura da sua organização. Os dados de pagamento são tratados pela Kiwify, conforme as políticas dela.",
    },
    {
      q: "Como meus dados são protegidos? Onde ficam?",
      // Approved FAQ 7 (04-legal-review line 47) + the approved TRUST items (their qualifier kept);
      // every org-scoped route is in the cross-tenant tests since 2026-09-27 (test_tenancy.py).
      a: "Afirmamos só o que podemos provar. Cada organização é isolada das demais: nas rotas que tocam dados da organização, um identificador de outra organização responde “não encontrado” — e isso é coberto por testes automatizados. A sessão usa cookies httpOnly, com token de acesso de 15 minutos e renovação rotativa; senhas são armazenadas com Argon2id; papéis e permissões são verificados no servidor; a aplicação usa CSP com nonce e HSTS em produção. Toda mudança relevante fica registrada em uma trilha de auditoria que a aplicação não permite editar. O banco de dados é hospedado em São Paulo (Brasil). O Compliance OS está em beta e não tem certificações. Nenhum sistema conectado à internet oferece segurança absoluta.",
      privacyLink: true,
    },
    {
      q: "Posso cancelar a qualquer momento?",
      a: "Sim. Os planos são assinaturas mensais, por organização, pagas pela Kiwify e renovadas automaticamente a cada mês. Para cancelar, use os procedimentos da Kiwify ou fale com a gente pelo e-mail de contato: o cancelamento interrompe as cobranças seguintes e não apaga seus registros.",
      link: {
        prefix: "Quando aplicáveis, os direitos de arrependimento e de reembolso previstos na legislação são respeitados, como dizem os",
        label: "Termos de Uso",
        href: "/termos",
        suffix: "; os pedidos podem ser feitos pelos mesmos canais.",
      },
    },
    {
      q: "O Compliance OS substitui advogado, DPO ou consultoria?",
      // 04-legal-review.md line 41 (REESCREVER) applied — verbatim. Landing v2 legal review (2026-09-27): KEEP.
      a: "Não. O Compliance OS é uma plataforma de gestão e operação: organiza diagnóstico, riscos, controles, ações, evidências e documentos. Não emite parecer, não certifica e não garante conformidade. Advogados, DPOs e consultores continuam com o papel deles — e trabalham melhor sobre uma operação organizada.",
    },
    {
      q: "Para quem é o Compliance OS?",
      a: "Para empresas que tratam dados de clientes e precisam mostrar controle sobre dados e riscos — em especial as que vendem para empresas maiores e recebem questionários de segurança ou exigências contratuais — e que não têm um departamento de compliance. Se a sua empresa já tem área de compliance e uma suíte de GRC, provavelmente não é para você.",
    },
    {
      q: "Preciso entender de compliance ou de LGPD para usar?",
      a: "Não. O Diagnóstico pergunta sobre a operação: onde os dados ficam, quem acessa, quais fornecedores, como incidentes são tratados. Cada pergunta traz um “Por que importa”, e cada risco explica por que existe, qual a severidade e o que fazer.",
    },
    {
      q: "Como funciona o Diagnóstico?",
      // Approved FAQ 4 + the approved TRUST methodology sentence (04-legal-review line 34).
      a: "São 42 perguntas em 7 áreas. O modo curto tem 12 perguntas e gera um primeiro Score na mesma sessão. Respostas “não”, “parcial” ou “não sei” viram riscos com probabilidade e impacto explicados. Você pode pausar, retomar, revisar respostas e seguir para o diagnóstico completo. O Diagnóstico é versionado, construído a partir de fontes primárias e aguarda revisão legal humana. Até essa revisão terminar, o produto não cita base legal.",
    },
    {
      q: "O que é o Score de Compliance? Ele diz se minha empresa está “adequada”?",
      a: "Não diz. É um indicador de maturidade operacional de 0 a 100, calculado a partir do que a organização registrou, com cinco fatores e pesos visíveis — Riscos (40%), Controles (20%), Execução (15%), Evidências (15%) e Diagnóstico (10%) —, “O que mais reduz o score” e “Próximos passos”. Ele é recalculado quando os registros mudam e guarda o histórico da evolução. Não é certificação, auditoria nem atestado de conformidade.",
    },
    {
      q: "O que é a Sala de compliance?",
      a: "Um espaço compartilhável por link, com prazo e revogação. O Proprietário da organização escolhe quais documentos e controles liberar — só documentos existentes e controles implementados ou verificados; riscos, ações, evidências e respostas do diagnóstico nunca aparecem. Quem recebe o link vê, sem criar conta, o que foi liberado e o Score, se ativado. Cada acesso fica registrado. Está nos planos Plus e Ultimate, e no mês grátis. A Sala mostra o que a empresa organizou — não é certificação nem atestado.",
    },
    {
      q: "É só para LGPD?",
      // 04-legal-review.md line 49 (REESCREVER) applied — verbatim.
      a: "O Diagnóstico atual cobre proteção de dados pessoais — o campo da LGPD — a partir da sua operação, sem se propor a verificar conformidade com a lei. O modelo risco → controle → ação → evidência não é específico de uma lei: riscos, controles e documentos podem ser criados em qualquer tema. Novos diagnósticos podem ser adicionados, sempre versionados.",
    },
    {
      q: "Minha equipe pode usar junto?",
      // Product review 2026-09-27 MUST 6: invitations are off in production (D11), so no "Sim.".
      a: "O produto foi feito para equipes: há quatro papéis — Proprietário, Administrador, Membro e Leitura —, responsáveis por risco, ação, controle e documento, e um Histórico de quem mudou o quê. O número de usuários depende do plano: 2 no Standard, 5 no Plus, 15 no Ultimate. No beta, os convites de equipe e a recuperação de senha por e-mail ainda estão em ativação.",
    },
  ],
} as const;

export const FINAL = {
  id: "comecar",
  title: "Pronto para conhecer os riscos da sua empresa?",
  text: "Crie a conta, responda às 12 perguntas do modo curto e veja seu primeiro Score e por onde começar.",
  microcopy: "Primeiro mês grátis · Sem cartão de crédito",
  cta: { label: "Comece grátis", href: "/criar-conta" },
  contact: { label: "Fale com a gente", mailSubject: "Compliance OS — contato" },
  /** Shown instead of the contact button when there is no mailbox. */
  login: { label: "Entrar", href: "/entrar" },
} as const;

export const FOOTER = {
  statement: "O Compliance OS é uma plataforma de gestão e operação de compliance. Não emite parecer, não certifica e não substitui advogados, DPOs, consultores nem revisão jurídica.",
  legal: [
    { label: "Termos de Uso", href: "/termos" },
    { label: "Política de Privacidade", href: "/privacidade" },
  ],
  linkedin: "LinkedIn",
  rights: "Todos os direitos reservados.",
} as const;

export const SEO = {
  title: "Compliance OS — Gestão de riscos e compliance para empresas",
  description: "Diagnóstico, riscos, controles, ações e evidências em um único sistema. Sem precisar de um departamento de compliance. Primeiro mês grátis.",
  ogTitle: "Conheça seus riscos. Controle seu negócio. — Compliance OS",
  ogDescription: "Compliance corporativo sem precisar de um departamento de compliance. Veja o risco, corrija a lacuna e prove o controle. Primeiro mês grátis.",
  /** Describes `app/opengraph-image.png` (a brand card, not a screenshot); keep identical to `opengraph-image.alt.txt`. */
  ogImageAlt: "Compliance OS — Know your risk. Control your business. Compliance corporativo sem precisar de um departamento de compliance. Logotipo e símbolo da marca sobre fundo escuro; assinatura “The Control Layer”.",
  softwareDescription:
    "Plataforma de operações de compliance para empresas: diagnóstico de proteção de dados, riscos, controles, ações, evidências, documentos, Score de Compliance explicável e Sala de compliance para demonstrar maturidade a clientes e parceiros. Compliance corporativo sem precisar de um departamento de compliance.",
  featureList: [
    "Diagnóstico de proteção de dados (42 perguntas em 7 áreas; modo curto de 12)",
    "Riscos com probabilidade, impacto e severidade explicados",
    "Controles com maturidade e evidência ligada",
    "Ações com responsável, prazo, esforço e estado",
    "Evidências e documentos com validade e status",
    "Score de Compliance com fatores e pesos visíveis",
    "Sala de compliance com links de prazo limitado",
    "Histórico de alterações",
    "Perguntas prontas sobre riscos, respondidas a partir dos registros (Risk Brain)",
    "O que precisa de atenção hoje, com o motivo (Risk Radar)",
    "Plano de ação em um passo por risco",
  ],
} as const;
