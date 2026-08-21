-- ============================================================
-- Como configurar permissões de um usuário
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Primeiro encontre o id_user do usuário (é o UUID do auth.users)
--    Você pode ver na tabela public.user, coluna id_user
--    Ou em Authentication > Users no dashboard do Supabase

-- 2. Insira as permissões (substitua o UUID abaixo):

-- Exemplo: usuário com acesso total (editor em tudo)
insert into public.user_permissoes (id_user, organograma, transacoes, capacitacao, links)
values ('UUID-DO-USUARIO-AQUI', 'editor', 'editor', 'editor', true);

-- Exemplo: visualizador de tudo
insert into public.user_permissoes (id_user, organograma, transacoes, capacitacao, links)
values ('UUID-DO-USUARIO-AQUI', 'viewer', 'viewer', 'viewer', true);

-- Exemplo: só vê organograma e transações, sem capacitação nem links
insert into public.user_permissoes (id_user, organograma, transacoes, capacitacao, links)
values ('UUID-DO-USUARIO-AQUI', 'viewer', 'viewer', 'none', false);

-- Exemplo: editor de transações + viewer de organograma
insert into public.user_permissoes (id_user, organograma, transacoes, capacitacao, links)
values ('UUID-DO-USUARIO-AQUI', 'viewer', 'editor', 'none', false);

-- Para atualizar permissões de um usuário já cadastrado:
update public.user_permissoes
set organograma = 'editor',
    transacoes  = 'editor',
    capacitacao = 'viewer',
    links       = true
where id_user = 'UUID-DO-USUARIO-AQUI';

-- ── Valores possíveis ──────────────────────────────────────
-- organograma : 'none' | 'viewer' | 'editor'
--   viewer  → vê o organograma, NÃO pode mover/remover/editar
--   editor  → acesso total: mover nós, remover, atribuições, membros
--
-- transacoes  : 'none' | 'viewer' | 'editor'
--   viewer  → vê lista e detalhe, NÃO pode criar/editar/deletar
--   editor  → pode criar, editar descrição, ponto focal, detalhes, deletar
--
-- capacitacao : 'none' | 'viewer' | 'editor'
--   viewer  → vê por pessoa e por curso (status somente leitura)
--   editor  → pode mudar status dos cursos + gerenciar cursos (aba ⚙)
--
-- links       : false | true
--   false → não vê a aba Links
--   true  → vê a aba Links
-- ─────────────────────────────────────────────────────────────
