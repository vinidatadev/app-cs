# 📝 Resumo das Alterações - Migração Supabase → Local

## O que foi alterado?

### ❌ Removido (Supabase/Vercel)

1. **Dependência do Supabase**
   - Antes: `@supabase/supabase-js` conectava ao Supabase externo
   - Agora: Removida dependência, API local substituiu

2. **Deploy Vercel**
   - Antes: Frontend deployado na Vercel via GitHub
   - Agora: Frontend em container Docker local

3. **Configuração Supabase**
   - Arquivos: `src/supabase.js` (frontend)
   - Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`

### ✅ Adicionado (Arquitetura Local)

1. **Backend Python/FastAPI** (`backend/`)
   - Framework: FastAPI
   - ORM: SQLAlchemy  
   - Auth: JWT + Microsoft Azure AD
   - API REST completa documentada em `/docs`

2. **Banco PostgreSQL** (`database/`)
   - Postgres 15 em container
   - Scripts SQL organizados em `database/init/`
   - Inicialização automática das tabelas

3. **Docker Compose**
   - Orquestração de 3 serviços
   - Rede interna entre containers
   - Volumes persistentes

4. **Documentação** (`docs/`)
   - 8 arquivos markdown completos
   - Guias passo a passo
   - Troubleshooting

---

## Estrutura de Pastas

### ANTES:
```
organograma/
├── src/
├── index.html
├── package.json
├── vite.config.js
└── supabase_*.sql  (soltos na raiz)
```

### AGORA:
```
organograma/
├── frontend/          # Frontend isolado
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── backend/           # Backend novo
│   ├── app/
│   │   ├── api/      # Rotas
│   │   ├── core/     # Config, DB, Security
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── database/          # Scripts SQL organizados
│   └── init/
│       ├── 01-setup.sql
│       ├── 02-posicoes.sql
│       ├── 03-usuarios.sql
│       └── ...
│
├── docs/              # Documentação
│   ├── 00-LEIA-ME-PRIMEIRO.md
│   ├── 01-REQUISITOS.md
│   └── ...
│
├── docker-compose.yml # Orquestração
├── .env              # Variáveis centralizadas
└── README.md         # Guia principal
```

---

## Arquivos do Frontend que MUDARAM

### `frontend/src/supabase.js`
**ANTES**: Conectava ao Supabase
```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_KEY)
```

**AGORA**: Deve ser substituído por chamadas à API local
```javascript
// Ao invés de:
const { data } = await supabase.from('usuarios').select()

// Usar:
const response = await fetch(`${VITE_BACKEND_URL}/api/usuarios`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
const data = await response.json()
```

### `frontend/.env`
**ANTES**:
```env
VITE_SUPABASE_URL=https://kztzrejrhpsefvpugynq.supabase.co
VITE_SUPABASE_KEY=eyJhbGc...
```

**AGORA**:
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_AZURE_CLIENT_ID=...
VITE_AZURE_TENANT_ID=...
```

---

## Como o Frontend deve se comunicar agora

### Exemplo: Buscar usuários

**ANTES (Supabase)**:
```javascript
import { supabase } from './supabase'

const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
  return data
}
```

**AGORA (API Local)**:
```javascript
const fetchUsers = async () => {
  const token = localStorage.getItem('token')
  
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Erro ao buscar usuários')
  }
  
  return await response.json()
}
```

---

## Tabelas do Banco

### Mapeamento Supabase → PostgreSQL Local

| Tabela Antiga (Supabase) | Tabela Nova (Local) | Status |
|--------------------------|---------------------|--------|
| `user` | `usuarios` | ✅ Migrada |
| `organograma` | `posicoes` | ✅ Reorganizada |
| `atribuicoes` | `atribuicoes` | ✅ Mantida |
| `indicadores` | `indicadores` | ✅ Mantida |
| `cursos` | `cursos` | ✅ Mantida |
| - | `usuarios_cursos` | ✅ Nova (N:N) |

---

## Autenticação

### ANTES (Supabase Auth):
```javascript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'azure'
})
```

### AGORA (API + Azure AD):

**1. Frontend pede URL de login:**
```javascript
const response = await fetch(`${VITE_BACKEND_URL}/auth/login`)
const { auth_url } = await response.json()
window.location.href = auth_url  // Redireciona para Microsoft
```

**2. Após callback, recebe token JWT:**
```javascript
// Backend valida e retorna
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": { "email": "...", "nome": "..." }
}

// Salvar token
localStorage.setItem('token', access_token)
```

**3. Usar token em todas as requisições:**
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## Deploy

### ANTES:
```
Código → GitHub → Vercel (automático)
```

### AGORA:
```
Código → Build local → TAR → Upload Portainer → Deploy
```

**Comando**:
```bash
docker-compose up -d
```

---

## Portas

| Serviço | Porta | Acesso |
|---------|-------|--------|
| Frontend | 3000 | Público |
| Backend | 8000 | Público |
| Postgres | 5432 | Interno apenas |

---

## Checklist de Migração do Código Frontend

Se precisar adaptar o código existente:

- [ ] Remover importações do `@supabase/supabase-js`
- [ ] Substituir `supabase.from()` por `fetch()` da API
- [ ] Atualizar autenticação para usar `/auth/login`
- [ ] Trocar `VITE_SUPABASE_URL` por `VITE_BACKEND_URL`
- [ ] Adicionar header `Authorization: Bearer {token}`
- [ ] Tratar erros HTTP (antes eram `.error` do Supabase)
- [ ] Atualizar referências a `auth.user()` para contexto local

---

## Variáveis de Ambiente

### Frontend (.env)
```env
# Antes
VITE_SUPABASE_URL=...
VITE_SUPABASE_KEY=...

# Agora
VITE_BACKEND_URL=http://localhost:8000
VITE_AZURE_CLIENT_ID=...
```

### Backend (novo)
```env
DATABASE_URL=postgresql://...
SECRET_KEY=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
```

---

## Benefícios da Nova Arquitetura

✅ **Independência**: Não depende de serviços externos  
✅ **Performance**: Tudo na rede local  
✅ **Segurança**: Dados não saem do servidor  
✅ **Controle**: Full control sobre banco e API  
✅ **Custo**: Sem mensalidades de SaaS  
✅ **Firewall**: Não é bloqueado pela rede corporativa  

---

## Próximos Passos

1. ✅ Estrutura criada
2. ⏳ Testar localmente com `docker-compose up`
3. ⏳ Adaptar chamadas do frontend (se necessário)
4. ⏳ Configurar Azure AD para login Microsoft
5. ⏳ Deploy no Portainer (servidor da empresa)

---

**Data**: Outubro 2026  
**Status**: ✅ Pronto para testes locais
