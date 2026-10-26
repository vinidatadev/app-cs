# 05 - Login e usuários

## Contas criadas automaticamente

### Administrador

Criado/atualizado a cada start do backend usando `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env`:

```text
admin@empresa.com / admin123
```

Ele é vinculado ao primeiro usuário com `nivel = 2` (hoje: Vinicius Nascimento).

### Pessoas migradas

O trigger `trg_seed_app_auth` cria uma conta para cada linha de `public."user"`:

```text
username:     nome normalizado (ex.: vinicius.nascimento)
display_name: nome original (ex.: Vinicius Nascimento)
email:        username@organograma.local
senha:        organograma123
```

O login aceita e-mail, username ou nome completo.

## Limitação da migração de senhas

A chave `anon` do Supabase não permite ler `auth.users`. Por isso as senhas originais não foram importadas. Se você tiver a `service_role` ou a senha do banco do Supabase, os e-mails e hashes podem ser migrados em uma segunda etapa.

## Trocar a senha do admin

No `.env`:

```env
ADMIN_PASSWORD=nova_senha_forte
```

Depois:

```powershell
docker compose up -d backend
```

## Resetar a senha de qualquer conta

```powershell
docker exec -it organograma-postgres psql -U postgres -d organograma
```

```sql
UPDATE public.app_auth
SET password_hash = crypt('NovaSenha123', gen_salt('bf'))
WHERE lower(email) = lower('usuario@empresa.com')
   OR lower(username) = lower('vinicius.nascimento')
   OR lower(display_name) = lower('Vinicius Nascimento');
```

## Criar conta para um usuário existente

```sql
INSERT INTO public.app_auth (id_user, username, email, display_name, password_hash)
SELECT id_user, 'joao.silva', 'joao.silva@empresa.com', nome_usuario,
       crypt('SenhaInicial123', gen_salt('bf'))
FROM public."user"
WHERE id = 10
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    password_hash = EXCLUDED.password_hash,
    is_active = true;
```

## Desativar login

```sql
UPDATE public.app_auth SET is_active = false WHERE lower(email) = lower('usuario@empresa.com');
```

## Observações

- O usuário do organograma e a conta de login são entidades separadas (`"user"` e `app_auth`), ligadas por `id_user`.
- Criar uma pessoa pelo botão "Membros" cria automaticamente uma conta com a senha padrão.
- Para trocar a senha padrão de novos usuários, altere a função `seed_app_auth_for_user` em `database/init/01-schema.sql` e recrie o banco, ou faça um `UPDATE` depois.
