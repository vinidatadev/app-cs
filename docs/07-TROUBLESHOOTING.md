# 07 - Troubleshooting

## Ver o estado geral

```powershell
docker compose ps
docker compose logs --tail=100
```

## Container reiniciando

```powershell
docker compose logs --tail=100 frontend
docker compose logs --tail=100 backend
docker compose logs --tail=100 postgrest
```

## Porta em uso

Altere no `docker-compose.yml` apenas o lado esquerdo do mapeamento:

```yaml
ports:
  - "3000:80"
```

Se a 3000 estiver ocupada, use `"3100:80"`.

## `401` no PostgREST

O PostgREST exige JWT válido. Faça login novamente:

1. Limpe o `localStorage` do navegador (`organograma.session.v1`) ou use uma aba anônima.
2. Verifique se `SECRET_KEY` do `.env` é a mesma usada pelo backend e pelo PostgREST.
3. Recrie os containers após mudar a chave:

```powershell
docker compose up -d backend postgrest
```

## Login não funciona

- Admin: confirme `ADMIN_EMAIL`/`ADMIN_PASSWORD` no `.env`.
- Demais usuários: tente o nome completo ou o username exibido no banco.
- Verifique as contas:

```powershell
docker exec -it organograma-postgres psql -U postgres -d organograma -c "SELECT id, username, email, is_active FROM public.app_auth ORDER BY id;"
```

- Resete a senha: [05-LOGIN-E-USUARIOS.md](05-LOGIN-E-USUARIOS.md).

## Banco sem tabelas ou com schema antigo

Os scripts de `database/init/` só rodam com volume vazio. Se o volume foi criado com outra versão:

```powershell
docker compose down -v
docker compose up -d --build
```

Atenção: isso apaga os dados.

## Imagens/anexos com 404

1. Confirme que o MinIO está saudável e que os buckets existem:

```powershell
docker compose ps minio
docker exec organograma-minio sh -lc "mc alias set local http://localhost:9000 minioadmin minioadmin123 >/dev/null && mc ls local"
```

2. Confirme que o backend enxerga o storage no health:

```powershell
curl http://localhost:8000/health
```

O retorno deve conter `"storage":true`.

3. Teste direto no backend:

```powershell
curl http://localhost:8000/api/storage/public/imagens/Image.jpg
```

Se funcionar no backend e falhar na 3000, o Nginx pode estar interceptando a rota. As rotas `/api/` e `/rest/v1/` precisam estar com `^~` no `nginx.conf`.

## MinIO não sobe ou o backend fica reiniciando

```powershell
docker compose logs --tail=100 minio backend
```

- Confira `MINIO_ACCESS_KEY` e `MINIO_SECRET_KEY` no `.env` (senha com no mínimo 8 caracteres).
- O backend usa exatamente essas credenciais para criar os buckets e fazer upload.
- Se a imagem `minio/minio:latest` não estiver disponível no servidor, importe-a de outra máquina ou use um mirror interno.
- Se o volume do MinIO foi criado com outra senha, o MinIO pode recusar o login. Em ambiente de teste, recrie com `docker compose down -v`. Em produção, mantenha as credenciais originais.

## Upload falha

- O upload exige `Authorization: Bearer TOKEN`.
- Tamanho máximo: 25 MB por arquivo.
- O Nginx permite até 30 MB (`client_max_body_size`).

## Frontend reiniciando após editar `nginx.conf`

Arquivos salvos como UTF-8 com BOM quebram o Nginx (`unknown directive "﻿server"`). Salve sem BOM:

```powershell
$p = "frontend/nginx.conf"
$text = [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)
[IO.File]::WriteAllText($p, $text, (New-Object Text.UTF8Encoding($false)))
docker compose up -d --build frontend
```

## Health do backend falhando

```powershell
curl http://localhost:8000/health
docker compose logs --tail=100 backend postgres
```

Se o Postgres ainda estiver subindo, aguarde o healthcheck ou reinicie o backend.

## Ver logs do PostgREST

```powershell
docker compose logs -f postgrest
```

## Reset completo (destrutivo)

```powershell
docker compose down -v
docker compose up -d --build
```
