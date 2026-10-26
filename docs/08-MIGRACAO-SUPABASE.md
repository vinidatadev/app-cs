# 08 - Migração Supabase → PostgreSQL local

## O que a documentação antiga dizia

A documentação anterior afirmava que o frontend já havia sido adaptado para uma API REST local. Isso não era verdade: todos os componentes ainda chamavam `@supabase/supabase-js`, e o backend antigo usava um schema (`usuarios`, `posicoes`) diferente do schema real do frontend (`user`, `organograma`, `ind_*`). Por isso a aplicação não funcionaria apenas subindo os containers antigos.

## O que foi feito nesta migração

1. O schema real do frontend foi reconstruído em `database/init/01-schema.sql`.
2. Os dados visíveis pela chave `anon` foram exportados e gravados em `02-seed.sql`.
3. Foi adicionado PostgREST para manter a semântica de queries do Supabase (`select`, `eq`, `in`, `order`, embeds).
4. O arquivo `frontend/src/supabase.js` virou um client local compatível; os componentes não precisaram ser reescritos.
5. Login e Storage foram implementados no backend FastAPI, usando MinIO como storage S3 local.
6. As fotos de perfil foram baixadas para `backend/seed-assets/` e enviadas para o bucket `imagens` do MinIO no startup. Essa pasta não é versionada por conter dados pessoais; use `mc mirror` para copiar entre MinIOs.
7. O Supabase foi removido do `package.json`, do build e do fluxo de arquivos.

## Dados migrados

| Tabela | Registros |
|---|---|
| `user` | 26 |
| `organograma` | 23 |
| `celula` | 3 |
| `celula_user` | 7 |
| `celula_relacao` | 2 |
| demais tabelas | 0 no momento da exportação |

## Limitações

### Senhas

A chave `anon` não lê `auth.users`. As senhas do Supabase Auth não puderam ser migradas. Cada pessoa recebeu uma conta local com senha `organograma123` e login pelo nome/e-mail local. Veja [05-LOGIN-E-USUARIOS.md](05-LOGIN-E-USUARIOS.md).

### Dados protegidos por RLS

A exportação usou a chave `anon`. Se alguma tabela tiver RLS bloqueando leitura anônima, os registros não apareceram no seed. As tabelas que retornaram zero podem estar realmente vazias ou ocultas.

Para uma migração completa, use a `service_role` ou uma conexão direta com o Postgres do Supabase:

```powershell
$env:SUPABASE_URL="https://SEU-PROJETO.supabase.co"
$env:SUPABASE_SERVICE_KEY="SUA_SERVICE_ROLE_KEY"
```

Com a service key é possível:

- exportar todas as tabelas sem RLS;
- listar usuários em `/auth/v1/admin/users`;
- opcionalmente migrar e-mails reais.

O `app_auth` local não é exposto pelo PostgREST (`REVOKE` em `99-grants.sql`).

### Storage

Somente as fotos referenciadas em `user.foto` foram baixadas. Elas agora ficam no MinIO (bucket `imagens`). Anexos de notas, tarefas e transações não existiam no momento da exportação.

## Recriar a partir do zero

```powershell
docker compose down -v
docker compose up -d --build
```

## Voltar para o Supabase?

O código antigo do client Supabase está preservado no histórico do Git e em `_archive/`. Os scripts SQL originais estão em `database/legacy/`. Ainda assim, a recomendação é manter a stack local, que não depende de firewall externo.
