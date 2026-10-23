-- Corrige o arquivamento das notas de indicadores.
-- Problema: a policy de UPDATE usava status = 'ativa' no USING sem WITH CHECK.
-- No Postgres o USING também é aplicado ao novo registro, então era impossível
-- mudar o status para 'arquivada' e o histórico nunca era preenchido.
-- Rode este script no SQL Editor do Supabase.

drop policy if exists "ind_nota update" on public.ind_nota;

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

-- Opcional: regularizar dados antigos em que várias notas ficaram como 'ativa'
-- no mesmo escopo (id_grupo/id_subgrupo) por causa do bug. Mantém a mais recente
-- ativa e arquiva as demais.
with ranked as (
  select id,
         row_number() over (
           partition by referencia, coalesce(id_grupo, 0), coalesce(id_subgrupo, 0)
           order by criado_em desc, id desc
         ) as rn
  from public.ind_nota
  where status = 'ativa'
)
update public.ind_nota n
set status = 'arquivada',
    atualizado_em = now()
from ranked r
where n.id = r.id
  and r.rn > 1;
