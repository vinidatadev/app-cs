# API de Gerenciamento de Usuários

Endpoints para gerenciamento completo de usuários. **Acesso restrito a administradores (nivel=2)**.

## 🔐 Autenticação

Todos os endpoints requerem:
```
Authorization: Bearer {token}
```

E o usuário deve ter `nivel = 2` (admin).

---

## 📋 Endpoints Disponíveis

### 1. Listar Todos os Usuários

```http
GET /api/users
```

**Response 200:**
```json
{
  "users": [
    {
      "id": 1,
      "id_user": "uuid-aqui",
      "nome_usuario": "João Silva",
      "cargo": "Desenvolvedor",
      "setor": "TI",
      "nivel": 1,
      "foto": "imagens/perfil/joao.jpg",
      "created_at": "2026-10-29T10:00:00",
      "username": "joao.silva",
      "email": "joao@empresa.com",
      "is_active": true
    }
  ]
}
```

---

### 2. Buscar Usuário Específico

```http
GET /api/users/{user_id}
```

**Exemplo:**
```bash
curl http://IP:8000/api/users/5 \
  -H "Authorization: Bearer {token}"
```

**Response 200:**
```json
{
  "id": 5,
  "id_user": "uuid-aqui",
  "nome_usuario": "Maria Santos",
  "cargo": "Gerente",
  "setor": "RH",
  "nivel": 2,
  "foto": null,
  "created_at": "2026-10-29T10:00:00",
  "username": "maria.santos",
  "email": "maria@empresa.com",
  "is_active": true
}
```

**Response 404:**
```json
{
  "detail": "Usuário não encontrado"
}
```

---

### 3. Criar Novo Usuário

```http
POST /api/users
```

**Request Body:**
```json
{
  "nome_usuario": "Pedro Oliveira",
  "cargo": "Analista",
  "setor": "Financeiro",
  "nivel": 1,
  "username": "pedro.oliveira",
  "email": "pedro@empresa.com",
  "password": "senha123"
}
```

**Validações:**
- `nome_usuario`: obrigatório, mínimo 1 caractere
- `cargo`: obrigatório, mínimo 1 caractere
- `setor`: opcional
- `nivel`: 1 (usuário) ou 2 (admin), padrão 1
- `username`: obrigatório, mínimo 3 caracteres, apenas letras minúsculas, números, ponto, hífen e underscore
- `email`: obrigatório, formato email válido
- `password`: obrigatório, mínimo 6 caracteres

**Response 200:**
```json
{
  "id": 10,
  "id_user": "novo-uuid",
  "message": "Usuário criado com sucesso",
  "username": "pedro.oliveira"
}
```

**Response 400:**
```json
{
  "detail": "Username 'pedro.oliveira' já está em uso"
}
```

---

### 4. Atualizar Usuário

```http
PUT /api/users/{user_id}
```

**Request Body (todos os campos são opcionais):**
```json
{
  "nome_usuario": "Pedro Oliveira Santos",
  "cargo": "Analista Sênior",
  "setor": "Financeiro",
  "nivel": 2,
  "email": "pedro.santos@empresa.com",
  "password": "novaSenha123",
  "is_active": true
}
```

**Response 200:**
```json
{
  "message": "Usuário atualizado com sucesso"
}
```

**Regras:**
- Admin não pode remover seu próprio nível de admin
- Admin não pode desativar sua própria conta
- Email deve ser único

---

### 5. Deletar Usuário

```http
DELETE /api/users/{user_id}
```

**Response 200:**
```json
{
  "message": "Usuário deletado com sucesso"
}
```

**Response 400:**
```json
{
  "detail": "Você não pode deletar sua própria conta"
}
```

**Observação:** A deleção é em CASCADE, remove também:
- Registro em `app_auth`
- Atribuições
- Cursos
- Relacionamentos no organograma

---

### 6. Trocar Senha de Usuário

```http
POST /api/users/{user_id}/password
```

**Request Body:**
```json
{
  "password": "novaSenhaSegura123"
}
```

**Response 200:**
```json
{
  "message": "Senha alterada com sucesso"
}
```

---

### 7. Ativar Usuário

```http
POST /api/users/{user_id}/activate
```

**Response 200:**
```json
{
  "message": "Usuário ativado com sucesso"
}
```

---

### 8. Desativar Usuário

```http
POST /api/users/{user_id}/deactivate
```

**Response 200:**
```json
{
  "message": "Usuário desativado com sucesso"
}
```

**Response 400:**
```json
{
  "detail": "Você não pode desativar sua própria conta"
}
```

---

## 🔒 Segurança

### Permissões

- Todos os endpoints requerem `nivel = 2` (administrador)
- Response 403 se usuário não for admin:
```json
{
  "detail": "Acesso negado. Apenas administradores podem gerenciar usuários."
}
```

### Proteções Implementadas

1. **Admin não pode se auto-remover:**
   - Não pode deletar própria conta
   - Não pode remover próprio nível de admin
   - Não pode desativar própria conta

2. **Username e Email únicos:**
   - Validação case-insensitive
   - Retorna erro 400 se já existir

3. **Senha criptografada:**
   - Usa bcrypt via `pgcrypto`
   - Nunca retorna senha na API

---

## 💡 Exemplos de Uso

### Criar Novo Colaborador

```bash
# 1. Login como admin
TOKEN=$(curl -X POST http://IP:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# 2. Criar usuário
curl -X POST http://IP:8000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_usuario": "Ana Costa",
    "cargo": "Designer",
    "setor": "Marketing",
    "nivel": 1,
    "username": "ana.costa",
    "email": "ana@empresa.com",
    "password": "senha123"
  }'
```

### Promover Usuário a Admin

```bash
curl -X PUT http://IP:8000/api/users/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nivel": 2}'
```

### Resetar Senha de Usuário

```bash
curl -X POST http://IP:8000/api/users/5/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "novaSenha123"}'
```

### Desativar Usuário

```bash
curl -X POST http://IP:8000/api/users/5/deactivate \
  -H "Authorization: Bearer $TOKEN"
```

### Listar Todos os Usuários

```bash
curl http://IP:8000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.users'
```

---

## 🎯 Integração com Frontend

### Exemplo React/JavaScript

```javascript
// API Client
const API_URL = 'http://IP:8000';

async function createUser(userData) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  return response.json();
}

// Uso
try {
  const newUser = await createUser({
    nome_usuario: 'Carlos Lima',
    cargo: 'Desenvolvedor',
    setor: 'TI',
    nivel: 1,
    username: 'carlos.lima',
    email: 'carlos@empresa.com',
    password: 'senha123'
  });
  console.log('Usuário criado:', newUser);
} catch (error) {
  console.error('Erro:', error.message);
}
```

### Formulário de Criação

```jsx
function UserCreateForm() {
  const [form, setForm] = useState({
    nome_usuario: '',
    cargo: '',
    setor: '',
    nivel: 1,
    username: '',
    email: '',
    password: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      alert('Usuário criado com sucesso!');
      // Redirecionar ou limpar formulário
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text"
        placeholder="Nome completo"
        value={form.nome_usuario}
        onChange={(e) => setForm({...form, nome_usuario: e.target.value})}
        required
      />
      <input 
        type="text"
        placeholder="Cargo"
        value={form.cargo}
        onChange={(e) => setForm({...form, cargo: e.target.value})}
        required
      />
      <input 
        type="text"
        placeholder="Setor"
        value={form.setor}
        onChange={(e) => setForm({...form, setor: e.target.value})}
      />
      <select 
        value={form.nivel}
        onChange={(e) => setForm({...form, nivel: parseInt(e.target.value)})}
      >
        <option value="1">Usuário</option>
        <option value="2">Administrador</option>
      </select>
      <input 
        type="text"
        placeholder="Username (login)"
        value={form.username}
        onChange={(e) => setForm({...form, username: e.target.value})}
        required
      />
      <input 
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({...form, email: e.target.value})}
        required
      />
      <input 
        type="password"
        placeholder="Senha"
        value={form.password}
        onChange={(e) => setForm({...form, password: e.target.value})}
        required
        minLength="6"
      />
      <button type="submit">Criar Usuário</button>
    </form>
  );
}
```

---

## 📊 Campos Importantes

### Nível (nivel)

- `1`: Usuário comum (pode fazer login, ver organograma, atualizar própria foto)
- `2`: Administrador (pode tudo + gerenciar usuários)

### Status (is_active)

- `true`: Usuário pode fazer login
- `false`: Usuário não pode fazer login (conta desativada)

### Foto (foto)

- Campo opcional, armazenado como path do MinIO
- Exemplo: `"imagens/perfil/uuid.jpg"`
- Usuário pode atualizar própria foto via endpoint de storage

---

## 🔄 Fluxo Completo

```
1. Admin faz login
   POST /api/auth/login

2. Admin cria novo usuário
   POST /api/users
   - Define: nome, cargo, setor, username, email, senha
   - Nível padrão: 1 (usuário comum)

3. Usuário recebe credenciais
   - Username: {username}
   - Senha: definida pelo admin

4. Usuário faz login
   POST /api/auth/login

5. Usuário atualiza própria foto (opcional)
   POST /api/storage/imagens/perfil/{id_user}.jpg

6. Admin pode:
   - Trocar senha: POST /api/users/{id}/password
   - Promover a admin: PUT /api/users/{id} {"nivel": 2}
   - Desativar: POST /api/users/{id}/deactivate
   - Deletar: DELETE /api/users/{id}
```

---

**Última atualização:** 29/10/2026
