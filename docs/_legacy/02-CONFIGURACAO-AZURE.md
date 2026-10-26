# 🔐 Configuração do Login com Microsoft (Azure AD)

## ⚠️ APENAS DOCUMENTAÇÃO

Este arquivo é **apenas para conhecimento**. A configuração do Azure AD deve ser feita pelo administrador de TI da empresa.

## O que é?

Permite que os usuários façam login no sistema usando suas contas Microsoft corporativas (@empresa.com).

## Credenciais Necessárias

Você precisa ter um **App Registration** criado no Azure Portal com:

1. **Application (client) ID**
   - Exemplo: `12345678-1234-1234-1234-123456789abc`

2. **Client Secret** (Chave secreta)
   - Exemplo: `AbC123~XyZ789-MnO456_PqR`

3. **Directory (tenant) ID**
   - Exemplo: `87654321-4321-4321-4321-cba987654321`

4. **Redirect URI** configurada
   - Para desenvolvimento: `http://localhost:3000/auth/callback`
   - Para produção: `http://ip-do-servidor:3000/auth/callback`

## Como o Fluxo Funciona

```
1. Usuário clica em "Login com Microsoft"
   ↓
2. É redirecionado para login.microsoftonline.com
   ↓
3. Faz login com conta corporativa
   ↓
4. Azure valida e redireciona de volta com token
   ↓
5. Backend valida o token e cria sessão
   ↓
6. Usuário autenticado!
```

## Onde Configurar no Projeto

### Backend (.env do backend)
```env
AZURE_CLIENT_ID=seu-client-id-aqui
AZURE_CLIENT_SECRET=seu-client-secret-aqui
AZURE_TENANT_ID=seu-tenant-id-aqui
AZURE_REDIRECT_URI=http://ip-do-servidor:3000/auth/callback
```

### Frontend (.env do frontend)
```env
VITE_BACKEND_URL=http://ip-do-servidor:8000
VITE_AZURE_CLIENT_ID=seu-client-id-aqui
VITE_AZURE_TENANT_ID=seu-tenant-id-aqui
```

## Permissões Necessárias no Azure

No App Registration, adicione estas permissões (API permissions):
- **Microsoft Graph**:
  - `User.Read` (ler perfil do usuário)
  - `email` (ler email)
  - `openid` (autenticação OpenID)
  - `profile` (ler perfil básico)

## Links Úteis (para o Admin de TI)

- Azure Portal: https://portal.azure.com/
- Criar App Registration: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
- Documentação Microsoft: https://learn.microsoft.com/en-us/azure/active-directory/develop/

## Teste de Autenticação

Após configurar, você pode testar:

1. Acesse: `http://localhost:8000/docs` (API do backend)
2. Procure o endpoint `/auth/login`
3. Clique em "Try it out" e execute
4. Deve retornar a URL de login da Microsoft

## Fallback: Login Simples (sem Azure)

Se não tiver o Azure configurado, o sistema tem um login básico:
- Usuário: admin
- Senha: (cadastrada no banco)

Isso é apenas para testes iniciais.
