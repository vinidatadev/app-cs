# 02 - Arquitetura

## Diagrama

```text
Browser
  │
  ├── http://host:3000/            → Nginx → arquivos React
  ├── http://host:3000/api/*       → Nginx → FastAPI :8000
  │                                            │
  │                                            ▼
  │                                       MinIO :9000
  │                                    (fotos e anexos)
  └── http://host:3000/rest/v1/*   → Nginx → PostgREST :3000
                                             │
                                             ▼
                                      PostgreSQL :5432
```

## Componentes

### Frontend

React + Vite. O arquivo `src/supabase.js` foi substituído por um client local que mantém a mesma interface usada pelos componentes (`from`, `select`, `insert`, `update`, `delete`, `upsert`, `auth`, `storage`).

### Backend FastAPI

Responsável por:

- login (`/api/auth/login`)
- validação de sessão (`/api/auth/me`)
- upload e leitura de arquivos (`/api/storage/...`) usando o MinIO como backend
- criação automática de contas, buckets e envio das fotos migradas no startup

### MinIO

Storage S3 local. Guarda fotos de perfil, imagens de transações e anexos de notas/tarefas nos buckets `imagens`, `transacoes` e `task-attachments`. O browser acessa os arquivos pelo proxy do backend, mantendo tudo na mesma origem (`/api/storage/public/...`). O console administrativo fica em `:9101`.

Se a empresa já tiver um MinIO próprio, remova o serviço `minio` do compose e aponte o backend para ele usando `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY`.

### PostgREST

Transforma as tabelas do PostgreSQL em API REST. É o equivalente ao endpoint `/rest/v1` do Supabase. Exige JWT com a claim `role=organograma_api`.

### PostgreSQL

Fonte única de verdade dos dados relacionais. O schema é criado por `database/init/01-schema.sql` e os dados migrados por `02-seed.sql`. Arquivos binários não ficam no banco: ficam no MinIO.

## Fluxo de autenticação

1. Frontend envia login/senha para `/api/auth/login`.
2. Backend valida a senha com `crypt()` do PostgreSQL (`pgcrypto`).
3. Backend devolve JWT assinado com `SECRET_KEY`.
4. O JWT fica em `localStorage` (`organograma.session.v1`).
5. O cliente envia `Authorization: Bearer ...` para PostgREST e para uploads.
6. PostgREST valida o JWT e executa a query como `organograma_api`.

## Permissões da aplicação

O frontend continua calculando permissões com `nivel` e `user_permissoes`:

- `nivel = 2` → admin
- `setor = 'Customer Service'` → indicadores
- `user_permissoes` → organograma, transações, capacitação e links

A autorização de banco (RLS do Supabase) não foi recriada. O controle de acesso é feito pela aplicação; quem tiver um JWT válido consegue usar a API REST.
