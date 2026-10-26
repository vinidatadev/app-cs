-- Adiciona colunas de posição na tabela organograma
alter table public.organograma add column if not exists pos_x float default 0;
alter table public.organograma add column if not exists pos_y float default 0;
