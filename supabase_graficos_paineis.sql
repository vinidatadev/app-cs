-- Permite dividir os indicadores de um subgrupo em dois gráficos.
-- painel_grafico = 1 -> gráfico principal (topo)
-- painel_grafico = 2 -> gráfico secundário (abaixo)
-- Rode este script no SQL Editor do Supabase.

alter table public.ind_indicador
  add column if not exists painel_grafico int not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ind_indicador_painel_grafico_check'
  ) then
    alter table public.ind_indicador
      add constraint ind_indicador_painel_grafico_check
      check (painel_grafico between 1 and 2);
  end if;
end $$;
