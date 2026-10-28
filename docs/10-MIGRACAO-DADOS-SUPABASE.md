# 10 - Migração dos dados do Supabase

## Por que ainda faltam dados

A exportação inicial usou a chave `anon`. Tabelas com RLS (transações, permissões, cursos, indicadores, etc.) podem ter retornado zero mesmo tendo dados. O Storage, por outro lado, permitiu baixar 102 arquivos.

Para trazer **tudo**, use a `service_role` do Supabase. Ela ignora RLS e também acessa a API administrativa de usuários.

## Script pronto

Arquivo: `scripts/export-supabase-data.mjs`

### 1. Rodar

```powershell
$env:SUPABASE_URL="https://SEU-PROJETO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY"
node scripts/export-supabase-data.mjs
```

A `service_role` fica em **Supabase → Project Settings → API**.

### 2. O que ele gera

| Caminho | Conteúdo |
|---|---|
| `database/init/03-supabase-data.sql` | SQL com todos os registros exportados |
| `database/seed/supabase/*.json` | JSON por tabela, para conferência |
| `backend/seed-assets/{bucket}/...` | arquivos do Storage baixados |

Tabelas exportadas:

- `user`, `organograma`, `atribuicao`, `user_atribuicao`, `user_permissoes`
- `curso`, `user_curso`
- `transacao`, `transacao_detalhe`
- `celula`, `celula_user`, `celula_relacao`
- `ind_grupo`, `ind_subgrupo`, `ind_indicador`, `ind_valor`
- `ind_comentario`, `ind_nota`, `ind_nota_anexo`
- `ind_tarefa`, `ind_tarefa_comentario`, `ind_tarefa_anexo`

Além disso:

- converte URLs do Storage do Supabase para `/api/storage/public/...`;
- baixa fotos, imagens de transações e anexos para o seed do MinIO;
- exporta os e-mails de login via `/auth/v1/admin/users`;
- se a API administrativa devolver `encrypted_password`, atualiza o hash no `app_auth` (senha original preservada);
- caso contrário, a conta continua com a senha padrão `organograma123`, mas passa a aceitar o e-mail corporativo.

## 3. Aplicar no banco

### Banco novo

O Postgres executa `database/init/01-schema.sql`, `02-seed.sql` e `03-supabase-data.sql` na primeira inicialização:

```powershell
docker compose down -v
docker compose up -d --build
```

### Banco já existente

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-supabase-data.ps1
```

Ou manualmente:

```bash
docker cp database/init/03-supabase-data.sql organograma-postgres:/tmp/03.sql
docker exec -it organograma-postgres psql -U postgres -d organograma -v ON_ERROR_STOP=1 -f /tmp/03.sql
docker compose restart backend
```

O SQL usa `ON CONFLICT ... DO UPDATE`, então pode ser reaplicado.

## 4. Arquivos no MinIO

No startup, o backend envia os arquivos de `backend/seed-assets/` para os buckets `imagens`, `transacoes` e `task-attachments`, sem sobrescrever o que já existe.

Se o MinIO já estiver em outro servidor, copie com `mc mirror`:

```bash
mc alias set origem http://localhost:9000 usuario senha
mc alias set destino http://IP_DO_MINIO:9000 usuario senha
mc mirror --overwrite origem/imagens destino/imagens
mc mirror --overwrite origem/transacoes destino/transacoes
mc mirror --overwrite origem/task-attachments destino/task-attachments
```

## 5. Verificar

```sql
SELECT 'user', count(*) FROM public."user"
UNION ALL SELECT 'organograma', count(*) FROM public.organograma
UNION ALL SELECT 'transacao', count(*) FROM public.transacao
UNION ALL SELECT 'transacao_detalhe', count(*) FROM public.transacao_detalhe
UNION ALL SELECT 'ind_tarefa', count(*) FROM public.ind_tarefa
UNION ALL SELECT 'user_permissoes', count(*) FROM public.user_permissoes;
```

No MinIO:

```bash
docker exec organograma-minio sh -lc "mc alias set local http://localhost:9000 minioadmin minioadmin123 >/dev/null && mc ls --recursive local/imagens | wc -l"
```

## 6. Segurança

- `03-supabase-data.sql` e `database/seed/` contêm dados reais e estão no `.gitignore`.
- Não envie a `service_role` para o Git, para o chat ou para o TAR.
- Apague as variáveis do terminal depois da exportação.
- Depois de validar a migração, você pode remover a `service_role` do projeto Supabase.

## 7. Requisições do frontend

Depois da renomeação do client, todas as chamadas passam por:

```text
api.from(...)      → /rest/v1       → PostgREST → PostgreSQL
api.auth...        → /api/auth      → FastAPI   → PostgreSQL
api.storage...     → /api/storage   → FastAPI   → MinIO
```

Não existe chamada para `supabase.co` no código de runtime.
