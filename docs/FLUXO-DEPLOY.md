# Fluxo de Deploy no Portainer

Diagrama visual do processo completo de deploy da aplicação Organograma no Portainer.

## Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSO DE DEPLOY                           │
└─────────────────────────────────────────────────────────────────┘

    [Código Local]
         │
         ▼
    ┌─────────────┐
    │ Gerar TARs  │ ◄─── scripts/gerar-tars.ps1
    └─────────────┘
         │
         ├─► backend-code.tar.gz
         └─► frontend-code.tar.gz
         │
         ▼
    ┌──────────────────┐
    │ Upload Portainer │
    └──────────────────┘
         │
         ├─► organograma-backend:latest
         └─► organograma-frontend:latest
         │
         ▼
    ┌─────────────────┐
    │  Deploy Stack   │ ◄─── deploy/portainer-stack.yml
    └─────────────────┘
         │
         ▼
    ┌──────────────────────────────────────────┐
    │          Docker Swarm Network            │
    │                                          │
    │  ┌──────────┐  ┌──────────┐            │
    │  │ Backend  │  │ Frontend │            │
    │  └──────────┘  └──────────┘            │
    │       │             │                   │
    │       ▼             ▼                   │
    │  ┌──────────┐  ┌──────────┐            │
    │  │ Postgres │  │PostgREST │            │
    │  └──────────┘  └──────────┘            │
    │                                          │
    └──────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────┐
    │  Inicializar    │ ◄─── SQL scripts
    │  Banco de Dados │
    └─────────────────┘
         │
         ▼
    ┌─────────────────┐
    │ Verificar & OK  │
    └─────────────────┘
```

## Detalhamento de Cada Etapa

### 1️⃣ Preparação do Código

```
Local Machine
├── organograma/
│   ├── backend/
│   │   ├── app/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── .env
│   └── frontend/
│       ├── src/
│       ├── Dockerfile
│       ├── nginx.conf
│       └── package.json
```

**Ação:** Garantir que o código está atualizado e testado.

### 2️⃣ Geração dos Arquivos TAR

```
┌──────────────────────────────────────────────┐
│  scripts/gerar-tars.ps1                      │
├──────────────────────────────────────────────┤
│                                              │
│  1. Verificar estrutura do projeto           │
│  2. Criar diretório deploy/tars/             │
│  3. Comprimir backend/ → backend-code.tar.gz │
│  4. Comprimir frontend/ → frontend-code.tar.gz│
│  5. Exibir tamanhos e localização            │
│                                              │
└──────────────────────────────────────────────┘
         │
         ▼
deploy/tars/
├── backend-code.tar.gz   (~10-50 MB)
└── frontend-code.tar.gz  (~50-150 MB)
```

**Comando:**
```powershell
.\scripts\gerar-tars.ps1
```

### 3️⃣ Upload e Build no Portainer

```
┌────────────────────────────────────────────┐
│           Portainer Web UI                 │
├────────────────────────────────────────────┤
│                                            │
│  Images > Build a new image                │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │ Nome: organograma-backend:latest   │   │
│  │ Upload: backend-code.tar.gz        │   │
│  │ [Build Image]                      │   │
│  └────────────────────────────────────┘   │
│           │                                │
│           ▼                                │
│  ┌────────────────────────────────────┐   │
│  │  Docker Build Process               │   │
│  │  - Reading Dockerfile               │   │
│  │  - Installing dependencies          │   │
│  │  - Creating image layers            │   │
│  └────────────────────────────────────┘   │
│           │                                │
│           ▼                                │
│  ✓ organograma-backend:latest criada      │
│                                            │
└────────────────────────────────────────────┘

         Repetir para frontend
                │
                ▼
  ✓ organograma-frontend:latest criada
```

### 4️⃣ Deploy da Stack

```
┌────────────────────────────────────────────┐
│        Portainer > Stacks                  │
├────────────────────────────────────────────┤
│                                            │
│  Add Stack                                 │
│  Name: organograma                         │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │ Web Editor                         │   │
│  │                                    │   │
│  │ services:                          │   │
│  │   postgres:                        │   │
│  │     image: postgres:15-alpine      │   │
│  │   backend:                         │   │
│  │     image: organograma-backend...  │   │
│  │   frontend:                        │   │
│  │     image: organograma-frontend... │   │
│  │   ...                              │   │
│  │                                    │   │
│  │ networks:                          │   │
│  │   app-net:                         │   │
│  │     driver: overlay                │   │
│  │     attachable: true               │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  [Deploy the stack]                        │
│                                            │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│       Docker Swarm Orchestration           │
├────────────────────────────────────────────┤
│                                            │
│  1. Criar rede overlay "app-net"           │
│  2. Criar volumes (postgres_data, minio_data)│
│  3. Iniciar serviço postgres               │
│  4. Iniciar serviço minio                  │
│  5. Iniciar serviço postgrest              │
│  6. Iniciar serviço backend                │
│  7. Iniciar serviço frontend               │
│                                            │
└────────────────────────────────────────────┘
```

### 5️⃣ Arquitetura em Execução

```
┌──────────────────────────────────────────────────────────┐
│                    app-net (overlay)                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐                                        │
│  │  Frontend   │  :80                                   │
│  │  (Nginx)    │  ───► Port 3000 (External)            │
│  └─────────────┘                                        │
│        │                                                 │
│        ├──────────┐                                     │
│        │          │                                     │
│        ▼          ▼                                     │
│  ┌─────────┐  ┌──────────┐                            │
│  │ Backend │  │PostgREST │                            │
│  │:8000    │  │:3000     │                            │
│  └─────────┘  └──────────┘                            │
│        │          │                                     │
│        └────┬─────┘                                     │
│             ▼                                           │
│       ┌──────────┐                                     │
│       │ Postgres │ :5432                               │
│       │          │                                     │
│       └──────────┘                                     │
│                                                         │
│  ┌─────────┐                                           │
│  │  MinIO  │ :9000/:9001 (opcional)                   │
│  └─────────┘                                           │
│                                                         │
└──────────────────────────────────────────────────────────┘
```

### 6️⃣ Inicialização do Banco de Dados

```
┌────────────────────────────────────────┐
│  Container: organograma_postgres       │
├────────────────────────────────────────┤
│                                        │
│  $ psql -U postgres -d organograma     │
│                                        │
│  organograma=# \i 01-schema.sql        │
│  ✓ Criando tabelas...                  │
│  ✓ user, posicao, app_auth, etc.       │
│                                        │
│  organograma=# \i 02-seed.sql          │
│  ✓ Inserindo dados iniciais...         │
│  ✓ Usuários, posições, etc.            │
│                                        │
│  organograma=# \i 99-grants.sql        │
│  ✓ Configurando permissões...          │
│  ✓ authenticator, anon, etc.           │
│                                        │
└────────────────────────────────────────┘
```

### 7️⃣ Verificação e Testes

```
┌─────────────────────────────────────────┐
│         Testes de Verificação           │
├─────────────────────────────────────────┤
│                                         │
│  1. Health Check                        │
│     curl http://IP:8000/health          │
│     ✓ {"status": "ok", "database": true}│
│                                         │
│  2. PostgREST                           │
│     curl http://IP:3001/                │
│     ✓ {swagger, ...}                    │
│                                         │
│  3. Frontend                            │
│     Browser: http://IP:3000             │
│     ✓ Página carrega                    │
│                                         │
│  4. Login                               │
│     POST /api/auth/login                │
│     ✓ Token gerado                      │
│                                         │
│  5. Dados                               │
│     GET /api/user                       │
│     ✓ Lista de usuários                 │
│                                         │
└─────────────────────────────────────────┘
```

## Fluxo de Atualização

```
┌─────────────────────────────────────────────────┐
│           Processo de Atualização               │
└─────────────────────────────────────────────────┘

[Código Modificado]
      │
      ▼
[Gerar Novos TARs]
      │
      ▼
[Rebuild Imagens no Portainer]
      │
      ├─► Mesmo nome: organograma-backend:latest
      └─► Sobrescreve imagem antiga
      │
      ▼
[Atualizar Stack]
      │
      ├─► Option 1: Update stack (mantém dados)
      └─► Option 2: Delete + Recreate (limpa tudo)
      │
      ▼
[Docker Swarm Atualiza Serviços]
      │
      ├─► Rolling update dos containers
      └─► Zero downtime (se configurado)
      │
      ▼
[Aplicação Atualizada]
```

## Fluxo de Rollback

```
┌─────────────────────────────────────────┐
│    Processo de Rollback (Emergência)    │
└─────────────────────────────────────────┘

[Problema Detectado]
      │
      ▼
[Backup de Imagens Antigas?]
      │
      ├─► SIM: Tag images antigas
      │         docker tag organograma-backend:latest \
      │                    organograma-backend:backup
      │
      └─► NÃO: Rebuild com código anterior
                │
                ▼
         [Gerar TARs do código anterior]
                │
                ▼
         [Rebuild imagens]
                │
                ▼
         [Update stack]
                │
                ▼
         [Verificar funcionamento]
```

## Fluxo de Dados

```
┌──────────────────────────────────────────────────┐
│            Fluxo de Requisição                   │
└──────────────────────────────────────────────────┘

  Browser (http://IP:3000)
      │
      ▼
  ┌───────────────┐
  │ Frontend      │
  │ (React/Next)  │
  └───────────────┘
      │
      ├─────────────────────┐
      │                     │
      ▼                     ▼
  ┌──────────┐        ┌──────────┐
  │ Backend  │        │PostgREST │
  │ (Auth)   │        │ (CRUD)   │
  └──────────┘        └──────────┘
      │                     │
      └──────────┬──────────┘
                 ▼
           ┌──────────┐
           │ Postgres │
           │   (DB)   │
           └──────────┘
```

## Monitoramento Contínuo

```
┌────────────────────────────────────────┐
│     Portainer Dashboard                │
├────────────────────────────────────────┤
│                                        │
│  Stack: organograma                    │
│  ├─ Status: Running                    │
│  ├─ Services: 5/5 healthy              │
│  └─ Logs: No errors                    │
│                                        │
│  Resources                             │
│  ├─ CPU: 15%                           │
│  ├─ Memory: 1.2GB / 4GB                │
│  └─ Disk: 2.5GB / 20GB                 │
│                                        │
│  Networks                              │
│  └─ app-net: 5 containers              │
│                                        │
│  Volumes                               │
│  ├─ postgres_data: 450MB               │
│  └─ minio_data: 120MB                  │
│                                        │
└────────────────────────────────────────┘
```

---

## Legenda de Símbolos

- `►` : Fluxo de processo
- `✓` : Sucesso / Completado
- `│` : Conexão / Dependência
- `├─` : Branch / Múltiplas opções
- `▼` : Próximo passo
- `┌─┐` : Container / Caixa de processo

---

**Última atualização:** 29/10/2026
