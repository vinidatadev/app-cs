-- ============================================================
-- MÓDULO INDICADORES DA ÁREA
-- Execute no SQL Editor do Supabase (em ordem)
-- ============================================================


-- ── 1. GRUPOS ────────────────────────────────────────────────
create table if not exists public.ind_grupo (
  id          serial primary key,
  nome        text not null,
  descricao   text,
  ordem       int  not null default 0,
  criado_em   timestamptz not null default now()
);

-- ── 2. SUBGRUPOS ─────────────────────────────────────────────
create table if not exists public.ind_subgrupo (
  id             serial primary key,
  id_grupo       int not null references public.ind_grupo(id) on delete cascade,
  nome           text not null,
  responsavel_id text,          -- id_user da tabela user (sem FK formal: user.id_user não tem UNIQUE constraint)
  ordem          int  not null default 0,
  criado_em      timestamptz not null default now()
);

-- ── 3. INDICADORES (métricas configuráveis por subgrupo) ─────
-- tipo: 'numero' | 'percentual' — influencia formatação na tela
-- usa_no_grafico: quais linhas/barras aparecem no gráfico
-- tipo_grafico: 'barra' | 'linha'
create table if not exists public.ind_indicador (
  id             serial primary key,
  id_subgrupo    int  not null references public.ind_subgrupo(id) on delete cascade,
  nome           text not null,
  tipo           text not null default 'numero' check (tipo in ('numero','percentual')),
    tipo_grafico   text          default null    check (tipo_grafico in ('barra','linha', null)),
    cor_grafico    text          default null,   -- hex, ex: '#6366f1'
    painel_grafico int  not null default 1 check (painel_grafico between 1 and 2),
  ordem          int  not null default 0,
  criado_em      timestamptz not null default now()
);

-- ── 4. VALORES MENSAIS ────────────────────────────────────────
-- mes: 1-12, ano: ex 2025
create table if not exists public.ind_valor (
  id             serial primary key,
  id_indicador   int  not null references public.ind_indicador(id) on delete cascade,
  ano            int  not null,
  mes            int  not null check (mes between 1 and 12),
  valor          numeric,
  atualizado_em  timestamptz not null default now(),
  atualizado_por text,          -- id_user (sem FK formal)
  unique (id_indicador, ano, mes)
);

-- ── 5. COMENTÁRIOS DE CÉLULA ──────────────────────────────────
create table if not exists public.ind_comentario (
  id           serial primary key,
  id_valor     int  not null references public.ind_valor(id) on delete cascade,
  texto        text not null,
  autor_id     text not null,   -- id_user (sem FK formal)
  imagem_url   text,
  criado_em    timestamptz not null default now()
);

-- ── 6. NOTAS (bloco rich text por grupo ou subgrupo) ─────────
-- referencia: 'grupo' | 'subgrupo'
-- status: 'ativa' | 'arquivada'  — só a ativa pode ser editada
create table if not exists public.ind_nota (
  id              serial primary key,
  referencia      text not null check (referencia in ('grupo','subgrupo')),
  id_grupo        int  references public.ind_grupo(id)    on delete cascade,
  id_subgrupo     int  references public.ind_subgrupo(id) on delete cascade,
  titulo          text,
  conteudo_html   text,
  mes_ref         int  check (mes_ref between 1 and 12),
  ano_ref         int,
  status          text not null default 'ativa' check (status in ('ativa','arquivada')),
  autor_id        text not null,   -- id_user (sem FK formal)
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- ── 7. ANEXOS DAS NOTAS ───────────────────────────────────────
create table if not exists public.ind_nota_anexo (
  id         serial primary key,
  id_nota    int  not null references public.ind_nota(id) on delete cascade,
  nome       text not null,
  url        text not null,
  tipo       text not null default 'arquivo' check (tipo in ('imagem','arquivo')),
  criado_em  timestamptz not null default now()
);

-- ── 8. TAREFAS ────────────────────────────────────────────────
-- vinculo flexível: pode ser grupo, subgrupo, indicador, ou indicador+mes
-- status: 'aberta' | 'andamento' | 'concluida' | 'cancelada'
create table if not exists public.ind_tarefa (
  id               serial primary key,
  titulo           text not null,
  descricao        text,
  id_grupo         int  not null references public.ind_grupo(id) on delete cascade,
  id_subgrupo      int  references public.ind_subgrupo(id) on delete set null,
  id_indicador     int  references public.ind_indicador(id) on delete set null,
  mes_ref          int  check (mes_ref between 1 and 12),
  ano_ref          int,
  responsavel_id   text,   -- id_user (sem FK formal)
  criado_por       text,   -- id_user (sem FK formal)
  data_inicio      date,
  data_fim         date,
  status           text not null default 'aberta' check (status in ('aberta','andamento','concluida','cancelada')),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

-- ── 9. COMENTÁRIOS DAS TAREFAS ────────────────────────────────
create table if not exists public.ind_tarefa_comentario (
  id         serial primary key,
  id_tarefa  int  not null references public.ind_tarefa(id) on delete cascade,
  texto      text not null,
  autor_id   text not null,   -- id_user (sem FK formal)
  criado_em  timestamptz not null default now()
);

-- ── 10. ANEXOS DAS TAREFAS ────────────────────────────────────
create table if not exists public.ind_tarefa_anexo (
  id         serial primary key,
  id_tarefa  int  not null references public.ind_tarefa(id) on delete cascade,
  nome       text not null,
  url        text not null,
  tipo       text not null default 'arquivo' check (tipo in ('imagem','arquivo')),
  criado_em  timestamptz not null default now()
);


-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index if not exists idx_ind_subgrupo_grupo    on public.ind_subgrupo(id_grupo);
create index if not exists idx_ind_indicador_sub     on public.ind_indicador(id_subgrupo);
create index if not exists idx_ind_valor_ind         on public.ind_valor(id_indicador);
create index if not exists idx_ind_valor_ano         on public.ind_valor(ano);
create index if not exists idx_ind_comentario_valor  on public.ind_comentario(id_valor);
create index if not exists idx_ind_nota_grupo        on public.ind_nota(id_grupo);
create index if not exists idx_ind_nota_subgrupo     on public.ind_nota(id_subgrupo);
create index if not exists idx_ind_tarefa_grupo      on public.ind_tarefa(id_grupo);
create index if not exists idx_ind_tarefa_resp       on public.ind_tarefa(responsavel_id);


-- ============================================================
-- RLS — habilitar em todas as tabelas
-- ============================================================
alter table public.ind_grupo               enable row level security;
alter table public.ind_subgrupo            enable row level security;
alter table public.ind_indicador           enable row level security;
alter table public.ind_valor               enable row level security;
alter table public.ind_comentario          enable row level security;
alter table public.ind_nota                enable row level security;
alter table public.ind_nota_anexo          enable row level security;
alter table public.ind_tarefa              enable row level security;
alter table public.ind_tarefa_comentario   enable row level security;
alter table public.ind_tarefa_anexo        enable row level security;


-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Retorna true se o usuário logado é admin (nivel = 2)
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.user
    where id_user = auth.uid()::text
      and nivel = 2
  );
$$;

-- Retorna true se o usuário logado é do setor Customer Service
create or replace function public.is_customer_service()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.user
    where id_user = auth.uid()::text
      and setor = 'Customer Service'
  );
$$;

-- Retorna true se o usuário é responsável pelo subgrupo
create or replace function public.is_responsavel_subgrupo(p_id_subgrupo int)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.ind_subgrupo
    where id = p_id_subgrupo
      and responsavel_id = auth.uid()::text
  );
$$;

-- Retorna true se pode acessar (admin ou CS)
create or replace function public.pode_acessar_indicadores()
returns boolean language sql stable security definer as $$
  select public.is_admin() or public.is_customer_service();
$$;

-- Retorna true se pode editar subgrupo (admin ou responsável)
create or replace function public.pode_editar_subgrupo(p_id_subgrupo int)
returns boolean language sql stable security definer as $$
  select public.is_admin() or public.is_responsavel_subgrupo(p_id_subgrupo);
$$;


-- ============================================================
-- POLICIES RLS
-- ============================================================

-- ── ind_grupo ─────────────────────────────────────────────────
drop policy if exists "ind_grupo select" on public.ind_grupo;
drop policy if exists "ind_grupo insert" on public.ind_grupo;
drop policy if exists "ind_grupo update" on public.ind_grupo;
drop policy if exists "ind_grupo delete" on public.ind_grupo;

create policy "ind_grupo select" on public.ind_grupo
  for select using (public.pode_acessar_indicadores());

create policy "ind_grupo insert" on public.ind_grupo
  for insert with check (public.is_admin());

create policy "ind_grupo update" on public.ind_grupo
  for update using (public.is_admin());

create policy "ind_grupo delete" on public.ind_grupo
  for delete using (public.is_admin());


-- ── ind_subgrupo ──────────────────────────────────────────────
drop policy if exists "ind_subgrupo select" on public.ind_subgrupo;
drop policy if exists "ind_subgrupo insert" on public.ind_subgrupo;
drop policy if exists "ind_subgrupo update" on public.ind_subgrupo;
drop policy if exists "ind_subgrupo delete" on public.ind_subgrupo;

create policy "ind_subgrupo select" on public.ind_subgrupo
  for select using (public.pode_acessar_indicadores());

create policy "ind_subgrupo insert" on public.ind_subgrupo
  for insert with check (public.is_admin());

create policy "ind_subgrupo update" on public.ind_subgrupo
  for update using (public.is_admin());

create policy "ind_subgrupo delete" on public.ind_subgrupo
  for delete using (public.is_admin());


-- ── ind_indicador ─────────────────────────────────────────────
drop policy if exists "ind_indicador select" on public.ind_indicador;
drop policy if exists "ind_indicador insert" on public.ind_indicador;
drop policy if exists "ind_indicador update" on public.ind_indicador;
drop policy if exists "ind_indicador delete" on public.ind_indicador;

create policy "ind_indicador select" on public.ind_indicador
  for select using (public.pode_acessar_indicadores());

create policy "ind_indicador insert" on public.ind_indicador
  for insert with check (public.is_admin());

create policy "ind_indicador update" on public.ind_indicador
  for update using (public.is_admin());

create policy "ind_indicador delete" on public.ind_indicador
  for delete using (public.is_admin());


-- ── ind_valor ─────────────────────────────────────────────────
drop policy if exists "ind_valor select" on public.ind_valor;
drop policy if exists "ind_valor upsert" on public.ind_valor;
drop policy if exists "ind_valor delete" on public.ind_valor;

create policy "ind_valor select" on public.ind_valor
  for select using (public.pode_acessar_indicadores());

-- edição: admin ou responsável do subgrupo pai
create policy "ind_valor upsert" on public.ind_valor
  for all using (
    public.is_admin() or exists (
      select 1 from public.ind_indicador i
      where i.id = id_indicador
        and public.is_responsavel_subgrupo(i.id_subgrupo)
    )
  );


-- ── ind_comentario ────────────────────────────────────────────
drop policy if exists "ind_comentario select" on public.ind_comentario;
drop policy if exists "ind_comentario insert" on public.ind_comentario;
drop policy if exists "ind_comentario delete" on public.ind_comentario;

create policy "ind_comentario select" on public.ind_comentario
  for select using (public.pode_acessar_indicadores());

create policy "ind_comentario insert" on public.ind_comentario
  for insert with check (
    public.pode_acessar_indicadores()
    and autor_id = auth.uid()::text
  );

-- só o autor ou admin pode deletar
create policy "ind_comentario delete" on public.ind_comentario
  for delete using (
    public.is_admin() or autor_id = auth.uid()::text
  );


-- ── ind_nota ──────────────────────────────────────────────────
drop policy if exists "ind_nota select" on public.ind_nota;
drop policy if exists "ind_nota insert" on public.ind_nota;
drop policy if exists "ind_nota update" on public.ind_nota;

create policy "ind_nota select" on public.ind_nota
  for select using (public.pode_acessar_indicadores());

create policy "ind_nota insert" on public.ind_nota
  for insert with check (
    public.pode_acessar_indicadores()
    and autor_id = auth.uid()::text
  );

-- edição: somente nota ativa + (admin ou responsável do subgrupo/grupo)
-- o WITH CHECK precisa permitir gravar status = 'arquivada' ao finalizar a nota
create policy "ind_nota update" on public.ind_nota
  for update using (
    status = 'ativa'
    and (
      public.is_admin()
      or autor_id = auth.uid()::text
      or (id_subgrupo is not null and public.is_responsavel_subgrupo(id_subgrupo))
    )
  )
  with check (
    public.is_admin()
    or autor_id = auth.uid()::text
    or (id_subgrupo is not null and public.is_responsavel_subgrupo(id_subgrupo))
  );


-- ── ind_nota_anexo ────────────────────────────────────────────
drop policy if exists "ind_nota_anexo select" on public.ind_nota_anexo;
drop policy if exists "ind_nota_anexo insert" on public.ind_nota_anexo;
drop policy if exists "ind_nota_anexo delete" on public.ind_nota_anexo;

create policy "ind_nota_anexo select" on public.ind_nota_anexo
  for select using (public.pode_acessar_indicadores());

create policy "ind_nota_anexo insert" on public.ind_nota_anexo
  for insert with check (public.pode_acessar_indicadores());

create policy "ind_nota_anexo delete" on public.ind_nota_anexo
  for delete using (public.is_admin());


-- ── ind_tarefa ────────────────────────────────────────────────
drop policy if exists "ind_tarefa select" on public.ind_tarefa;
drop policy if exists "ind_tarefa insert" on public.ind_tarefa;
drop policy if exists "ind_tarefa update" on public.ind_tarefa;

create policy "ind_tarefa select" on public.ind_tarefa
  for select using (public.pode_acessar_indicadores());

create policy "ind_tarefa insert" on public.ind_tarefa
  for insert with check (public.pode_acessar_indicadores());

-- atualização: admin, criador ou responsável
create policy "ind_tarefa update" on public.ind_tarefa
  for update using (
    public.is_admin()
    or criado_por    = auth.uid()::text
    or responsavel_id = auth.uid()::text
  );


-- ── ind_tarefa_comentario ─────────────────────────────────────
drop policy if exists "ind_tarefa_comentario select" on public.ind_tarefa_comentario;
drop policy if exists "ind_tarefa_comentario insert" on public.ind_tarefa_comentario;

create policy "ind_tarefa_comentario select" on public.ind_tarefa_comentario
  for select using (public.pode_acessar_indicadores());

create policy "ind_tarefa_comentario insert" on public.ind_tarefa_comentario
  for insert with check (
    public.pode_acessar_indicadores()
    and autor_id = auth.uid()::text
  );


-- ── ind_tarefa_anexo ──────────────────────────────────────────
drop policy if exists "ind_tarefa_anexo select" on public.ind_tarefa_anexo;
drop policy if exists "ind_tarefa_anexo insert" on public.ind_tarefa_anexo;

create policy "ind_tarefa_anexo select" on public.ind_tarefa_anexo
  for select using (public.pode_acessar_indicadores());

create policy "ind_tarefa_anexo insert" on public.ind_tarefa_anexo
  for insert with check (public.pode_acessar_indicadores());


-- ============================================================
-- STORAGE: bucket task-attachments — pastas do módulo
-- ============================================================

-- Garante que o bucket existe e é público
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true)
on conflict (id) do update set public = true;

-- Leitura pública
drop policy if exists "task-attachments leitura publica" on storage.objects;
create policy "task-attachments leitura publica" on storage.objects
  for select using (bucket_id = 'task-attachments');

-- Upload: qualquer usuário autenticado do CS ou admin
-- pastas usadas:
--   indicadores/comentarios/{id_valor}/
--   indicadores/notas/{id_nota}/
--   indicadores/tarefas/{id_tarefa}/
drop policy if exists "task-attachments upload indicadores" on storage.objects;
create policy "task-attachments upload indicadores" on storage.objects
  for insert with check (
    bucket_id = 'task-attachments'
    and auth.uid() is not null
    and name like 'indicadores/%'
    and public.pode_acessar_indicadores()
  );

-- Delete: admin ou o próprio uploader (via metadata owner)
drop policy if exists "task-attachments delete indicadores" on storage.objects;
create policy "task-attachments delete indicadores" on storage.objects
  for delete using (
    bucket_id = 'task-attachments'
    and (
      public.is_admin()
      or owner = auth.uid()
    )
  );


-- ============================================================
-- COLUNA setor na tabela user (se ainda não existir)
-- Necessária para a função is_customer_service()
-- ============================================================
alter table public.user
  add column if not exists setor text;
