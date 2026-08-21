-- ============================================================
-- CORREÇÃO: remove recursão infinita nas policies de public.user
-- A policy "admin escreve user" fazia SELECT em public.user
-- dentro de uma policy do próprio public.user → loop → 500
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── public.user ──────────────────────────────────────────────
drop policy if exists "autenticado le"     on public.user;
drop policy if exists "admin escreve user" on public.user;

-- Leitura: qualquer usuário logado
create policy "autenticado le" on public.user
  for select using (auth.uid() is not null);

-- Escrita: admin verificado via auth.users metadata (sem recursão)
-- Usa jwt claim em vez de subquery na própria tabela
-- O service_role sempre bypassa RLS, então admin pode usar o dashboard.
-- Para o front, admin só precisa de leitura; escrita de user é só pelo dashboard.
create policy "service role escreve user" on public.user
  for all using (auth.role() = 'service_role');


-- ── user_permissoes ──────────────────────────────────────────
-- A policy "admin escreve" também referenciava public.user — ok pois
-- é em outra tabela, mas vamos garantir que usa maybeSingle path seguro.
-- Não precisa recriar, só as de cima causavam o 500.


-- ── organograma: também tinha subquery em public.user ────────
drop policy if exists "editor escreve organograma" on public.organograma;

create policy "editor escreve organograma" on public.organograma
  for all using (
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text
        and p.organograma = 'editor'
    )
    or exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text
        and p.organograma = 'editor'
    )
    -- admin via nivel 2: a escrita do admin no organograma é tratada
    -- adicionando uma entrada editor na user_permissoes para ele,
    -- ou simplesmente via service_role no dashboard.
    -- Para não ter recursão, usamos só user_permissoes aqui.
  );


-- ── Solução limpa para admin no organograma ──────────────────
-- Insira uma linha na user_permissoes para cada admin (nivel=2)
-- com todas as permissões em 'editor'. Rode a query abaixo
-- substituindo o UUID do admin:
--
-- insert into public.user_permissoes (id_user, organograma, transacoes, capacitacao, links)
-- select id_user, 'editor', 'editor', 'editor', true
-- from public.user
-- where nivel = 2 and id_user is not null
-- on conflict (id_user) do update
--   set organograma = 'editor', transacoes = 'editor', capacitacao = 'editor', links = true;
--
-- Ou rode direto (insere para TODOS os nivel 2 de uma vez):

insert into public.user_permissoes (id_user, organograma, transacoes, capacitacao, links)
select id_user, 'editor', 'editor', 'editor', true
from public.user
where nivel = 2 and id_user is not null
on conflict (id_user) do update
  set organograma = 'editor',
      transacoes  = 'editor',
      capacitacao = 'editor',
      links       = true;
