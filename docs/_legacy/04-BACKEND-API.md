# 🔌 Documentação da API Backend

## Base URL

```
Desenvolvimento: http://localhost:8000
Produção: http://ip-do-servidor:8000
```

## Documentação Interativa

Acesse `/docs` para ver a documentação Swagger interativa:
- http://localhost:8000/docs

## Autenticação

Todos os endpoints (exceto `/auth/login`) requerem token JWT no header:

```
Authorization: Bearer seu-token-jwt-aqui
```

---

## 🔐 Endpoints de Autenticação

### POST `/auth/login`

Inicia o fluxo de login com Microsoft.

**Response**:
```json
{
  "auth_url": "https://login.microsoftonline.com/..."
}
```

**Uso**: Redirecione o usuário para a `auth_url`

---

### GET `/auth/callback`

Callback após login Microsoft (chamado automaticamente).

**Query Params**:
- `code` - Código de autorização do Azure

**Response**:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "usuario@empresa.com",
    "nome": "João Silva"
  }
}
```

---

### GET `/auth/me`

Retorna dados do usuário autenticado.

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "id": 1,
  "email": "usuario@empresa.com",
  "nome": "João Silva",
  "cargo": "Desenvolvedor",
  "avatar_url": "https://..."
}
```

---

## 👥 Endpoints de Usuários

### GET `/api/usuarios`

Lista todos os usuários.

**Query Params**:
- `skip` (opcional) - Paginação, padrão: 0
- `limit` (opcional) - Limite, padrão: 100

**Response**:
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "cargo": "Desenvolvedor",
    "posicao_id": 5,
    "avatar_url": "https://...",
    "created_at": "2026-10-26T14:10:35Z"
  }
]
```

---

### GET `/api/usuarios/{id}`

Busca usuário específico.

**Response**:
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "cargo": "Desenvolvedor",
  "posicao_id": 5,
  "atribuicoes": [...],
  "indicadores": [...]
}
```

---

### POST `/api/usuarios`

Cria novo usuário.

**Body**:
```json
{
  "nome": "Maria Santos",
  "email": "maria@empresa.com",
  "cargo": "Designer",
  "posicao_id": 3
}
```

**Response**: Usuário criado com status 201

---

### PUT `/api/usuarios/{id}`

Atualiza usuário existente.

**Body** (todos campos opcionais):
```json
{
  "nome": "Maria Santos Silva",
  "cargo": "Senior Designer",
  "posicao_id": 4
}
```

---

### DELETE `/api/usuarios/{id}`

Remove usuário (soft delete).

**Response**: Status 204

---

## 📊 Endpoints de Posições

### GET `/api/posicoes`

Lista todas as posições do organograma.

**Response**:
```json
[
  {
    "id": 1,
    "titulo": "CEO",
    "posicao_pai_id": null,
    "nivel": 1,
    "ordem": 1,
    "usuarios": [...]
  }
]
```

---

### POST `/api/posicoes`

Cria nova posição.

**Body**:
```json
{
  "titulo": "Gerente de TI",
  "posicao_pai_id": 1,
  "nivel": 2,
  "ordem": 1
}
```

---

### PUT `/api/posicoes/{id}`

Atualiza posição (ex: mover no organograma).

---

### DELETE `/api/posicoes/{id}`

Remove posição.

---

## 📝 Endpoints de Atribuições

### GET `/api/atribuicoes`

Lista todas as atribuições.

**Query Params**:
- `usuario_id` (opcional) - Filtrar por usuário
- `posicao_id` (opcional) - Filtrar por posição

---

### POST `/api/atribuicoes`

Adiciona atribuição a um usuário.

**Body**:
```json
{
  "usuario_id": 1,
  "titulo": "Desenvolver API Backend",
  "descricao": "Criar endpoints REST para o sistema",
  "prioridade": "alta"
}
```

---

## 📈 Endpoints de Indicadores

### GET `/api/indicadores`

Lista indicadores/KPIs.

**Query Params**:
- `usuario_id` (opcional)
- `tipo` (opcional) - ex: "performance", "qualidade"

---

### POST `/api/indicadores`

Cria novo indicador.

**Body**:
```json
{
  "usuario_id": 1,
  "nome": "Taxa de Conclusão",
  "tipo": "performance",
  "valor_atual": 85,
  "valor_meta": 90,
  "unidade": "%"
}
```

---

## ❌ Códigos de Erro

| Código | Significado |
|--------|-------------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 204 | No Content - Sucesso sem retorno |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido/ausente |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro no servidor |

## Exemplo de Uso (JavaScript)

```javascript
// Login
const loginResponse = await fetch('http://localhost:8000/auth/login');
const { auth_url } = await loginResponse.json();
window.location.href = auth_url;

// Após callback, usar token
const token = 'eyJhbGc...';

// Buscar usuários
const response = await fetch('http://localhost:8000/api/usuarios', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const usuarios = await response.json();
```

## Testando a API

### Com cURL:
```bash
# Login
curl http://localhost:8000/auth/login

# Buscar usuários (com token)
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:8000/api/usuarios
```

### Com Thunder Client / Postman:
1. Importe a collection (se disponível)
2. Configure a variável `{{baseUrl}}` = `http://localhost:8000`
3. Configure o token JWT após login
