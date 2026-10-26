# 04 - API local

## Backend FastAPI

Base: `http://localhost:8000`

### POST `/api/auth/login`

```json
{
  "login": "admin@empresa.com",
  "password": "admin123"
}
```

Resposta:

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 604800,
  "user": { "id": "uuid", "email": "admin@empresa.com", "nome_usuario": "..." }
}
```

`login` aceita e-mail, username ou o nome cadastrado.

### GET `/api/auth/me`

Header: `Authorization: Bearer TOKEN`

### POST `/api/auth/logout`

Apenas confirma o encerramento local.

### Storage

Upload:

```http
POST /api/storage/{bucket}/{caminho}
Authorization: Bearer TOKEN
Content-Type: multipart/form-data
file=@arquivo
```

Download público:

```http
GET /api/storage/public/{bucket}/{caminho}
```

Buckets usados pela aplicação: `imagens`, `transacoes`, `task-attachments`.

Os objetos são gravados no MinIO (`MINIO_ENDPOINT=minio:9000`). O backend faz a ponte entre o browser e o MinIO, então as URLs públicas continuam iguais (`/api/storage/public/...`). O console do MinIO fica em http://localhost:9101.

## PostgREST

Base: `http://localhost:3001` (ou `http://localhost:3000/rest/v1` via Nginx)

Todas as requisições exigem:

```http
Authorization: Bearer TOKEN
```

Exemplos:

```bash
# listar pessoas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/user?select=id,nome_usuario,cargo&order=nome_usuario"

# filtrar
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/organograma?id_user=eq.1"

# embed
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/ind_grupo?select=*,ind_subgrupo(*,ind_indicador(*))"

# inserir
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"nome":"Novo grupo"}' \
  "http://localhost:3001/ind_grupo"

# atualizar
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Novo nome"}' \
  "http://localhost:3001/ind_grupo?id=eq.1"

# remover
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/ind_grupo?id=eq.1"
```

Operadores suportados pela aplicação: `eq`, `in`, `order`, `limit` e `select` com embeds.

## Health

```bash
curl http://localhost:8000/health
```

Resposta esperada:

```json
{ "status": "ok", "database": true }
```
