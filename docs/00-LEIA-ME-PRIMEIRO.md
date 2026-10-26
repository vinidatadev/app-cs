# 📋 Organograma - Guia de Deploy Completo

## 📁 Estrutura do Projeto

```
organograma/
├── frontend/          # Aplicação React (Vue substituído por React)
├── backend/           # API Python/FastAPI
├── database/          # Scripts SQL do Postgres
├── docs/              # Documentação completa
└── docker-compose.yml # Orquestração de todos os serviços
```

## 🎯 O que mudou?

**ANTES (Vercel + Supabase):**
- Frontend hospedado na Vercel
- Banco de dados no Supabase (externo)
- Bloqueado por CORS e firewall corporativo

**AGORA (Servidor Local):**
- Frontend: React servido via Nginx
- Backend: API Python/FastAPI
- Banco: Postgres local
- Autenticação: Microsoft Azure AD (OAuth)
- Tudo rodando em containers Docker

## 📚 Ordem de Leitura da Documentação

1. **00-LEIA-ME-PRIMEIRO.md** (este arquivo)
2. **01-REQUISITOS.md** - O que você precisa ter instalado
3. **02-CONFIGURACAO-AZURE.md** - Como configurar login Microsoft (apenas leitura)
4. **03-ESTRUTURA-PROJETO.md** - Explicação detalhada de cada pasta
5. **04-BACKEND-API.md** - Endpoints da API Python
6. **05-BANCO-DE-DADOS.md** - Estrutura das tabelas
7. **06-DEPLOY-PORTAINER.md** - Como fazer deploy final
8. **07-TROUBLESHOOTING.md** - Resolução de problemas

## ⚡ Quick Start (para testar localmente)

```bash
# 1. Clonar/acessar o projeto
cd organograma

# 2. Subir todos os serviços
docker-compose up -d

# 3. Acessar
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Postgres: localhost:5432
```

## 🚀 Para Deploy no Portainer

Veja o arquivo **docs/06-DEPLOY-PORTAINER.md** com o passo a passo completo.

## ⚠️ Importante

- **Não delete** os arquivos `.env` - eles contêm configurações essenciais
- **Configure** as credenciais do Azure antes do deploy
- **Teste localmente** antes de subir no servidor da empresa
- **Backup** do banco é automático (volume Docker persistente)

## 🆘 Precisa de ajuda?

Veja o arquivo **docs/07-TROUBLESHOOTING.md**
