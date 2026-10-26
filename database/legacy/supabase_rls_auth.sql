-- ============================================================
-- RLS seguro — versão corrigida
-- auth.uid() is not null  →  usuário logado (funciona com anon key)
-- auth.role() = 'authenticated' era incorreto com anon key
-- Execute no SQL Editor do Supabase
-- ============================================================

-- helper: verifica se o usuário logado é admin (nivel = 2)
-- usado em várias policies abaixo
-- ============================================================


-- ── user_permissoes ──────────────────────────────────────────
drop policy if exists "allow all"       on public.user_permissoes;
drop policy if exists "leitura propria" on public.user_permissoes;
drop policy if exists "admin le todas"  on public.user_permissoes;
drop policy if exists "admin escreve"   on public.user_permissoes;

-- Usuário lê suas próprias permissões
create policy "leitura propria" on public.user_permissoes
  for select using (auth.uid()::text = id_user);

-- Admin lê todas
create policy "admin le todas" on public.user_permissoes
  for select using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
  );

-- Admin escreve
create policy "admin escreve" on public.user_permissoes
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
  ) with check (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
  );


-- ── public.user ──────────────────────────────────────────────
drop policy if exists "allow all"          on public.user;
drop policy if exists "autenticado le"     on public.user;
drop policy if exists "admin escreve user" on public.user;

-- Qualquer usuário logado lê todos (auth.uid() is not null = está autenticado)
create policy "autenticado le" on public.user
  for select using (auth.uid() is not null);

-- Admin escreve
create policy "admin escreve user" on public.user
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
  ) with check (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
  );


-- ── organograma ──────────────────────────────────────────────
drop policy if exists "allow all"               on public.organograma;
drop policy if exists "autenticado le organograma" on public.organograma;
drop policy if exists "editor escreve organograma" on public.organograma;

create policy "autenticado le organograma" on public.organograma
  for select using (auth.uid() is not null);

create policy "editor escreve organograma" on public.organograma
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.organograma = 'editor'
    )
  );


-- ── transacao ────────────────────────────────────────────────
drop policy if exists "allow all"               on public.transacao;
drop policy if exists "autenticado le transacao" on public.transacao;
drop policy if exists "editor escreve transacao" on public.transacao;

create policy "autenticado le transacao" on public.transacao
  for select using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.transacoes in ('viewer','editor')
    )
  );

create policy "editor escreve transacao" on public.transacao
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.transacoes = 'editor'
    )
  );


-- ── transacao_detalhe ────────────────────────────────────────
drop policy if exists "allow all"                      on public.transacao_detalhe;
drop policy if exists "autenticado le transacao_detalhe" on public.transacao_detalhe;
drop policy if exists "editor escreve transacao_detalhe" on public.transacao_detalhe;

create policy "autenticado le transacao_detalhe" on public.transacao_detalhe
  for select using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.transacoes in ('viewer','editor')
    )
  );

create policy "editor escreve transacao_detalhe" on public.transacao_detalhe
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.transacoes = 'editor'
    )
  );


-- ── curso ────────────────────────────────────────────────────
drop policy if exists "allow all"          on public.curso;
drop policy if exists "autenticado le curso" on public.curso;
drop policy if exists "editor escreve curso" on public.curso;

create policy "autenticado le curso" on public.curso
  for select using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.capacitacao in ('viewer','editor')
    )
  );

create policy "editor escreve curso" on public.curso
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.capacitacao = 'editor'
    )
  );


-- ── user_curso ───────────────────────────────────────────────
drop policy if exists "allow all"             on public.user_curso;
drop policy if exists "autenticado le user_curso" on public.user_curso;
drop policy if exists "editor escreve user_curso" on public.user_curso;

create policy "autenticado le user_curso" on public.user_curso
  for select using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.capacitacao in ('viewer','editor')
    )
  );

create policy "editor escreve user_curso" on public.user_curso
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.capacitacao = 'editor'
    )
  );


-- ── atribuicao ───────────────────────────────────────────────
drop policy if exists "allow all"               on public.atribuicao;
drop policy if exists "autenticado le atribuicao" on public.atribuicao;
drop policy if exists "editor escreve atribuicao" on public.atribuicao;

create policy "autenticado le atribuicao" on public.atribuicao
  for select using (auth.uid() is not null);

create policy "editor escreve atribuicao" on public.atribuicao
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.organograma = 'editor'
    )
  );


-- ── user_atribuicao ──────────────────────────────────────────
drop policy if exists "allow all"                    on public.user_atribuicao;
drop policy if exists "autenticado le user_atribuicao" on public.user_atribuicao;
drop policy if exists "editor escreve user_atribuicao" on public.user_atribuicao;

create policy "autenticado le user_atribuicao" on public.user_atribuicao
  for select using (auth.uid() is not null);

create policy "editor escreve user_atribuicao" on public.user_atribuicao
  for all using (
    exists (select 1 from public.user u where u.id_user = auth.uid()::text and u.nivel = 2)
    or
    exists (
      select 1 from public.user_permissoes p
      where p.id_user = auth.uid()::text and p.organograma = 'editor'
    )
  );
