# 🚀 Guia Completo de Deploy - Organograma

## ✅ O que foi feito

O projeto foi **completamente reestruturado** para rodar localmente no servidor da empresa:

### Estrutura Nova (3 camadas):
```
organograma/
├── frontend/           # React + Nginx (porta 3000)
├── backend/            # Python/FastAPI (porta 8000)  
├── database/           # PostgreSQL (porta 5432 - interna)
└── docs/               # Documentação completa
```

### O que mudou:
- ❌ **REMOVIDO**: Supabase externo (bloqueado por CORS/firewall)
- ✅ **ADICIONADO**: PostgreSQL local
- ✅ **ADICIONADO**: API Python/FastAPI
- ✅ **MANTIDO**: Frontend React (sem alterações grandes)
- ✅ **PREPARADO**: Login Microsoft Azure AD

---

## 📦 Testando Localmente (na sua máquina)

### 1. Certifique-se que Docker está rodando
```bash
docker --version
docker-compose --version
```

### 2. Suba tudo
```bash
cd organograma
docker-compose up -d
```

### 3. Acompanhe os logs
```bash
docker-compose logs -f
```

### 4. Aguarde ~2 minutos

O sistema vai:
- Criar o banco PostgreSQL
- Executar scripts SQL automaticamente
- Subir o backend Python
- Buildar e subir o frontend

### 5. Teste

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

### 6. Login inicial

- Usuário: `admin@empresa.com`
- Senha: `admin123`

---

## 🎯 Deploy no Portainer (Servidor da Empresa)

### Preparação (na sua máquina):

#### 1. Criar TAR para upload
```bash
cd organograma

# Criar arquivo TAR com tudo
tar -cf organograma-deploy.tar \
  docker-compose.yml \
  frontend/ \
  backend/ \
  database/ \
  .env

# Verificar tamanho
ls -lh organograma-deploy.tar
```

### No Portainer:

#### 2. Upload da Stack

1. Acesse Portainer: `http://ip-do-servidor:9000`
2. Vá em **Stacks** → **Add Stack**
3. Nome: `organograma`
4. Build method: **Upload**
5. Selecione o arquivo `organograma-deploy.tar`
6. **Environment variables** (adicione):
   ```
   POSTGRES_PASSWORD=senha_segura_produção
   SECRET_KEY=chave-jwt-super-secreta-produção-32-chars
   CORS_ORIGINS=http://10.0.103.20:3000,http://ip-do-servidor:3000
   ```
7. Clique em **Deploy the stack**

#### 3. Aguarde o build (5-10 min)

O Portainer vai baixar imagens e fazer build.

#### 4. Verifique

- Em **Stacks** → `organograma`, veja os 3 containers:
  - ✅ organograma-frontend
  - ✅ organograma-backend
  - ✅ organograma-postgres

- Teste no navegador:
  - Frontend: `http://ip-do-servidor:3000`
  - API: `http://ip-do-servidor:8000/docs`

---

## 🔐 Configurar Login Microsoft (OPCIONAL)

### O que você precisa:

Do Admin de TI, pegue:
1. **Client ID** do App Registration do Azure
2. **Client Secret** (chave)
3. **Tenant ID** da empresa

### Onde configurar:

No Portainer, edite a Stack e adicione:
```yaml
environment:
  AZURE_CLIENT_ID: "seu-client-id"
  AZURE_CLIENT_SECRET: "seu-secret"
  AZURE_TENANT_ID: "seu-tenant-id"
  AZURE_REDIRECT_URI: "http://ip-do-servidor:3000/auth/callback"
```

Depois: **Update the stack**

### No Azure Portal (pedir para TI):

Adicione estas **Redirect URIs**:
- `http://localhost:3000/auth/callback` (dev)
- `http://ip-do-servidor:3000/auth/callback` (produção)

---

## 🗄️ Banco de Dados

### Estrutura criada automaticamente:

✅ Tabela `usuarios`  
✅ Tabela `posicoes` (organograma)  
✅ Tabela `atribuicoes` (responsabilidades)  
✅ Tabela `indicadores` (KPIs)  
✅ Tabela `cursos` (treinamentos)  
✅ Views auxiliares  
✅ Usuário admin inicial

### Acessar o banco:

```bash
# Via Portainer Console ou SSH
docker exec -it organograma-postgres psql -U postgres organograma

# Comandos úteis:
\dt              # Ver tabelas
\d usuarios      # Ver estrutura da tabela usuarios
SELECT * FROM usuarios;
```

### Backup:

```bash
docker exec organograma-postgres pg_dump -U postgres organograma > backup.sql
```

---

## 📊 Arquivos Importantes

### Configurações:
- `docker-compose.yml` - Orquestração dos serviços
- `.env` - Variáveis de ambiente (IMPORTANTE!)
- `frontend/.env` - Config do frontend
- `backend/.env` - Config do backend

### Documentação:
- `README.md` - Visão geral
- `docs/00-LEIA-ME-PRIMEIRO.md` - Guia inicial
- `docs/06-DEPLOY-PORTAINER.md` - Deploy detalhado
- `docs/07-TROUBLESHOOTING.md` - Problemas comuns

---

## ⚠️ IMPORTANTE - Antes do Deploy

### 1. Altere as senhas padrão!

No arquivo `.env`:
```env
POSTGRES_PASSWORD=MUDE_ISTO_PARA_SENHA_SEGURA
SECRET_KEY=MUDE_ISTO_PARA_CHAVE_ALEATORIA_32_CHARS
```

### 2. Configure os IPs corretos

No `CORS_ORIGINS`, adicione todos os IPs que vão acessar:
```env
CORS_ORIGINS=http://10.0.103.20:3000,http://192.168.1.100:3000
```

### 3. Firewall do servidor

Libere as portas:
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
```

---

## 🧹 Arquivos que podem ser deletados

Após testar tudo funcionando, você pode remover:

### Arquivos antigos (do Supabase):
- `organograma-portainer.zip`
- `organograma-dist.zip`
- `organograma-build.zip`
- `organograma.tar`
- `organograma-portainer.tar`
- `build-imagem.bat`
- `docker-build.sh`
- `DEPLOY_PORTAINER.md` (antigo)
- `DEPLOY_MANUAL_PORTAINER.md` (antigo)
- `INSTRUCOES_PORTAINER.txt` (antigo)
- `vercel.json`

### Arquivos SQL antigos do Supabase:
Os arquivos `supabase_*.sql` em `database/init/` foram reorganizados.  
Os antigos podem ser mantidos como referência ou deletados.

---

## 🆘 Problemas Comuns

### "Cannot connect to backend"
- Verifique se o container backend está rodando
- Teste: `curl http://localhost:8000/health`
- Veja logs: `docker logs organograma-backend`

### "Database connection failed"
- Verifique se postgres está rodando
- Teste: `docker exec organograma-postgres psql -U postgres -c "SELECT 1"`

### "CORS error"
- Adicione o IP no `.env` em `CORS_ORIGINS`
- Reinicie o backend: `docker-compose restart backend`

### Mais problemas?
Veja: **docs/07-TROUBLESHOOTING.md**

---

## 📞 Contato

Para suporte, consulte:
1. **docs/07-TROUBLESHOOTING.md** - Problemas e soluções
2. **docs/04-BACKEND-API.md** - Documentação da API
3. **docs/05-BANCO-DE-DADOS.md** - Estrutura do banco

---

**✅ Projeto pronto para deploy!**

Teste localmente primeiro, depois suba no Portainer seguindo este guia.
