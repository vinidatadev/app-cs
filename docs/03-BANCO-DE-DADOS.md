# 03 - Banco de dados

## Onde ficam os scripts

```text
database/init/01-schema.sql   tabelas, índices, funções e trigger de contas
database/init/02-seed.sql     dados migrados do Supabase
database/init/99-grants.sql   roles e permissões do PostgREST
database/legacy/              scripts antigos (Supabase), somente consulta
```

Os arquivos de `database/init/` só são executados quando o volume do Postgres está vazio.

## Tabelas principais

| Tabela | Conteúdo |
|---|---|
| `"user"` | pessoas do organograma (`id` bigint, `id_user` uuid, nome, cargo, foto, nível, setor) |
| `app_auth` | contas de login locais (usuário, e-mail, hash bcrypt, vínculo com `"user".id_user`) |
| `organograma` | vínculos gestor → subordinado e posição visual |
| `atribuicao` | etiquetas de atribuição |
| `user_atribuicao` | relação N:N entre pessoas e atribuições |
| `user_permissoes` | permissões por módulo |
| `curso` / `user_curso` | capacitação |
| `transacao` / `transacao_detalhe` | transações e seu conteúdo |
| `celula` / `celula_user` / `celula_relacao` | visão de células |
| `ind_grupo` → `ind_subgrupo` → `ind_indicador` | estrutura dos indicadores |
| `ind_valor` / `ind_comentario` | valores mensais e comentários |
| `ind_nota` / `ind_nota_anexo` | anotações e anexos |
| `ind_tarefa` / `ind_tarefa_comentario` / `ind_tarefa_anexo` | tarefas |

## Relacionamentos usados pelo frontend

O PostgREST resolve automaticamente os embeds usados pelo React:

- `user_atribuicao(*, atribuicao(*))`
- `ind_grupo(*, ind_subgrupo(*, ind_indicador(*)))`
- `ind_nota(*, ind_nota_anexo(*))`
- `ind_tarefa(*, ind_subgrupo(nome), ind_indicador(nome))`
- `transacao(*, ponto_focal:id_ponto_focal(...))`

## Acessar o banco

```powershell
docker exec -it organograma-postgres psql -U postgres -d organograma
```

Exemplos:

```sql
SELECT id, nome_usuario, nivel FROM public."user" ORDER BY nome_usuario;
SELECT * FROM public.organograma LIMIT 10;
SELECT id, username, email, is_active FROM public.app_auth;
```

## Recriar o banco do zero

```powershell
docker compose down -v
docker compose up -d --build
```

Isso apaga todos os dados e recria a partir dos scripts.

## Roles internas

O PostgREST conecta como `authenticator` e troca para `organograma_api`. A senha interna `postgrest_local_pwd` aparece em `database/init/99-grants.sql` e no `PGRST_DB_URI` do `docker-compose.yml`; se trocar, altere nos dois lugares.

## RLS

O Supabase usava Row Level Security. Nesta versão local:

- RLS não está habilitado;
- o PostgREST exige JWT válido;
- as permissões de módulo continuam sendo aplicadas pelo frontend.

Se for necessário endurecer o acesso, o próximo passo é habilitar RLS e criar policies equivalentes usando `app_auth`/JWT.
