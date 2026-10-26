# Scripts legados

Estes são os SQLs originais do projeto Supabase e a primeira tentativa de schema local.

- `supabase_*.sql`: schema/policies originais do Supabase, incluindo `auth.uid()` e RLS.
- `01-setup.sql` a `07-views.sql`: schema alternativo antigo (`usuarios`, `posicoes`), que não era compatível com o frontend.

O schema ativo está em `database/init/01-schema.sql`.
