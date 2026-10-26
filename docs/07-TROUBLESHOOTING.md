# 🔧 Troubleshooting - Resolução de Problemas

## 🔴 Frontend não carrega

### Sintoma
Página em branco ou erro de rede ao acessar `http://ip:3000`

### Soluções

**1. Container não está rodando**
```bash
# Ver status
docker ps | grep organograma-frontend

# Se não aparecer, ver logs
docker logs organograma-frontend

# Reiniciar
docker restart organograma-frontend
```

**2. Porta em uso**
```bash
# Ver o que está usando porta 3000
netstat -tulpn | grep 3000

# Matar processo ou mudar porta no docker-compose.yml
```

**3. Build falhou**
```bash
# Refazer build localmente
cd frontend
npm install
npm run build

# Verificar se pasta dist/ foi criada
ls -la dist/
```

---

## 🔴 Backend não responde

### Sintoma
Erro 502, 504 ou "Cannot connect to backend"

### Soluções

**1. Verificar se está rodando**
```bash
docker ps | grep organograma-backend
docker logs organograma-backend --tail 50
```

**2. Banco não conectou**
```bash
# Ver se postgres está rodando
docker ps | grep organograma-postgres

# Testar conexão manualmente
docker exec organograma-postgres psql -U postgres -c "SELECT 1"
```

**3. Variáveis de ambiente erradas**
```bash
# Ver env do container
docker inspect organograma-backend | grep Env -A 20

# Verificar DATABASE_URL
# Deve ser: postgresql://postgres:senha@postgres:5432/organograma
#                                    ^^^^^^^^ nome do serviço, não localhost!
```

**4. Python dependencies faltando**
```bash
# Entrar no container
docker exec -it organograma-backend sh

# Verificar instalação
pip list

# Reinstalar
pip install -r requirements.txt
```

---

## 🔴 Login com Microsoft não funciona

### Sintoma
Erro "Redirect URI mismatch" ou "Invalid client"

### Soluções

**1. Redirect URI não cadastrado no Azure**

No Azure Portal:
1. App Registrations → Seu App
2. Authentication → Redirect URIs
3. Adicione: `http://ip-do-servidor:3000/auth/callback`
4. Salve

**2. Credenciais erradas**

Verifique no `.env` do backend:
```env
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
```

Teste se estão corretas:
```bash
# No container do backend
docker exec -it organograma-backend python -c "import os; print(os.getenv('AZURE_CLIENT_ID'))"
```

**3. CORS bloqueando**

Se erro "CORS policy", adicione no backend (`main.py`):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://ip-do-servidor:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔴 Banco de dados não inicializa

### Sintoma
Tabelas não existem, erro "relation does not exist"

### Soluções

**1. Scripts SQL não executaram**
```bash
# Verificar se scripts existem
docker exec organograma-postgres ls -la /docker-entrypoint-initdb.d/

# Se não existirem, copiar manualmente
docker cp database/init/. organograma-postgres:/docker-entrypoint-initdb.d/

# Recriar container (scripts só rodam na primeira inicialização)
docker-compose down -v
docker-compose up -d
```

**2. Executar scripts manualmente**
```bash
# Entrar no postgres
docker exec -it organograma-postgres psql -U postgres organograma

# Executar
\i /docker-entrypoint-initdb.d/01-setup.sql
\i /docker-entrypoint-initdb.d/02-posicao.sql
# ... etc
```

**3. Verificar logs de inicialização**
```bash
docker logs organograma-postgres | grep -i error
```

---

## 🔴 CORS Errors no navegador

### Sintoma
Console mostra: "has been blocked by CORS policy"

### Soluções

**1. Backend não permite origem do frontend**

No `backend/app/main.py`, adicione/verifique:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://ip-do-servidor:3000",
        "http://10.0.103.20:3000"  # IP interno exemplo
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. Frontend apontando para URL errada**

No `frontend/.env`:
```env
VITE_BACKEND_URL=http://ip-do-servidor:8000
# NÃO use localhost se for acessar de outra máquina!
```

Após mudar, refazer build:
```bash
cd frontend
npm run build
docker-compose restart frontend
```

---

## 🔴 Imagem não sobe no Portainer

### Sintoma
"Error: invalid tar header" ou "failed to build"

### Soluções

**1. TAR corrompido**
```bash
# Refazer TAR sem compressão
tar -cf organograma.tar docker-compose.yml frontend/ backend/ database/

# NÃO usar -z (gzip)
```

**2. Arquivos faltando no TAR**
```bash
# Verificar conteúdo
tar -tf organograma.tar | head -20

# Deve incluir:
# - docker-compose.yml
# - frontend/Dockerfile
# - backend/Dockerfile
# - database/init/
```

**3. Build direto no Portainer**

Ao invés de TAR, use Web Editor:
1. Stacks → Add Stack
2. Web editor
3. Cole o docker-compose.yml
4. Em "Build method", configure paths corretos

---

## 🔴 Porta 3000/8000 não acessível

### Sintoma
Funciona no servidor mas não em outras máquinas

### Soluções

**1. Firewall bloqueando**
```bash
# Linux
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# Ver portas abertas
ss -tlnp | grep -E '3000|8000'
```

**2. Docker binding errado**

No docker-compose.yml, use:
```yaml
ports:
  - "0.0.0.0:3000:80"  # Não só "3000:80"
  - "0.0.0.0:8000:8000"
```

**3. Rede corporativa**
- VPN pode bloquear
- Proxy pode interceptar
- Falar com TI para liberar portas

---

## 🔴 Performance lenta

### Sintoma
Aplicação demora muito para responder

### Soluções

**1. Recursos insuficientes**
```bash
# Ver uso de CPU/RAM
docker stats

# Se alto, alocar mais recursos no docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

**2. Queries lentas no banco**
```sql
-- Dentro do postgres
EXPLAIN ANALYZE SELECT * FROM usuarios;

-- Criar índices se necessário
CREATE INDEX idx_usuarios_email ON usuarios(email);
```

**3. Logs muito verbosos**

Reduzir nível de log no backend:
```python
# main.py
import logging
logging.basicConfig(level=logging.WARNING)  # Era DEBUG
```

---

## 🔴 Dados perdidos após restart

### Sintoma
Usuários/dados somem quando reinicia container

### Soluções

**1. Volume não configurado**

No docker-compose.yml:
```yaml
volumes:
  postgres_data:  # Deve estar declarado

services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Deve estar mapeado
```

**2. Volume deletado acidentalmente**
```bash
# Listar volumes
docker volume ls

# Se não existir, recriar
docker volume create postgres_data
```

**3. Usar volume do host (bind mount)**
```yaml
volumes:
  - /opt/organograma/database:/var/lib/postgresql/data
```

---

## 🔴 Cannot connect entre containers

### Sintoma
Backend não consegue acessar Postgres

### Soluções

**1. Network não configurada**
```bash
# Verificar
docker network ls | grep organograma

# Recriar
docker network create organograma-network
```

**2. Usar nome do serviço, não localhost**

❌ Errado:
```env
DATABASE_URL=postgresql://postgres:senha@localhost:5432/organograma
```

✅ Correto:
```env
DATABASE_URL=postgresql://postgres:senha@postgres:5432/organograma
#                                          ^^^^^^^^ nome do serviço
```

**3. Depends_on não configurado**
```yaml
services:
  backend:
    depends_on:
      - postgres  # Backend só sobe depois do postgres
```

---

## 📞 Quando pedir ajuda

Se nada resolver, colete estas informações:

```bash
# 1. Status dos containers
docker ps -a

# 2. Logs dos últimos 50 linhas
docker logs organograma-frontend --tail 50 > frontend.log
docker logs organograma-backend --tail 50 > backend.log
docker logs organograma-postgres --tail 50 > postgres.log

# 3. Versões
docker --version
docker-compose --version

# 4. docker-compose.yml (sem senhas!)
cat docker-compose.yml

# 5. Variáveis de ambiente (sem senhas!)
docker inspect organograma-backend | grep Env -A 10
```

Envie esses logs para análise.

---

## Comandos Úteis

```bash
# Ver tudo relacionado ao projeto
docker ps -a | grep organograma

# Parar tudo
docker-compose down

# Recriar tudo do zero (CUIDADO: perde dados sem volumes)
docker-compose down -v
docker-compose up -d --build

# Entrar em container
docker exec -it organograma-backend sh
docker exec -it organograma-postgres psql -U postgres organograma

# Ver uso de recursos
docker stats

# Limpar cache do Docker
docker system prune -a
```
