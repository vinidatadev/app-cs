# Organograma Corporativo

Aplicação de organograma, células, capacitação, transações e indicadores rodando 100% em Docker local, sem dependência do Supabase.

## Arquitetura

```text
Navegador
   │
   ▼
Frontend React + Nginx (:3000)
   ├── /            → SPA React
   ├── /api/*       → Backend FastAPI (:8000)  → auth JWT + uploads
   │                          │
   │                          ▼
   │                     MinIO (:9000)  → fotos e anexos
   └── /rest/v1/*   → PostgREST (:3000)        → CRUD no PostgreSQL
                                      │
                                      ▼
                               PostgreSQL 15 (:5432)
```

| Serviço | Container | Porta no host | Função |
|---|---|---|---|
| frontend | `organograma-frontend` | 3000 | React servido pelo Nginx e proxy da API |
| backend | `organograma-backend` | 8000 | Login, JWT, upload/download de arquivos |
| minio | `organograma-minio` | 9100 / 9101 | Storage S3 local (arquivos e fotos) |
| postgrest | `organograma-postgrest` | 3001 | API REST sobre o PostgreSQL |
| postgres | `organograma-postgres` | 5432 | Banco de dados e volume persistente |

## Início rápido

```powershell
cd app-cs
docker compose up -d --build
```

Aguarde alguns segundos e acesse:

- Aplicação: http://localhost:3000
- API/Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/health
- PostgREST: http://localhost:3001
- MinIO Console: http://localhost:9101 (minioadmin / minioadmin123 por padrão)

Para usar um MinIO já existente no servidor, ajuste no `.env`: `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` e, se for HTTPS, `MINIO_SECURE=true`.

## Login

Conta administrativa criada no startup:

```text
E-mail: admin@empresa.com
Senha:  admin123
```

As 26 pessoas migradas do Supabase também receberam conta local:

```text
Login:  nome cadastrado (ex.: "Vinicius Nascimento") ou e-mail @organograma.local
Senha:  organograma123
```

> Troque `ADMIN_PASSWORD` no `.env` e as senhas padrão antes de usar em produção. Veja [docs/05-LOGIN-E-USUARIOS.md](docs/05-LOGIN-E-USUARIOS.md).

## O que foi migrado

- Estrutura completa do banco usada pelo frontend (usuários, organograma, células, cursos, transações e módulo de indicadores).
- 26 usuários, 23 vínculos do organograma, 3 células, 7 membros de células e 2 relações entre células.
- Fotos de perfil que estavam no Storage do Supabase foram migradas para o MinIO.
- Autenticação, Storage e REST agora rodam localmente com PostgreSQL + MinIO.

Detalhes e limitações: [docs/08-MIGRACAO-SUPABASE.md](docs/08-MIGRACAO-SUPABASE.md).

## Comandos úteis

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f postgrest
docker compose restart backend
docker compose down
docker compose down -v   # apaga banco e arquivos do MinIO (destrutivo)
```

Smoke test após subir a stack:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Acessar o banco:

```powershell
docker exec -it organograma-postgres psql -U postgres -d organograma
```

## Pacotes de deploy

```powershell
# projeto completo (compose + database + docs)
powershell -File scripts/build-deploy-tar.ps1

# imagens separadas de frontend e backend
powershell -File scripts/build-service-tars.ps1
```

Os arquivos são gerados em `deploy/`:

- `organograma-deploy.tar` / `.tar.gz`
- `organograma-backend.tar`
- `organograma-frontend.tar`

## Estrutura

```text
app-cs/
├── frontend/              React + Vite + Nginx
│   ├── src/apiClient.js    client local compatível com as chamadas existentes
│   └── nginx.conf         proxy /api e /rest/v1
├── backend/               FastAPI (auth + storage)
│   ├── app/
│   └── seed-assets/       fotos locais (não versionadas) para seed do MinIO
├── database/
│   ├── init/              schema, seed e grants executados pelo Postgres
│   └── legacy/            scripts Supabase antigos, mantidos para consulta
├── docs/                  documentação atual
└── _archive/              artefatos e documentação antigos
```

## Documentação

1. [00-LEIA-ME-PRIMEIRO.md](docs/00-LEIA-ME-PRIMEIRO.md)
2. [01-REQUISITOS.md](docs/01-REQUISITOS.md)
3. [02-ARQUITETURA.md](docs/02-ARQUITETURA.md)
4. [03-BANCO-DE-DADOS.md](docs/03-BANCO-DE-DADOS.md)
5. [04-API-LOCAL.md](docs/04-API-LOCAL.md)
6. [05-LOGIN-E-USUARIOS.md](docs/05-LOGIN-E-USUARIOS.md)
7. [06-DEPLOY-PORTAINER.md](docs/06-DEPLOY-PORTAINER.md)
8. [07-TROUBLESHOOTING.md](docs/07-TROUBLESHOOTING.md)
9. [08-MIGRACAO-SUPABASE.md](docs/08-MIGRACAO-SUPABASE.md)
10. [09-BACKUP-RESTORE.md](docs/09-BACKUP-RESTORE.md)
11. [10-MIGRACAO-DADOS-SUPABASE.md](docs/10-MIGRACAO-DADOS-SUPABASE.md)
12. [TUTORIAL-IMPLANTACAO.md](TUTORIAL-IMPLANTACAO.md)

## Tecnologias

- React 18, Vite 5, React Flow, Tiptap, Recharts
- FastAPI, psycopg2, JWT (python-jose)
- PostgreSQL 15, PostgREST 12
- MinIO (S3 local)
- Nginx, Docker Compose
