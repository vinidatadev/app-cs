-- ============================================================
-- Permite que cada usuário edite seu próprio perfil (nome + foto)
-- e faça upload no bucket "imagens" na pasta perfil/
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── public.user: usuário atualiza só a própria linha ─────────
drop policy if exists "usuario atualiza proprio perfil" on public.user;

create policy "usuario atualiza proprio perfil" on public.user
  for update
  using (auth.uid()::text = id_user)
  with check (auth.uid()::text = id_user);


-- ── Storage: bucket "imagens" ────────────────────────────────
-- Upload (insert) na pasta perfil/ — só o próprio usuário
insert into storage.buckets (id, name, public)
values ('imagens', 'imagens', true)
on conflict (id) do update set public = true;

drop policy if exists "upload perfil proprio"  on storage.objects;
drop policy if exists "leitura publica imagens" on storage.objects;
drop policy if exists "update perfil proprio"  on storage.objects;

-- Leitura pública (a URL pública já funciona assim, mas garante via policy)
create policy "leitura publica imagens" on storage.objects
  for select using (bucket_id = 'imagens');

-- Upload: usuário autenticado sobe apenas na pasta perfil/{seu_uid}.*
create policy "upload perfil proprio" on storage.objects
  for insert with check (
    bucket_id = 'imagens'
    and auth.uid() is not null
    and name like 'perfil/' || auth.uid()::text || '.%'
  );

-- Update/upsert do mesmo arquivo
create policy "update perfil proprio" on storage.objects
  for update using (
    bucket_id = 'imagens'
    and auth.uid() is not null
    and name like 'perfil/' || auth.uid()::text || '.%'
  );
