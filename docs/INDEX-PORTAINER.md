# Índice - Documentação de Deploy no Portainer

Guia completo e organizado de toda a documentação relacionada ao deploy da aplicação Organograma no Portainer.

---

## 📚 Documentos Disponíveis

### 🚀 Para Começar Rápido

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md) | Resumo de uma página com comandos essenciais | Quando você já sabe o processo e só precisa relembrar os comandos |
| [FLUXO-DEPLOY.md](FLUXO-DEPLOY.md) | Diagrama visual do processo completo | Para entender o fluxo geral antes de começar |

### 📖 Guias Completos

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) | Guia completo passo a passo com explicações detalhadas | Primeira vez fazendo deploy ou quando precisa de detalhes |
| [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md) | Checklist para verificar todas as etapas | Durante o deploy para não esquecer nenhum passo |

### ❓ Referência e Suporte

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| [FAQ-PORTAINER.md](FAQ-PORTAINER.md) | Perguntas frequentes com respostas detalhadas | Quando tiver dúvidas sobre conceitos ou processos |
| [../scripts/README.md](../scripts/README.md) | Documentação dos scripts auxiliares | Quando for usar os scripts de geração de TARs |

---

## 🎯 Guia de Uso Por Cenário

### Cenário 1: Primeiro Deploy

**Você nunca fez deploy da aplicação no Portainer**

1. Leia [FLUXO-DEPLOY.md](FLUXO-DEPLOY.md) para entender o processo geral
2. Siga [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) passo a passo
3. Use [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md) para verificar cada etapa
4. Consulte [FAQ-PORTAINER.md](FAQ-PORTAINER.md) se tiver dúvidas

### Cenário 2: Atualização da Aplicação

**Você já tem a aplicação rodando e quer atualizar o código**

1. Use [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md) seção "Atualização Rápida"
2. Gere novos TARs com os scripts em `../scripts/`
3. Rebuild as imagens no Portainer
4. Update a stack

### Cenário 3: Resolver Problemas

**A aplicação não está funcionando corretamente**

1. Consulte [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) seção "Solução de Problemas"
2. Verifique [FAQ-PORTAINER.md](FAQ-PORTAINER.md) para problemas conhecidos
3. Use [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md) para verificar o que pode estar faltando

### Cenário 4: Refresh da Memória

**Você já fez deploy antes mas não lembra dos comandos**

1. Use [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md) como referência rápida
2. Consulte [FAQ-PORTAINER.md](FAQ-PORTAINER.md) para dúvidas específicas

---

## 📂 Estrutura de Arquivos do Projeto

```
organograma/
│
├── docs/                           # 📖 Documentação
│   ├── INDEX-PORTAINER.md         # 📑 Este arquivo (índice)
│   ├── DEPLOY-PORTAINER.md        # 📘 Guia completo
│   ├── RESUMO-DEPLOY.md           # 📄 Resumo rápido
│   ├── FLUXO-DEPLOY.md            # 🔄 Diagramas visuais
│   ├── CHECKLIST-PORTAINER.md     # ✅ Checklist
│   └── FAQ-PORTAINER.md           # ❓ Perguntas frequentes
│
├── scripts/                        # 🔧 Scripts auxiliares
│   ├── gerar-tars.bat             # 🪟 Windows CMD
│   ├── gerar-tars.ps1             # 💠 PowerShell
│   └── README.md                  # 📝 Documentação dos scripts
│
├── deploy/                         # 🚀 Arquivos de deploy
│   ├── portainer-stack.yml        # 🐳 Stack do Docker Swarm
│   └── tars/                      # 📦 TARs gerados (criado pelos scripts)
│       ├── backend-code.tar.gz
│       └── frontend-code.tar.gz
│
├── backend/                        # 🐍 Código do backend
│   ├── app/
│   │   └── api/
│   │       └── storage.py         # 🔧 Modificado (skip MinIO)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
│
├── frontend/                       # ⚛️ Código do frontend
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── database/                       # 🗄️ Scripts SQL
    └── init/
        ├── 01-schema.sql
        ├── 02-seed.sql
        └── 99-grants.sql
```

---

## 🔍 Busca Rápida de Tópicos

### Comandos
- Gerar TARs: [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md#comandos-rápidos)
- Testar serviços: [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md#testar-serviços)
- Backup: [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md#backup-rápido)

### Conceitos
- O que é Portainer: [FAQ-PORTAINER.md](FAQ-PORTAINER.md#o-que-é-portainer)
- O que é Stack: [FAQ-PORTAINER.md](FAQ-PORTAINER.md#o-que-é-uma-stack-no-portainer)
- Rede overlay: [FAQ-PORTAINER.md](FAQ-PORTAINER.md#o-que-é-uma-rede-overlay)

### Processos
- Upload de imagens: [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#upload-das-imagens-no-portainer)
- Deploy da stack: [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#deploy-da-stack)
- Inicializar banco: [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#configuração-do-banco-de-dados)

### Problemas
- Erro de rede: [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#problema-erro-de-rede-cannot-be-used-with-services)
- MinIO não conecta: [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#problema-backend-não-inicia---tentando-conectar-ao-minio)
- Imagem não encontrada: [FAQ-PORTAINER.md](FAQ-PORTAINER.md#imagem-não-encontrada)

---

## 📊 Visão Geral do Sistema

### Serviços na Stack

| Serviço | Porta | Função | Documentação |
|---------|-------|--------|--------------|
| Frontend | 3000 | Interface React/Next.js | [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#frontend-dockerfile) |
| Backend | 8000 | API FastAPI + Autenticação | [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#backend-dockerfile) |
| PostgREST | 3001 | API REST automática do PostgreSQL | [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md#portas-expostas) |
| Postgres | 5432 | Banco de dados | [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#configuração-do-banco-de-dados) |
| MinIO | 9100/9101 | Storage de arquivos (opcional) | [FAQ-PORTAINER.md](FAQ-PORTAINER.md#minio-e-storage) |

### Fluxo de Dados

```
Browser → Frontend → Backend → Postgres
                  ↘ PostgREST ↗
```

Veja diagrama completo em [FLUXO-DEPLOY.md](FLUXO-DEPLOY.md#arquitetura-em-execução)

---

## ✅ Checklist Rápido

Antes de começar, verifique:

- [ ] Portainer instalado e acessível
- [ ] Docker Swarm ativado
- [ ] Código fonte disponível localmente
- [ ] Ferramenta `tar` disponível

Durante o deploy:

- [ ] TARs gerados com sucesso
- [ ] Imagens construídas no Portainer
- [ ] Stack criada e todos serviços running
- [ ] Banco de dados inicializado
- [ ] Testes funcionais passando

Detalhes em [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md)

---

## 🆘 Onde Buscar Ajuda

### Por Tipo de Problema

| Tipo | Onde Procurar |
|------|---------------|
| Comando não funciona | [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md) |
| Conceito não entendi | [FAQ-PORTAINER.md](FAQ-PORTAINER.md) |
| Erro durante deploy | [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) seção Solução de Problemas |
| Não sei qual passo fazer | [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md) |
| Quero entender o fluxo | [FLUXO-DEPLOY.md](FLUXO-DEPLOY.md) |

### Por Nível de Experiência

| Nível | Recomendação |
|-------|--------------|
| Iniciante | Comece pelo [FLUXO-DEPLOY.md](FLUXO-DEPLOY.md), depois [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) |
| Intermediário | Use [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) + [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md) |
| Avançado | [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md) como referência rápida |

---

## 🔄 Ciclo de Vida da Aplicação

```
1. Desenvolvimento Local
   ↓
2. Gerar TARs (scripts/)
   ↓
3. Upload no Portainer
   ↓
4. Deploy Stack
   ↓
5. Monitoramento
   ↓
6. Atualização (volta ao passo 2)
```

Cada etapa documentada em [FLUXO-DEPLOY.md](FLUXO-DEPLOY.md)

---

## 📝 Histórico de Mudanças

### Modificações Importantes no Código

| Arquivo | Mudança | Motivo | Documentação |
|---------|---------|--------|--------------|
| `backend/app/api/storage.py` | Skip MinIO quando `SEED_ASSETS_ON_START=false` | Evitar erro de conexão no startup | [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#modificações-importantes-realizadas) |
| `deploy/portainer-stack.yml` | Rede de bridge para overlay | Compatibilidade com Docker Swarm | [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#deploy-da-stack) |
| `backend/.env` | Adicionadas variáveis MinIO e admin | Configuração completa | [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md#variáveis-de-ambiente-importantes) |

---

## 🎓 Recursos de Aprendizado

### Para Entender Docker Swarm
- Documentação oficial: https://docs.docker.com/engine/swarm/
- [FAQ-PORTAINER.md](FAQ-PORTAINER.md#por-que-usar-docker-swarm)

### Para Entender Portainer
- Documentação oficial: https://docs.portainer.io/
- [FAQ-PORTAINER.md](FAQ-PORTAINER.md#o-que-é-portainer)

### Para Entender o Projeto
- [../COMECE-AQUI.md](../COMECE-AQUI.md) - Visão geral do projeto
- [02-ARQUITETURA.md](02-ARQUITETURA.md) - Arquitetura da aplicação

---

## 📞 Suporte

### Auto-Ajuda
1. Consulte o [FAQ-PORTAINER.md](FAQ-PORTAINER.md)
2. Verifique logs no Portainer
3. Revise o [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md)

### Documentação Relacionada
- Arquitetura geral: [02-ARQUITETURA.md](02-ARQUITETURA.md)
- Banco de dados: [03-BANCO-DE-DADOS.md](03-BANCO-DE-DADOS.md)
- API: [04-API-LOCAL.md](04-API-LOCAL.md)
- Troubleshooting geral: [07-TROUBLESHOOTING.md](07-TROUBLESHOOTING.md)

---

## 🗺️ Mapa Mental

```
Deploy Portainer
├── Preparação
│   ├── Gerar TARs (scripts/)
│   └── Verificar código
│
├── Portainer UI
│   ├── Upload (Images)
│   ├── Build (Images)
│   └── Deploy (Stacks)
│
├── Configuração
│   ├── Banco de dados (SQL scripts)
│   ├── Rede (overlay)
│   └── Variáveis de ambiente
│
├── Verificação
│   ├── Health checks
│   ├── Logs
│   └── Testes funcionais
│
└── Manutenção
    ├── Monitoramento
    ├── Backup
    └── Atualizações
```

---

## 🏁 Começar Agora

**Primeira vez?**
1. [FLUXO-DEPLOY.md](FLUXO-DEPLOY.md) ← Comece aqui
2. [DEPLOY-PORTAINER.md](DEPLOY-PORTAINER.md) ← Siga este
3. [CHECKLIST-PORTAINER.md](CHECKLIST-PORTAINER.md) ← Marque aqui

**Já conhece?**
1. [RESUMO-DEPLOY.md](RESUMO-DEPLOY.md) ← Use este

**Tem dúvida?**
1. [FAQ-PORTAINER.md](FAQ-PORTAINER.md) ← Procure aqui

---

**Última atualização:** 29/10/2026

**Versão da documentação:** 1.0
