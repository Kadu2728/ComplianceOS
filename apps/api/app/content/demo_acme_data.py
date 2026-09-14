"""Demo dataset for "Acme Tecnologia Ltda." (CLAUDE.md §23).

Pure data; `demo_acme.build` turns it into records through the regular services, so every number
the product shows (score, counts, activity) is derived from these records exactly as it would be
for a real customer. The story: a 60-person B2B software company four months into its privacy
programme — diagnostic done, the quick wins closed with proof, three critical risks still being
worked on, a few deadlines missed. Dates are relative to the seed day so the demo never rots.

E-mail addresses use the reserved `.example` TLD (RFC 2606): they can never receive mail.
"""

from typing import Any

ORGANIZATION_NAME = "Acme Tecnologia Ltda."
OWNER_EMAIL = "ana@acme.example"

# key → (name, e-mail, role, area). The owner logs in; the others exist to own work and to make
# the activity feed look like a team (their passwords are random and never disclosed).
MEMBERS: dict[str, tuple[str, str, str, str]] = {
    "ana": ("Ana Souza", OWNER_EMAIL, "owner", "Diretora de operações"),
    "bruno": ("Bruno Lima", "bruno@acme.example", "admin", "Tecnologia"),
    "diego": ("Diego Santos", "diego@acme.example", "admin", "Jurídico · encarregado (DPO)"),
    "carla": ("Carla Mendes", "carla@acme.example", "member", "Pessoas e cultura"),
    "eduarda": ("Eduarda Rocha", "eduarda@acme.example", "viewer", "Diretoria"),
}

# Full diagnostic (42 questions). value → derived risk: nao = P3, parcial/nao_sei = P2, sim = none.
ANSWERS: dict[str, str] = {
    "DF-01": "sim",
    "DF-02": "parcial",
    "DF-03": "nao",
    "DF-04": "nao",
    "DF-05": "nao",
    "DF-06": "sim",
    "AA-01": "parcial",
    "AA-02": "sim",
    "AA-03": "nao",
    "AA-04": "parcial",
    "AA-05": "parcial",
    "AA-06": "sim",
    "SE-01": "parcial",
    "SE-02": "parcial",
    "SE-03": "nao",
    "SE-04": "sim",
    "SE-05": "nao_sei",
    "SE-06": "sim",
    "FT-01": "sim",
    "FT-02": "nao",
    "FT-03": "parcial",
    "FT-04": "nao",
    "FT-05": "nao_sei",
    "FT-06": "nao",
    "PR-01": "parcial",
    "PR-02": "nao",
    "PR-03": "parcial",
    "PR-04": "sim",
    "PR-05": "sim",
    "PR-06": "sim",
    "TI-01": "sim",
    "TI-02": "parcial",
    "TI-03": "sim",
    "TI-04": "nao",
    "TI-05": "nao",
    "TI-06": "sim",
    "PE-01": "sim",
    "PE-02": "parcial",
    "PE-03": "sim",
    "PE-04": "nao",
    "PE-05": "sim",
    "PE-06": "parcial",
}

# What happened to each derived risk since the diagnostic: owner, target status, treatment.
# Statuses: aberto · em_andamento · em_revisao · resolvido · aceito.
RISKS: dict[str, dict[str, Any]] = {
    "DF-02": {
        "owner": "diego",
        "status": "resolvido",
        "treatment": "Finalidade e base de cada operação registradas no ROPA v1.3.",
        "evidence": [
            {
                "kind": "document",
                "doc": "registro-tratamento",
                "note": "ROPA com finalidade por operação",
            }
        ],
    },
    "DF-03": {
        "owner": "bruno",
        "status": "resolvido",
        "treatment": "Campos sem finalidade removidos do cadastro e do formulário de contato.",
    },
    "DF-04": {
        "owner": "carla",
        "status": "em_andamento",
        "treatment": "Atestados e dados de dependentes ficam em pasta compartilhada do RH; "
        "restringir acesso e definir prazo de guarda.",
    },
    "DF-05": {"owner": "diego", "status": "aberto"},
    "AA-01": {
        "owner": "bruno",
        "status": "em_andamento",
        "treatment": "Revisão sistema a sistema aplicando o mínimo necessário.",
    },
    "AA-03": {
        "owner": "bruno",
        "status": "em_andamento",
        "treatment": "MFA obrigatório no e-mail já ativo; CRM depende do fornecedor.",
    },
    "AA-04": {"owner": "bruno", "status": "aberto"},
    "AA-05": {
        "owner": "bruno",
        "status": "resolvido",
        "treatment": "Backup diário com teste de restauração documentado.",
        "evidence": [
            {
                "kind": "document",
                "doc": "teste-backup",
                "note": "Restauração completa em ambiente isolado",
            }
        ],
    },
    "SE-01": {
        "owner": "bruno",
        "status": "resolvido",
        "treatment": "TLS em todos os endpoints; criptografia em repouso nos bancos.",
        "evidence": [
            {
                "kind": "link",
                "url": "https://intranet.acme.example/infra/INFRA-231",
                "note": "Ticket INFRA-231 com as configurações aplicadas",
            }
        ],
    },
    "SE-02": {"owner": "bruno", "status": "em_andamento"},
    "SE-03": {
        "owner": "bruno",
        "status": "em_andamento",
        "treatment": "Criptografia de disco nos notebooks; celulares na etapa seguinte.",
    },
    "SE-05": {
        "owner": "bruno",
        "status": "em_revisao",
        "treatment": "Verificar com o fornecedor de hospedagem se há varredura periódica.",
    },
    "FT-02": {
        "owner": "diego",
        "status": "em_andamento",
        "treatment": "Aditivo padrão de proteção de dados para fornecedores críticos.",
    },
    "FT-03": {
        "owner": "diego",
        "status": "resolvido",
        "treatment": "Regiões de armazenamento mapeadas; transferências documentadas no ROPA.",
        "evidence": [
            {
                "kind": "note",
                "note": "Nuvem: São Paulo; e-mail marketing e suporte: EUA. "
                "Cláusulas-padrão em análise pelo jurídico.",
            }
        ],
    },
    "FT-04": {"owner": "diego", "status": "aberto"},
    "FT-05": {"owner": "diego", "status": "aberto"},
    "FT-06": {
        "owner": "diego",
        "status": "aceito",
        "treatment": "Aceito até a renovação contratual (2027): os fornecedores críticos já "
        "declararam subcontratados; os demais não tratam dados relevantes.",
    },
    "PR-01": {
        "owner": "diego",
        "status": "resolvido",
        "treatment": "Política de privacidade v2.0 publicada no site e no app.",
        "evidence": [
            {"kind": "document", "doc": "politica-privacidade", "note": "Versão publicada em vigor"}
        ],
    },
    "PR-02": {
        "owner": "diego",
        "status": "em_andamento",
        "treatment": "Política interna curta (4 páginas) em revisão final.",
    },
    "PR-03": {"owner": "diego", "status": "aberto"},
    "TI-02": {"owner": "diego", "status": "aberto"},
    "TI-04": {
        "owner": "bruno",
        "status": "em_andamento",
        "treatment": "Plano de uma página com contatos, papéis e prazo de comunicação.",
    },
    "TI-05": {"owner": "carla", "status": "aberto"},
    "PE-02": {
        "owner": "carla",
        "status": "resolvido",
        "treatment": "Orientação de 30 minutos para todos os times; presença registrada.",
        "evidence": [
            {
                "kind": "document",
                "doc": "lista-presenca",
                "note": "52 de 58 colaboradores presentes",
            }
        ],
    },
    "PE-04": {"owner": "carla", "status": "aberto"},
    "PE-06": {
        "owner": "ana",
        "status": "em_andamento",
        "treatment": "Planilhas dispersas migradas para o Compliance OS.",
    },
}

# Risks that did not come from the diagnostic (things that happened).
MANUAL_RISKS: list[dict[str, Any]] = [
    {
        "key": "planilha-publica",
        "title": "Planilha de clientes compartilhada por link público",
        "description": "Planilha com nome, e-mail e telefone de 1.200 clientes ficou acessível a "
        "qualquer pessoa com o link entre março e abril.",
        "category": "dados",
        "probability": 2,
        "impact": 4,
        "owner": "bruno",
        "status": "resolvido",
        "treatment": "Link revogado; compartilhamento restrito ao time comercial; alerta de "
        "compartilhamento externo ativado.",
        "evidence": [
            {
                "kind": "note",
                "note": "Registro de acessos exportado: nenhum acesso externo "
                "no período. Ocorrência registrada no registro de "
                "incidentes.",
            }
        ],
    },
    {
        "key": "notebook-extraviado",
        "title": "Notebook sem criptografia extraviado em viagem",
        "description": "Notebook do time comercial extraviado em aeroporto; disco sem "
        "criptografia, sessão do e-mail aberta.",
        "category": "incidentes",
        "probability": 2,
        "impact": 4,
        "owner": "bruno",
        "status": "resolvido",
        "treatment": "Bloqueio remoto e troca de senhas executados no mesmo dia; origem do "
        "risco de dispositivos sem proteção básica.",
        "evidence": [
            {
                "kind": "link",
                "url": "https://intranet.acme.example/incidentes/2026-04",
                "note": "Relatório do incidente com linha do tempo e boletim de ocorrência",
            }
        ],
    },
]

# Actions. `due` is days from the seed day (negative = overdue). Statuses: a_fazer · em_andamento
# · em_revisao · concluida · bloqueada. `risk` is a question code or a manual risk key.
ACTIONS: list[dict[str, Any]] = [
    {
        "risk": "DF-02",
        "title": "Registrar finalidade e justificativa por operação no inventário",
        "owner": "diego",
        "due": -70,
        "status": "concluida",
        "evidence": [{"kind": "document", "doc": "registro-tratamento"}],
    },
    {
        "risk": "DF-03",
        "title": "Revisar formulários e cadastros removendo campos sem finalidade",
        "owner": "bruno",
        "due": -55,
        "status": "concluida",
    },
    {
        "risk": "DF-04",
        "title": "Identificar dados sensíveis e de dependentes no inventário e definir controles",
        "owner": "carla",
        "due": 20,
        "status": "em_andamento",
    },
    {
        "risk": "DF-04",
        "title": "Restringir a pasta de atestados ao RH e definir prazo de guarda",
        "owner": "carla",
        "due": 35,
        "status": "a_fazer",
    },
    {
        "risk": "DF-05",
        "title": "Definir prazos de retenção por categoria de dado",
        "owner": "diego",
        "due": 45,
        "status": "a_fazer",
    },
    {
        "risk": "AA-01",
        "title": "Revisar acessos por sistema aplicando o mínimo necessário",
        "owner": "bruno",
        "due": 10,
        "status": "em_andamento",
        "evidence": [
            {"kind": "note", "note": "CRM e ERP revisados; faltam BI e drive compartilhado."}
        ],
    },
    {
        "risk": "AA-03",
        "title": "Ativar MFA no e-mail corporativo e nos sistemas com dados de clientes",
        "owner": "bruno",
        "due": -5,
        "status": "em_andamento",
        "evidence": [
            {
                "kind": "note",
                "note": "E-mail: 100% dos usuários com MFA. CRM: aguardando "
                "o fornecedor liberar o recurso no plano atual.",
            }
        ],
    },
    {
        "risk": "AA-04",
        "title": "Mapear locais de armazenamento e restringir cópias locais",
        "owner": "bruno",
        "due": 30,
        "status": "a_fazer",
    },
    {
        "risk": "AA-05",
        "title": "Configurar backup e executar um teste de restauração documentado",
        "owner": "bruno",
        "due": -40,
        "status": "concluida",
        "evidence": [{"kind": "document", "doc": "teste-backup"}],
    },
    {
        "risk": "SE-01",
        "title": "Ativar TLS em todos os endpoints e criptografia em repouso nos bancos",
        "owner": "bruno",
        "due": -80,
        "status": "concluida",
        "evidence": [
            {
                "kind": "link",
                "url": "https://intranet.acme.example/infra/INFRA-231",
                "note": "Configurações aplicadas e revisadas em par",
            }
        ],
    },
    {
        "risk": "SE-02",
        "title": "Definir rotina mensal de atualização e verificação de dependências",
        "owner": "bruno",
        "due": 7,
        "status": "em_revisao",
    },
    {
        "risk": "SE-03",
        "title": "Inventariar notebooks e celulares corporativos",
        "owner": "bruno",
        "due": -30,
        "status": "concluida",
        "evidence": [
            {
                "kind": "note",
                "note": "41 notebooks e 12 celulares inventariados com "
                "responsável e status de criptografia.",
            }
        ],
    },
    {
        "risk": "SE-03",
        "title": "Ativar criptografia de disco e bloqueio automático nos dispositivos",
        "owner": "bruno",
        "due": 15,
        "status": "em_andamento",
    },
    {
        "risk": "SE-05",
        "title": "Executar uma verificação de vulnerabilidades nos sistemas expostos",
        "description": "Bloqueada: aguardando orçamento de duas empresas de segurança.",
        "owner": "bruno",
        "due": 25,
        "status": "bloqueada",
    },
    {
        "risk": "FT-02",
        "title": "Revisar contratos dos fornecedores críticos incluindo cláusulas "
        "de proteção de dados",
        "owner": "diego",
        "due": -12,
        "status": "em_andamento",
        "evidence": [
            {
                "kind": "document",
                "doc": "contrato-aws",
                "note": "Nuvem e e-mail marketing concluídos; contabilidade e CRM pendentes.",
            }
        ],
    },
    {
        "risk": "FT-03",
        "title": "Identificar país/região de armazenamento de cada fornecedor",
        "owner": "diego",
        "due": -60,
        "status": "concluida",
        "evidence": [
            {
                "kind": "note",
                "note": "Planilha de fornecedores com país e base contratual por transferência.",
            }
        ],
    },
    {
        "risk": "FT-04",
        "title": "Criar checklist mínimo de avaliação para novos fornecedores",
        "owner": "diego",
        "due": 40,
        "status": "a_fazer",
    },
    {
        "risk": "PR-01",
        "title": "Publicar ou atualizar a política de privacidade",
        "owner": "diego",
        "due": -65,
        "status": "concluida",
        "evidence": [{"kind": "document", "doc": "politica-privacidade"}],
    },
    {
        "risk": "PR-02",
        "title": "Redigir uma política interna curta e divulgá-la",
        "owner": "diego",
        "due": 5,
        "status": "em_revisao",
    },
    {
        "risk": "PR-03",
        "title": "Atribuir responsável e data de revisão a cada documento",
        "owner": "diego",
        "due": 14,
        "status": "em_andamento",
    },
    {
        "risk": "TI-02",
        "title": "Testar o atendimento de um pedido de acesso e exclusão de ponta a ponta",
        "owner": "diego",
        "due": 21,
        "status": "a_fazer",
    },
    {
        "risk": "TI-04",
        "title": "Definir contatos de emergência e cadeia de acionamento",
        "owner": "bruno",
        "due": -20,
        "status": "concluida",
        "evidence": [
            {
                "kind": "note",
                "note": "Lista com 6 contatos (TI, jurídico, diretoria, "
                "hospedagem) publicada na intranet.",
            }
        ],
    },
    {
        "risk": "TI-04",
        "title": "Redigir um plano de resposta a incidentes de uma página com contatos",
        "owner": "bruno",
        "due": 9,
        "status": "em_andamento",
    },
    {
        "risk": "PE-02",
        "title": "Realizar uma orientação de 30 minutos e registrar presença",
        "owner": "carla",
        "due": -45,
        "status": "concluida",
        "evidence": [{"kind": "document", "doc": "lista-presenca"}],
    },
    {
        "risk": "PE-04",
        "title": "Incluir orientação de privacidade no onboarding",
        "owner": "carla",
        "due": -3,
        "status": "a_fazer",
    },
    {
        "risk": "PE-06",
        "title": "Centralizar riscos, ações e evidências em um único lugar",
        "owner": "ana",
        "due": 30,
        "status": "em_andamento",
        "evidence": [
            {
                "kind": "note",
                "note": "Planilhas de riscos e de fornecedores migradas; "
                "falta o controle de treinamentos.",
            }
        ],
    },
    {
        "risk": "planilha-publica",
        "title": "Remover o link público e restringir a planilha ao time comercial",
        "owner": "bruno",
        "due": -95,
        "status": "concluida",
        "evidence": [{"kind": "note", "note": "Compartilhamento externo desativado no domínio."}],
    },
    {
        "risk": "notebook-extraviado",
        "title": "Executar bloqueio remoto, trocar senhas e registrar a ocorrência",
        "owner": "bruno",
        "due": -110,
        "status": "concluida",
        "evidence": [
            {
                "kind": "link",
                "url": "https://intranet.acme.example/incidentes/2026-04",
                "note": "Linha do tempo do incidente",
            }
        ],
    },
]

# Documents. `valid` is days from the seed day (None = no validity). `file` attaches a small
# generated PDF so download and "current file" states can be demonstrated.
DOCUMENTS: dict[str, dict[str, Any]] = {
    "politica-privacidade": {
        "name": "Política de Privacidade (site e app)",
        "category": "politica",
        "version": "2.0",
        "state": "vigente",
        "owner": "diego",
        "valid": 300,
        "tags": ["lgpd", "site", "titulares"],
        "url": "https://acme.example/privacidade",
        "file": True,
        "description": "Versão pública, revisada com o jurídico; publicada no site e no app.",
    },
    "politica-interna": {
        "name": "Política Interna de Segurança e Privacidade",
        "category": "politica",
        "version": "0.9",
        "state": "em_revisao",
        "owner": "diego",
        "valid": None,
        "tags": ["interna", "seguranca"],
        "description": "Quatro páginas: regras de uso de dados, dispositivos, senhas e incidentes.",
    },
    "politica-retencao": {
        "name": "Política de Retenção e Descarte de Dados",
        "category": "politica",
        "version": "1.0",
        "state": "faltante",
        "owner": "diego",
        "valid": None,
        "tags": ["retencao"],
        "description": "Prevista para o próximo ciclo; prazos por categoria.",
    },
    "registro-tratamento": {
        "name": "Registro das Operações de Tratamento (ROPA)",
        "category": "registro",
        "version": "1.3",
        "state": "vigente",
        "owner": "diego",
        "valid": 170,
        "tags": ["lgpd", "inventario"],
        "file": True,
    },
    "inventario-dados": {
        "name": "Inventário de Dados Pessoais por Processo",
        "category": "registro",
        "version": "2.1",
        "state": "vigente",
        "owner": "ana",
        "valid": 170,
        "tags": ["inventario"],
        "url": "https://intranet.acme.example/privacidade/inventario",
    },
    "plano-incidentes": {
        "name": "Plano de Resposta a Incidentes",
        "category": "procedimento",
        "version": "1.0",
        "state": "faltante",
        "owner": "bruno",
        "valid": None,
        "tags": ["incidentes", "seguranca"],
        "description": "Uma página: papéis, contatos, prazos de comunicação e registro.",
    },
    "proc-titulares": {
        "name": "Procedimento de Atendimento a Titulares",
        "category": "procedimento",
        "version": "1.1",
        "state": "vigente",
        "owner": "diego",
        "valid": 200,
        "tags": ["titulares"],
        "file": True,
    },
    "checklist-desligamento": {
        "name": "Checklist de Desligamento e Revogação de Acessos",
        "category": "procedimento",
        "version": "1.0",
        "state": "vigente",
        "owner": "carla",
        "valid": 120,
        "tags": ["rh", "acesso"],
    },
    "contrato-aws": {
        "name": "Contrato e adendo de tratamento de dados — provedor de nuvem",
        "category": "contrato",
        "version": "2025",
        "state": "vigente",
        "owner": "diego",
        "valid": 400,
        "tags": ["fornecedores", "nuvem"],
    },
    "contrato-email": {
        "name": "Contrato — plataforma de e-mail marketing",
        "category": "contrato",
        "version": "2024/2",
        "state": "vigente",
        "owner": "diego",
        "valid": 12,
        "tags": ["fornecedores", "marketing"],
    },
    "contrato-contabilidade": {
        "name": "Contrato — contabilidade externa",
        "category": "contrato",
        "version": "2023",
        "state": "vigente",
        "owner": "diego",
        "valid": -20,
        "tags": ["fornecedores", "financeiro"],
        "description": "Renovação pendente; incluir cláusulas de proteção de dados.",
    },
    "termo-confidencialidade": {
        "name": "Termo de Confidencialidade (modelo para colaboradores e prestadores)",
        "category": "contrato",
        "version": "1.2",
        "state": "vigente",
        "owner": "carla",
        "valid": None,
        "tags": ["rh"],
    },
    "lista-presenca": {
        "name": "Lista de presença — orientação de proteção de dados (jun/2026)",
        "category": "treinamento",
        "version": "2026-06",
        "state": "vigente",
        "owner": "carla",
        "valid": None,
        "tags": ["treinamento"],
        "file": True,
    },
    "material-orientacao": {
        "name": "Material de orientação de privacidade para colaboradores",
        "category": "treinamento",
        "version": "1.0",
        "state": "vigente",
        "owner": "carla",
        "valid": 250,
        "tags": ["treinamento"],
    },
    "ata-revisao": {
        "name": "Ata da revisão anual de compliance com a liderança",
        "category": "registro",
        "version": "2026",
        "state": "vigente",
        "owner": "ana",
        "valid": None,
        "tags": ["governanca"],
    },
    "registro-titulares": {
        "name": "Registro de pedidos de titulares",
        "category": "registro",
        "version": "corrente",
        "state": "vigente",
        "owner": "diego",
        "valid": None,
        "tags": ["titulares"],
        "url": "https://intranet.acme.example/privacidade/pedidos",
    },
    "registro-incidentes": {
        "name": "Registro de incidentes de segurança",
        "category": "registro",
        "version": "corrente",
        "state": "vigente",
        "owner": "bruno",
        "valid": None,
        "tags": ["incidentes"],
        "url": "https://intranet.acme.example/incidentes",
    },
    "teste-backup": {
        "name": "Relatório do teste de restauração de backup (ago/2026)",
        "category": "registro",
        "version": "2026-08",
        "state": "vigente",
        "owner": "bruno",
        "valid": None,
        "tags": ["backup", "seguranca"],
        "file": True,
    },
}
