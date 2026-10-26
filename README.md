# 🏢 Sistema de Organograma Corporativo

Sistema completo de gestão de organograma com frontend React, backend Python/FastAPI e banco PostgreSQL.

## 📋 Início Rápido

### 1. Clone o projeto
```bash
git clone <seu-repositorio>
cd organograma
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 3. Suba os containers
```bash
docker-compose up -d
```

### 4. Acesse
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Postgres**: localhost:5432

## 📚 Documentação Completa

Toda a documentação está na pasta `docs/`:

1. **[00-LEIA-ME-PRIMEIRO.md](docs/00-LEIA-ME-PRIMEIRO.md)** - Visão geral
2. **[01-REQUISITOS.md](docs/01-REQUISITOS.md)** - Pré-requisitos
3. **[02-CONFIGURACAO-AZURE.md](docs/02-CONFIGURACAO-AZURE.md)** - Login Microsoft
4. **[03-ESTRUTURA-PROJETO.md](docs/03-ESTRUTURA-PROJETO.md)** - Arquitetura
5. **[04-BACKEND-API.md](docs/04-BACKEND-API.md)** - API REST
6. **[05-BANCO-DE-DADOS.md](docs/05-BANCO-DE-DADOS.md)** - Estrutura DB
7. **[06-DEPLOY-PORTAINER.md](docs/06-DEPLOY-PORTAINER.md)** - Deploy produção
8. **[07-TROUBLESHOOTING.md](docs/07-TROUBLESHOOTING.md)** - Resolução de problemas

## 🏗️ Estrutura do Projeto

```
organograma/
├── frontend/          # React + Vite + Nginx
├── backend/           # FastAPI + Python
├── database/          # Scripts SQL
└── docs/              # Documentação
```

## 🚀 Deploy no Portainer

Veja o guia completo em **[docs/06-DEPLOY-PORTAINER.md](docs/06-DEPLOY-PORTAINER.md)**

## 🔐 Login

### Com Microsoft (Azure AD)
Configure as credenciais no `.env` e use o botão "Login com Microsoft"

### Login básico (fallback)
- Usuário: `admin@empresa.com`
- Senha: `admin123`

## 🛠️ Desenvolvimento

### Frontend
```bash
cd frontend
npm install
npm run dev
# Acesse: http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Acesse: http://localhost:8000/docs
```

## 📦 Tecnologias

- **Frontend**: React, Vite, React Flow (organograma visual)
- **Backend**: FastAPI, SQLAlchemy, Python 3.11
- **Banco**: PostgreSQL 15
- **Auth**: Microsoft Azure AD (OAuth 2.0)
- **Deploy**: Docker, Docker Compose, Portainer

## 🆘 Suporte

- Problemas? Veja **[docs/07-TROUBLESHOOTING.md](docs/07-TROUBLESHOOTING.md)**
- Dúvidas sobre API? Acesse `/docs` no backend
- Bugs? Abra uma issue no repositório

## 📝 Licença

Propriedade da empresa. Uso interno apenas.

---

**Última atualização**: Outubro 2026
