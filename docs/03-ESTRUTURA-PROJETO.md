# 📁 Estrutura Detalhada do Projeto

## Visão Geral

```
organograma/
│
├── frontend/                   # Aplicação React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── context/          # Context API (gerenciamento de estado)
│   │   ├── hooks/            # Custom hooks
│   │   ├── utils/            # Funções utilitárias
│   │   ├── App.jsx           # Componente principal
│   │   └── main.jsx          # Entry point
│   ├── public/               # Arquivos estáticos
│   ├── package.json          # Dependências Node
│   ├── vite.config.js        # Configuração Vite
│   ├── Dockerfile            # Build da imagem frontend
│   ├── nginx.conf            # Configuração servidor web
│   └── .env                  # Variáveis de ambiente
│
├── backend/                   # API Python/FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py       # Rotas de autenticação
│   │   │   ├── usuarios.py   # CRUD usuários
│   │   │   ├── posicoes.py   # CRUD posições
│   │   │   ├── atribuicoes.py # CRUD atribuições
│   │   │   └── indicadores.py # CRUD indicadores
│   │   ├── core/
│   │   │   ├── config.py     # Configurações gerais
│   │   │   ├── security.py   # JWT, hashing, etc
│   │   │   └── database.py   # Conexão Postgres
│   │   ├── models/           # Modelos SQLAlchemy
│   │   └── main.py           # Entry point FastAPI
│   ├── requirements.txt      # Dependências Python
│   ├── Dockerfile            # Build da imagem backend
│   └── .env                  # Variáveis de ambiente
│
├── database/                  # Scripts SQL
│   ├── init/
│   │   ├── 01-setup.sql      # Criação inicial
│   │   ├── 02-posicao.sql    # Tabela posições
│   │   ├── 03-atribuicoes.sql # Tabela atribuições
│   │   ├── 04-indicadores.sql # Tabela indicadores
│   │   └── 05-auth.sql       # Autenticação
│   └── migrations/           # Migrações futuras
│
├── docs/                      # Documentação (você está aqui!)
│   ├── 00-LEIA-ME-PRIMEIRO.md
│   ├── 01-REQUISITOS.md
│   ├── 02-CONFIGURACAO-AZURE.md
│   ├── 03-ESTRUTURA-PROJETO.md
│   ├── 04-BACKEND-API.md
│   ├── 05-BANCO-DE-DADOS.md
│   ├── 06-DEPLOY-PORTAINER.md
│   └── 07-TROUBLESHOOTING.md
│
├── docker-compose.yml         # Orquestração completa
└── README.md                  # Documentação principal

```

## Detalhamento por Camada

### 🎨 Frontend (React + Vite)

**Responsabilidade**: Interface do usuário

**Principais arquivos**:
- `src/components/UserNode.jsx` - Nó do organograma
- `src/components/Toolbar.jsx` - Barra de ferramentas
- `src/pages/` - Páginas da aplicação
- `src/context/` - Estados globais (usuário logado, etc)

**Build**:
- Vite compila tudo para HTML/CSS/JS estático
- Servido pelo Nginx
- Build final em `/dist`

**Comunicação**:
- Faz requisições HTTP para o backend
- Usa variável `VITE_BACKEND_URL` do .env

---

### ⚙️ Backend (Python + FastAPI)

**Responsabilidade**: Lógica de negócio, autenticação, API REST

**Principais arquivos**:
- `app/main.py` - Inicialização FastAPI
- `app/api/` - Endpoints REST
- `app/core/security.py` - JWT, validações
- `app/models/` - ORM (mapeamento objeto-relacional)

**Endpoints principais**:
- `/auth/login` - Login Microsoft
- `/api/usuarios` - CRUD usuários
- `/api/posicoes` - CRUD posições do organograma
- `/docs` - Documentação interativa (Swagger)

**Comunicação**:
- Recebe requisições HTTP do frontend
- Conecta ao Postgres
- Valida JWT tokens

---

### 🗄️ Database (PostgreSQL)

**Responsabilidade**: Armazenamento de dados

**Principais tabelas**:
- `usuarios` - Dados dos usuários
- `posicoes` - Posições do organograma
- `atribuicoes` - Responsabilidades
- `indicadores` - Métricas e KPIs
- `cursos` - Treinamentos

**Inicialização**:
- Scripts em `database/init/` executam automaticamente
- Ordem numérica: 01, 02, 03...
- RLS (Row Level Security) para controle de acesso

**Backup**:
- Volume Docker persistente
- Dados não são perdidos ao recriar container

---

## Fluxo de Dados

```
Usuário (Browser)
    ↓
Frontend (React/Nginx) - Porta 3000
    ↓ HTTP Request
Backend (FastAPI) - Porta 8000
    ↓ SQL Query
Database (Postgres) - Porta 5432
```

## Variáveis de Ambiente

### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_AZURE_CLIENT_ID=seu-client-id
VITE_AZURE_TENANT_ID=seu-tenant-id
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/organograma
SECRET_KEY=sua-chave-secreta-jwt
AZURE_CLIENT_ID=seu-client-id
AZURE_CLIENT_SECRET=seu-client-secret
AZURE_TENANT_ID=seu-tenant-id
```

## Portas Utilizadas

| Serviço   | Porta | Acesso          |
|-----------|-------|-----------------|
| Frontend  | 3000  | Externo         |
| Backend   | 8000  | Externo         |
| Postgres  | 5432  | Apenas interno  |

## Volumes Docker (Dados Persistentes)

- `postgres_data` - Dados do banco
- `backend_logs` - Logs da API
