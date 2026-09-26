/**
 * Landing copy — the text of `02-copy.md` (Marketing & Growth, 2026-09-18) with the corrections
 * mandated by `04-legal-review.md` (lines 29, 33, 34, 41, 47, 49) applied per the Orchestrator's
 * decision C. Engineering does not edit wording here; a copy change is a change to this file only.
 * `[PENDENTE D11]` lines are included (true today); the paid-plans commitment is not (no approval).
 */

export const NAV = {
  items: [
    { label: "Produto", hash: "#produto" },
    { label: "Como funciona", hash: "#como-funciona" },
    { label: "Segurança", hash: "#seguranca" },
    { label: "Planos", hash: "#planos" },
    { label: "FAQ", hash: "#faq" },
  ],
  login: { label: "Entrar", href: "/entrar" },
  cta: { label: "Começar gratuitamente", href: "/criar-conta" },
  skip: "Pular para o conteúdo",
} as const;

export const HERO = {
  eyebrow: "Plataforma de operações de compliance",
  title: ["Know your risk.", "Control your business."] as const,
  lead: "Identifique riscos, organize controles, transforme lacunas em ações com responsável e prazo — e acompanhe tudo em um único sistema. Compliance corporativo sem precisar de um departamento de compliance.",
  audience: "Para empresas que precisam mostrar controle sobre dados e riscos a clientes, parceiros e auditores.",
  primary: { label: "Começar gratuitamente", href: "/criar-conta" },
  secondary: { label: "Ver como funciona", href: "#como-funciona" },
  microcopy: ["Primeiro mês grátis", "Sem cartão de crédito", "12 perguntas para o primeiro Score"],
  showcaseCaption: "Exemplo com dados ilustrativos de uma organização fictícia.",
  showcaseAlt:
    "Visão geral do Compliance OS para a organização fictícia Acme Tecnologia Ltda.: “O que precisa de atenção hoje” com itens e motivos, card do Score de Compliance com 74 de 100 e faixa Organizado, seção “Por que 74?” com os cinco fatores, e “O que fazer primeiro”.",
} as const;

export const PROBLEM = {
  id: "problema",
  eyebrow: "The problem",
  title: "Compliance espalhado não é controle.",
  lead: "Um cliente maior pede a documentação de segurança e privacidade. A resposta vira uma corrida por planilhas, pastas e e-mails — e ninguém sabe o que está atualizado.",
  before: {
    label: "Sem sistema",
    items: [
      "Riscos numa planilha do ano passado.",
      "Políticas numa pasta que ninguém revisa.",
      "Ações na cabeça de uma pessoa.",
      "Evidência em lugar nenhum.",
      "Sem saber o que falta — nem o que vem primeiro.",
    ],
  },
  after: {
    label: "Com o Compliance OS",
    items: [
      "Riscos com severidade explicada e responsável.",
      "Controles com maturidade e prova ligada.",
      "Ações com responsável, prazo e estado.",
      "Evidências com validade.",
      "Um Score que diz o que puxa para baixo — e o próximo passo.",
    ],
  },
  figureAlt: "Diagrama: à esquerda, fragmentos dispersos representando riscos, políticas e ações sem conexão; à direita, os mesmos itens ligados em sequência.",
  cost: "O custo não é só tempo. É a oportunidade que fica parada e a insegurança na hora de responder.",
  closing: "Controle é quando risco, controle, ação e evidência estão ligados — e visíveis.",
} as const;

export const CONTROL_LAYER = {
  id: "control-layer",
  eyebrow: "The Control Layer",
  title: "Uma camada de controle sobre a complexidade.",
  lead: "O Compliance OS liga risco, controle, ação e evidência em um único sistema — e mantém tudo sob monitoramento. Cada item sabe de onde veio e o que prova.",
  links: [
    { code: "RISK", title: "O risco explica a si mesmo.", text: "Probabilidade, impacto e severidade visíveis. Você sabe por que ele existe e por que importa para a sua empresa." },
    { code: "CONTROL", title: "O risco aponta para um controle.", text: "Cada risco liga-se a um controle do catálogo, com responsável e maturidade: Planejado, Parcial, Implementado, Verificado." },
    { code: "ACTION", title: "O controle vira ação.", text: "Responsável, prazo, esforço e estado. Risco sem ação é só informação." },
    { code: "EVIDENCE", title: "A ação deixa prova.", text: "Nota, link ou documento, com validade. Um controle só chega a Verificado com evidência ligada a ele." },
    { code: "MONITORING", title: "Tudo continua visível.", text: "O Score, “O que precisa de atenção hoje” e o Histórico refletem cada mudança — e trazem de volta o que vence." },
  ],
  figureAlt: "Diagrama da camada de controle: cinco pontos ligados em sequência — risco, controle, ação, evidência, monitoramento — com o monitoramento voltando ao risco.",
  closing: "Não é um checklist. Não é um cofre de documentos. É um sistema em que cada item explica por que existe, o que resolve e o que prova.",
  support: "Compliance que você consegue operar.",
} as const;

export const HOW_IT_WORKS = {
  id: "como-funciona",
  eyebrow: "How it works",
  title: "Seis etapas. Um único sistema.",
  lead: "Você responde sobre a sua operação. O sistema devolve riscos, prioridades, ações e um Score explicado — e mantém o ciclo aberto enquanto a empresa muda.",
  steps: [
    {
      number: "01",
      title: "Diagnosticar",
      text: "Responda ao Diagnóstico: 42 perguntas em 7 áreas de proteção de dados, escritas na linguagem da sua operação. O modo curto, com 12 perguntas, gera o primeiro Score na mesma sessão — e você pode pausar, retomar e revisar.",
      note: "Dados e finalidades · Acesso e armazenamento · Segurança · Fornecedores e terceiros · Políticas e registros · Titulares e incidentes · Pessoas e responsabilidades",
    },
    { number: "02", title: "Entender", text: "Cada resposta “não”, “parcial” ou “não sei” vira um risco com probabilidade, impacto e severidade explicados. “Não sei” fica registrado como incerteza, não como “não”." },
    { number: "03", title: "Priorizar", text: "“O que fazer primeiro” ordena as ações pendentes por severidade do risco, exposição do seu perfil, urgência e esforço — e mostra quanto o Score ganha em cada uma. “O que precisa de atenção hoje” lista o que venceu, atrasou ou ficou sem prova, com o motivo." },
    { number: "04", title: "Corrigir", text: "Para cada risco, uma recomendação: o controle do catálogo, a ação sugerida e a evidência esperada. Um passo cria o plano; a ação ganha responsável, prazo, esforço e estado." },
    { number: "05", title: "Comprovar", text: "Registre a prova como nota, link ou documento, ligada ao risco, à ação ou ao controle. Evidências têm validade; documentos têm versão, responsável e status." },
    { number: "06", title: "Monitorar", text: "O Score guarda histórico e mostra o que mais o reduz. O Histórico registra quem mudou o quê; o Resumo executivo lê o estado da organização em uma página." },
  ],
} as const;

export const PRODUCT = {
  id: "produto",
  eyebrow: "The product",
  title: "Veja o risco. Corrija a lacuna. Prove o controle.",
  lead: "Cada parte do Compliance OS existe para responder a uma pergunta da sua operação. Sem módulos decorativos.",
  stories: [
    {
      key: "risco",
      title: "Veja o risco.",
      modules: "Diagnóstico · Riscos",
      problem: "Você sabe que tem riscos. Não sabe quais, quanto pesam, nem por quê.",
      value: "O Diagnóstico transforma cada resposta em um risco com categoria, probabilidade, impacto, severidade e responsável — e um texto de “Por que este risco existe”.",
      action: "Abra o risco. Leia por que ele importa para a sua empresa e o que fazer primeiro.",
      alt: "Lista de Riscos com título, severidade, responsável, prazo e status.",
    },
    {
      key: "importa",
      title: "Entenda o que importa.",
      modules: "“O que precisa de atenção hoje” · “O que fazer primeiro” · Perfil da organização",
      problem: "A lista de riscos é sempre maior que a capacidade de agir.",
      value: "O radar mostra o que venceu, atrasou ou ficou sem prova, com o motivo. As prioridades ordenam as ações por severidade, exposição do seu perfil, urgência e esforço — com o ganho de Score de cada uma.",
      action: "Complete o Perfil da organização — segmento, porte, dados tratados, se vende para empresas maiores. Ele contextualiza a prioridade; nunca afirma obrigações.",
      alt: "“O que fazer primeiro” com ações ordenadas, motivos e ganho de Score.",
    },
    {
      key: "acao",
      title: "Transforme risco em ação.",
      modules: "Ações",
      problem: "Risco anotado não é risco tratado.",
      value: "Cada risco recebe uma recomendação — controle, ação sugerida, evidência esperada — e um plano em um passo. Ações têm responsável, prazo, esforço e estado: A fazer, Em andamento, Revisão, Concluída, Bloqueada.",
      action: "Atribua. Acompanhe. O que atrasa entra no radar.",
      alt: "Recomendação de plano para um risco: controle, ação sugerida e evidência esperada; abaixo, a ação com estado, responsável, prazo e esforço.",
    },
    {
      key: "evidencia",
      title: "Conecte controle e evidência.",
      modules: "Controles · Evidências · Documentos",
      problem: "Um documento diz que o controle existe. Não diz se ele funciona.",
      value: "Controles com maturidade (Planejado, Parcial, Implementado, Verificado); evidências por nota, link ou documento, com validade (Vigente, Vencendo, Vencida); documentos com versão, responsável e status: Atualizado, Vencendo, Vencido, Faltante, Em revisão.",
      action: "Ligue a prova ao controle. Só assim ele chega a Verificado.",
      alt: "Controle com maturidade Verificado, evidência vigente com validade e documento com versão e status Atualizado.",
    },
    {
      key: "maturidade",
      title: "Prove sua maturidade.",
      modules: "Sala de compliance · Resumo executivo · Histórico",
      problem: "Quando alguém de fora pede prova, ela está na cabeça de alguém.",
      value: "O Resumo executivo lê o estado da organização em uma página. O Histórico registra quem mudou o quê. A Sala de compliance mostra, a quem você escolher, o que você decidiu compartilhar.",
      action: "Compartilhe com prazo e revogação — e veja cada acesso no Histórico.",
      alt: "Histórico do Compliance OS com registros de quem alterou o quê e quando.",
    },
  ],
} as const;

export const SCORE = {
  id: "score",
  eyebrow: "The score",
  title: "Por que essa pontuação?",
  lead: "O Score de Compliance é um indicador de maturidade de 0 a 100, calculado a partir do que a sua organização registrou. Cinco fatores, pesos visíveis e a lista do que puxa para baixo.",
  factorsTitle: "Cinco fatores. Pesos visíveis.",
  factors: [
    { label: "Diagnóstico", weight: 0.1, text: "Quanto do diagnóstico foi respondido, e quantas respostas ficaram em “não sei”." },
    { label: "Riscos", weight: 0.4, text: "O peso dos riscos em aberto, por severidade. É o fator que mais pesa." },
    { label: "Controles", weight: 0.2, text: "Quantos riscos críticos e altos têm um controle implementado." },
    { label: "Execução", weight: 0.15, text: "Riscos críticos e altos com ação planejada; ações atrasadas." },
    { label: "Evidências", weight: 0.15, text: "Quantos itens fechados têm evidência ligada." },
  ],
  bandsTitle: "Quatro faixas.",
  bands: [
    { label: "Inicial", range: "< 40" },
    { label: "Em estruturação", range: "40–59" },
    { label: "Organizado", range: "60–79", active: true },
    { label: "Maduro", range: "80–100" },
  ],
  card: [
    { title: "“Por que N?”", text: "cada fator com peso, pontos obtidos e um resumo em uma linha." },
    { title: "“O que mais reduz o score”", text: "os itens que mais pesam, com os pontos de cada um." },
    { title: "“Próximos passos”", text: "as ações que mais recuperam pontos, com o ganho simulado." },
  ],
  limit: "Indicador de maturidade operacional, calculado a partir do que a organização registrou. Não é certificação, auditoria nem atestado de conformidade.",
  closing: "Você não recebe apenas uma nota. Você entende o que precisa melhorar.",
  alt: "Card do Score de Compliance: número, faixa, “Por que N?” com cinco fatores e pesos, “O que mais reduz o score” e “Próximos passos”.",
} as const;

export const ROOM = {
  id: "sala",
  eyebrow: "Compliance Room",
  title: "Não basta dizer que sua empresa está preparada. Você precisa conseguir provar.",
  lead: "Seus clientes querem saber se sua empresa está preparada — e pedem documentação, controles e evidências antes de assinar. A Sala de compliance mostra, em um único lugar, o que você escolheu compartilhar.",
  items: [
    { title: "Você escolhe o que entra.", text: "Só documentos existentes e controles implementados ou verificados. Documentos faltantes e controles não implementados não podem ser compartilhados." },
    { title: "Link com prazo e revogação.", text: "De 1 a 90 dias, mostrado uma única vez, revogável a qualquer momento. Até 20 links ativos." },
    { title: "Quem recebe vê sem criar conta.", text: "Nome da organização, apresentação, contato, documentos e controles liberados — e o Score, se você ativar. Nunca riscos, ações, evidências, membros ou respostas do diagnóstico." },
    { title: "Cada acesso fica no Histórico.", text: "Visualizações e downloads são registrados. Só o Proprietário da organização gerencia a Sala." },
  ],
  uses: ["Procurement", "revisão de segurança de cliente", "onboarding de fornecedor", "due diligence", "qualificação de parceria"],
  acquisition: "Seu passaporte de compliance para vender para empresas maiores.",
  caveat: "A Sala mostra o que a sua empresa organizou. Não é certificação, auditoria independente nem atestado de conformidade legal.",
  alt: "Página pública da Sala de compliance vista por um visitante: nome da organização, apresentação, documentos e controles liberados e o aviso de que não constitui certificação nem atestado de conformidade.",
} as const;

export const TRUST = {
  id: "seguranca",
  eyebrow: "Security",
  title: "Só o que podemos provar.",
  lead: "O Compliance OS está em beta e não tem certificações. O que temos são decisões de arquitetura verificáveis e transparência sobre o que está ligado e o que está desligado.",
  groups: [
    {
      title: "Arquitetura e segurança",
      items: [
        { lead: "Isolamento por organização.", text: "Cada registro pertence a uma organização; um identificador de outra organização responde “não encontrado”. Verificado por testes automatizados a cada alteração, nas rotas que tocam dados da organização." },
        { lead: "Sessão.", text: "Cookies httpOnly com SameSite; token de acesso de 15 minutos; renovação rotativa com detecção de reuso; verificação de origem em operações de escrita; limites de taxa." },
        { lead: "Senhas.", text: "Armazenadas com Argon2id." },
        // 04-legal-review.md line 29 (REESCREVER) applied.
        { lead: "Trilha de auditoria.", text: "Criação, edição, mudanças de status, de responsável e de permissão, e acessos à Sala ficam registrados em uma trilha que a aplicação não permite editar, com redação de dados sensíveis." },
        { lead: "Cabeçalhos de segurança.", text: "CSP com nonce por requisição; HSTS em produção." },
        { lead: "Papéis explícitos.", text: "Proprietário, Administrador, Membro e Leitura, com autorização verificada no servidor." },
        { lead: "Residência de dados.", text: "Banco de dados hospedado em São Paulo (Brasil); aplicação executada na região de São Paulo." },
        // 04-legal-review.md line 33 (VETO) applied.
        { lead: "Dependências auditadas.", text: "Dependências do servidor auditadas a cada release (pip-audit), sem alertas abertos." },
      ],
    },
    {
      title: "Metodologia",
      items: [
        { lead: "Score explicável.", text: "Fatores, pesos, “O que mais reduz o score” e “Próximos passos” visíveis dentro do produto, com histórico." },
        { lead: "Riscos explicados.", text: "Probabilidade × impacto com severidade derivada; “não sei” tratado como incerteza, não como “não”." },
        // 04-legal-review.md line 34 (REESCREVER) applied.
        { lead: "Conteúdo versionado, em revisão.", text: "O Diagnóstico é versionado (42 perguntas, 7 áreas), construído a partir de fontes primárias e está em revisão legal humana. Até essa revisão terminar, o produto não cita base legal." },
        { lead: "Controle só é Verificado com prova.", text: "Um controle chega a Verificado apenas com evidência ligada a ele." },
      ],
    },
    {
      title: "Estágio",
      items: [
        // [PENDENTE D11] sentence included: true today (relay not activated).
        { lead: "Beta, declarado.", text: "Upload de arquivos ainda não está disponível (evidências por nota, link e documento funcionam). Convites de equipe e recuperação de senha por e-mail estão em ativação." },
        { lead: "Limites, declarados.", text: "Não é certificação, não é auditoria, não é parecer jurídico. Não substitui advogados, DPOs ou consultores." },
      ],
    },
  ],
} as const;

export const PLANS = {
  id: "planos",
  eyebrow: "Plans",
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
    cta: { label: "Começar gratuitamente", href: "/criar-conta" },
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

export const FAQ = {
  id: "faq",
  eyebrow: "FAQ",
  title: "Perguntas frequentes",
  lead: "Respostas curtas, sem promessa de conformidade.",
  /** Sentence appended to answer 7 once the privacy policy is published (`site.legalReady`). */
  privacyLink: { prefix: "Os detalhes estão na", label: "Política de Privacidade", href: "/privacidade" },
  items: [
    {
      q: "O Compliance OS substitui advogado, DPO ou consultoria?",
      // 04-legal-review.md line 41 (REESCREVER) applied.
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
      a: "São 42 perguntas em 7 áreas. O modo curto tem 12 perguntas e gera um primeiro Score na mesma sessão. Respostas “não”, “parcial” ou “não sei” viram riscos com probabilidade e impacto explicados. Você pode pausar, retomar, revisar respostas e seguir para o diagnóstico completo.",
    },
    {
      q: "O que é o Score de Compliance? Ele diz se minha empresa está “adequada”?",
      a: "Não diz. É um indicador de maturidade operacional de 0 a 100, calculado a partir do que a organização registrou, com cinco fatores e pesos visíveis, “O que mais reduz o score” e “Próximos passos”. Não é certificação, auditoria nem atestado de conformidade.",
    },
    {
      q: "Quanto custa? Posso começar gratuitamente?",
      // 08-plans.md §6, Kiwify version (checkouts live 2026-09-26).
      a: "Sim: o primeiro mês é grátis em qualquer plano, sem cartão, e nele você usa tudo do Ultimate. Depois, os planos são Standard (R$ 39), Plus (R$ 59) e Ultimate (R$ 89) por mês, por organização; a diferença está no número de usuários, na Sala de compliance e no Resumo executivo. Para assinar, use o botão do plano: o pagamento é processado pela Kiwify. No beta, o upload de arquivos e os convites de equipe por e-mail ainda estão desligados; evidências por nota, link e documento funcionam.",
    },
    {
      q: "Como funciona a assinatura e o cancelamento?",
      // Coherent with Termos §6–§7 (recurring payment via Kiwify; cancellation stops future charges).
      a: "Os planos são assinaturas mensais, por organização, pagas pela Kiwify e renovadas automaticamente a cada mês. A cobrança começa na data do pagamento: para usar o mês grátis antes, crie a conta primeiro e assine depois. Na compra, use o mesmo e-mail da sua conta — é por ele que identificamos a assinatura da sua organização. Uma segunda organização é uma segunda assinatura. Para cancelar, use os procedimentos da Kiwify ou fale com a gente pelo e-mail de contato: o cancelamento interrompe as cobranças seguintes e não apaga seus registros.",
    },
    {
      q: "Como meus dados são protegidos? Onde ficam?",
      // 04-legal-review.md line 47 (REESCREVER) applied; the privacy-notice sentence is conditional.
      a: "Cada organização é isolada das demais; a sessão usa cookies httpOnly; senhas são armazenadas com Argon2id; toda mudança relevante fica registrada em uma trilha de auditoria que a aplicação não permite editar. O banco de dados é hospedado em São Paulo (Brasil).",
      privacyLink: true,
    },
    {
      q: "O que é a Sala de compliance?",
      a: "Um espaço compartilhável por link, com prazo e revogação. O responsável pela organização escolhe quais documentos e controles liberar; quem recebe o link vê, sem criar conta, o que foi liberado e o Score, se ativado. Cada acesso fica registrado. A Sala mostra o que a empresa organizou — não é certificação nem atestado.",
    },
    {
      q: "É só para LGPD?",
      // 04-legal-review.md line 49 (REESCREVER) applied.
      a: "O Diagnóstico atual cobre proteção de dados pessoais — o campo da LGPD — a partir da sua operação, sem se propor a verificar conformidade com a lei. O modelo risco → controle → ação → evidência não é específico de uma lei: riscos, controles e documentos podem ser criados em qualquer tema. Novos diagnósticos podem ser adicionados, sempre versionados.",
    },
    {
      q: "Minha equipe pode usar junto?",
      // [PENDENTE D11]: the copy leaves the sentence open; the approved D11 sentence from FAQ 6 is reused verbatim.
      a: "Sim. Há quatro papéis — Proprietário, Administrador, Membro e Leitura —, responsáveis por risco, ação, controle e documento, e um Histórico de quem mudou o quê. O número de usuários depende do plano: 2 no Standard, 5 no Plus, 15 no Ultimate. Convites de equipe e recuperação de senha por e-mail estão em ativação.",
    },
  ],
} as const;

export const FINAL = {
  id: "comecar",
  eyebrow: "The operation",
  results: ["Mais clareza sobre seus riscos.", "Mais controle sobre sua operação.", "Mais confiança para provar sua maturidade."],
  title: ["Conheça seus riscos.", "Controle seu negócio."] as const,
  cta: { label: "Começar gratuitamente", href: "/criar-conta" },
  microcopy: ["Primeiro mês grátis", "Sem cartão de crédito", "Score explicado na primeira sessão"],
  loginPrompt: "Já tem conta?",
  login: { label: "Entrar", href: "/entrar" },
} as const;

export const FOOTER = {
  statement: "O Compliance OS é uma plataforma de gestão e operação de compliance. Não emite parecer, não certifica e não substitui advogados, DPOs, consultores nem revisão jurídica.",
  columns: {
    product: "Produto",
    account: "Conta",
    legal: "Legal",
    contact: "Contato",
  },
  account: [
    { label: "Entrar", href: "/entrar" },
    { label: "Criar conta", href: "/criar-conta" },
  ],
  legal: [
    { label: "Termos de Uso", href: "/termos" },
    { label: "Política de Privacidade", href: "/privacidade" },
  ],
  contactLabel: "Fale com a gente",
  linkedin: "LinkedIn",
  instagram: "Instagram",
} as const;

export const SEO = {
  title: "Compliance OS — Plataforma de operações de compliance",
  description: "Plataforma de operações de compliance: identifique riscos, organize controles, transforme lacunas em ações e prove sua maturidade. Primeiro mês grátis.",
  ogTitle: "Know your risk. Control your business. — Compliance OS",
  ogDescription: "Compliance corporativo sem precisar de um departamento de compliance. Riscos, controles, ações e evidências em um único sistema. Primeiro mês grátis.",
  /** Describes `app/opengraph-image.png` (a brand card, not a screenshot); keep identical to `opengraph-image.alt.txt`. */
  ogImageAlt: "Compliance OS — Know your risk. Control your business. Compliance corporativo sem precisar de um departamento de compliance. Símbolo da marca sobre fundo Obsidian; assinatura “The Control Layer”.",
  softwareDescription:
    "Plataforma de operações de compliance para empresas: diagnóstico, riscos, controles, ações, evidências, documentos, Score de Compliance explicável e Sala de compliance para demonstrar maturidade a clientes e parceiros. Compliance empresarial sem precisar de um departamento de compliance.",
  featureList: [
    "Diagnóstico de proteção de dados (42 perguntas em 7 áreas; modo curto de 12)",
    "Riscos com probabilidade, impacto e severidade explicados",
    "Controles com maturidade e evidência ligada",
    "Ações com responsável, prazo, esforço e estado",
    "Evidências e documentos com validade e status",
    "Score de Compliance com fatores e pesos visíveis",
    "Sala de compliance com links de prazo limitado",
    "Histórico de alterações",
  ],
} as const;
