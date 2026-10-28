# Tutorial de implantação

Este guia cobre: gerar o TAR, subir no servidor interno, configurar o MinIO existente, construir as imagens e iniciar os containers.

## 1. Como o sistema funciona

O frontend não fala mais com o Supabase. Todas as requisições passam pela API local:

```text
React
  ├── api.from(...)     → /rest/v1  → PostgREST → PostgreSQL
  ├── api.auth...       → /api/auth → FastAPI   → PostgreSQL
  └── api.storage...    → /api/storage → FastAPI → MinIO
```

## 2. Migrar os dados antigos (se necessário)

Para trazer tabelas protegidas por RLS (transações, permissões, cursos, indicadores etc.) e os arquivos do Storage:

1. No Supabase: **Project Settings → API → service_role**.
2. No seu computador, dentro de `app-cs`:

```powershell
$env:SUPABASE_URL="https://SEU-PROJETO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
node scripts/export-supabase-data.mjs
```

Isso gera:

- `database/init/03-supabase-data.sql` — dados para importar no Postgres.
- `backend/seed-assets/` — arquivos baixados do Storage do Supabase.
- `database/seed/supabase/` — JSONs para conferência.

> A `service_role` é secreta. Não commite, não compartilhe e apague as variáveis do terminal depois.

Se o banco local for novo, o SQL roda automaticamente no primeiro `docker compose up`.

Se o banco já existir no servidor, aplique manualmente:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-supabase-data.ps1
```

## 3. Gerar o TAR

No Windows, dentro de `app-cs`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-deploy-tar.ps1
```

Serão criados:

- `deploy/organograma-deploy.tar`
- `deploy/organograma-deploy.tar.gz`

O TAR contém `organograma/` com `frontend/`, `backend/`, `database/init/`, `docker-compose.yml`, scripts, docs e o `.env.example`. Ele inclui `backend/seed-assets/` para popular o MinIO, mas **não inclui** `.env` nem `node_modules`.

## 4. Enviar e extrair no servidor

Envie o TAR por SCP, WinSCP ou compartilhamento interno.

```bash
tar -xf organograma-deploy.tar
cd organograma
```

## 5. Configurar o `.env`

```bash
cp .env.example .env
vi .env
```

Exemplo usando **MinIO existente**:

```env
POSTGRES_PASSWORD=senha_forte
MINIO_ENDPOINT=IP_DO_MINIO:9000
MINIO_ACCESS_KEY=usuario_minio
MINIO_SECRET_KEY=senha_minio
MINIO_SECURE=false

SECRET_KEY=chave_jwt_com_32_caracteres_ou_mais
CORS_ORIGINS=http://IP_DO_SERVIDOR:3000
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=senha_forte_admin
VITE_FLOWCHECK_URL=https://flowcheck-three.vercel.app/home
```

Observações:

- Se o MinIO usa HTTPS, use `MINIO_SECURE=true` e a porta correta.
- Se o MinIO está no mesmo host do Docker e fora da rede do compose, use o IP do host ou `host.docker.internal` (Docker Desktop). Em Linux, normalmente o IP da interface Docker ou o IP de LAN do servidor.
- Se for usar o MinIO local do compose, deixe `MINIO_ENDPOINT=minio:9000` e as credenciais iguais às do serviço `minio`.
- Para usar somente o MinIO externo, remova o serviço `minio` e o volume `minio_data` do compose.

## 6. Construir e subir pela CLI

```bash
sh deploy.sh
```

Ou manualmente:

```bash
docker compose build
docker compose up -d --no-build
docker compose ps
```

Acesse:

- Aplicação: `http://IP_DO_SERVIDOR:3000`
- Swagger: `http://IP_DO_SERVIDOR:8000/docs`
- Health: `http://IP_DO_SERVIDOR:8000/health`
- MinIO Console: `http://IP_DO_SERVIDOR:9101` (se usar o MinIO local)

## 7. Subir pelo Portainer (imagens prontas)

O Portainer não deve buildar usando apenas o editor de stack. Construa as imagens no servidor:

```bash
sh deploy/build-images.sh
```

Isso cria:

- `organograma-backend:latest`
- `organograma-frontend:latest`

No Portainer:

1. **Stacks → Add stack**.
2. Cole `deploy/portainer-stack.yml` ou aponte para o arquivo.
3. Configure as variáveis de ambiente da stack (as mesmas do `.env`) ou faça upload do `.env`.
4. Faça o deploy.

Se estiver usando MinIO externo, remova o serviço `minio` do YAML e mantenha `MINIO_ENDPOINT` apontando para o servidor existente.

## 8. Verificações

```bash
docker compose ps
curl http://localhost:8000/health
curl http://localhost:3000/
```

Resposta esperada do health:

```json
{"status":"ok","database":true,"storage":true}
```

No navegador, teste o login e uma foto de perfil. Se o erro for de Supabase no console, veja a seção 10.

## 9. Banco já existente no servidor

O SQL de `database/init/` só roda quando o volume do Postgres está vazio. Se o servidor já tem um banco da tentativa anterior, escolha uma opção:

- **Ambiente de teste:** recriar tudo (apaga dados):
  ```bash
  docker compose down -v
  docker compose up -d --build
  ```
- **Manter dados:** aplicar os SQLs manualmente:
  ```bash
  docker cp database/init/01-schema.sql organograma-postgres:/tmp/01-schema.sql
  docker exec -it organograma-postgres psql -U postgres -d organograma -f /tmp/01-schema.sql
  ```
  Para os dados migrados:
  ```bash
  powershell -File scripts/apply-supabase-data.ps1
  ```
  (ou use `psql`/DBeaver no servidor)

## 10. Se aparecer erro de Supabase

O código atual não chama `*.supabase.co`. Se aparecer no console, quase sempre é:

1. imagem antiga no Portainer;
2. stack apontando para commit antigo;
3. cache do navegador.

Verifique:

```bash
docker exec organograma-frontend sh -lc "grep -Ril supabase /usr/share/nginx/html || echo SEM_SUPABASE"
docker exec organograma-backend sh -lc "env | grep -i supabase || echo SEM_SUPABASE"
```

Se aparecer `SEM_SUPABASE`, force a atualização da stack/imagem e teste em aba anônima.

## 11. Imagem do MinIO

O compose usa `minio/minio:latest`. Se o servidor interno não conseguir baixar essa imagem, leve-a de uma máquina que já tenha:

```bash
docker save minio/minio:latest -o minio.tar
# copie o minio.tar para o servidor
docker load -i minio.tar
```

Depois rode o build/subida normalmente.

## 12. Login inicial

- Admin: `admin@empresa.com` / `ADMIN_PASSWORD` do `.env`
- Demais contas migradas: login pelo nome ou e-mail corporativo (se exportado com service_role) / senha padrão `organograma123`

Troque as senhas padrão antes de liberar para os usuários.
