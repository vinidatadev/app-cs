# 🚀 Deploy no Portainer - Guia Completo

## Pré-requisitos

- [x] Docker instalado no servidor
- [x] Portainer rodando e acessível
- [x] Arquivos do projeto organizados
- [x] Variáveis de ambiente configuradas

---

## Método 1: Via Docker Compose (RECOMENDADO)

### Passo 1: Preparar os arquivos

Na sua máquina local:

```bash
cd organograma

# Criar build do frontend
cd frontend
npm install
npm run build
cd ..

# Criar TAR com tudo necessário
tar -cf organograma-completo.tar \
  docker-compose.yml \
  frontend/ \
  backend/ \
  database/ \
  .env
```

### Passo 2: No Portainer

1. Acesse o Portainer: `http://ip-do-servidor:9000`
2. Vá em **Stacks** → **Add Stack**
3. Nome: `organograma`
4. Método: **Upload**
5. Faça upload do `organograma-completo.tar`
6. Clique em **Deploy the stack**

### Passo 3: Aguardar

O Portainer vai:
- Fazer pull das imagens base (postgres, python, nginx)
- Fazer build do frontend e backend
- Criar os containers
- Inicializar o banco de dados

Tempo estimado: **5-10 minutos**

### Passo 4: Verificar

1. Em **Stacks**, clique em `organograma`
2. Veja os 3 serviços:
   - ✅ `organograma-frontend` (porta 3000)
   - ✅ `organograma-backend` (porta 8000)
   - ✅ `organograma-postgres` (interna)

3. Teste:
   - Frontend: `http://ip-do-servidor:3000`
   - Backend API: `http://ip-do-servidor:8000/docs`

---

## Método 2: Build Local + Upload de Imagens

Se preferir fazer o build na sua máquina (mais rápido no servidor):

### Passo 1: Build local

```bash
# Build frontend
cd frontend
docker build -t organograma-frontend:latest .
docker save organograma-frontend:latest -o frontend-image.tar

# Build backend
cd ../backend
docker build -t organograma-backend:latest .
docker save organograma-backend:latest -o backend-image.tar
```

### Passo 2: Upload no Portainer

1. **Images** → **Import**
2. Upload `frontend-image.tar`
3. Upload `backend-image.tar`

### Passo 3: Criar Stack manualmente

1. **Stacks** → **Add Stack**
2. Nome: `organograma`
3. **Web editor**
4. Cole o docker-compose.yml (veja abaixo)
5. Deploy

**docker-compose.yml para uso com imagens já importadas:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: organograma-postgres
    environment:
      POSTGRES_DB: organograma
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-senha_segura_aqui}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - organograma-network
    restart: unless-stopped

  backend:
    image: organograma-backend:latest
    container_name: organograma-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-senha_segura_aqui}@postgres:5432/organograma
      SECRET_KEY: ${SECRET_KEY:-chave-jwt-super-secreta}
      AZURE_CLIENT_ID: ${AZURE_CLIENT_ID}
      AZURE_CLIENT_SECRET: ${AZURE_CLIENT_SECRET}
      AZURE_TENANT_ID: ${AZURE_TENANT_ID}
    depends_on:
      - postgres
    networks:
      - organograma-network
    restart: unless-stopped

  frontend:
    image: organograma-frontend:latest
    container_name: organograma-frontend
    ports:
      - "3000:80"
    networks:
      - organograma-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  organograma-network:
    driver: bridge
```

---

## Método 3: Container Individual (Mais Trabalhoso)

Se os métodos acima não funcionarem:

### 1. Postgres
```bash
docker run -d \
  --name organograma-postgres \
  -e POSTGRES_DB=organograma \
  -e POSTGRES_PASSWORD=senha_segura \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. Backend
```bash
docker run -d \
  --name organograma-backend \
  --link organograma-postgres:postgres \
  -e DATABASE_URL=postgresql://postgres:senha_segura@postgres:5432/organograma \
  -p 8000:8000 \
  organograma-backend:latest
```

### 3. Frontend
```bash
docker run -d \
  --name organograma-frontend \
  -p 3000:80 \
  organograma-frontend:latest
```

---

## Configurações de Rede

### Firewall do Servidor

Libere as portas:
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --reload
```

### Acessando de outras máquinas

Se usuários de outros computadores não conseguirem acessar:

1. Verifique o IP do servidor: `ip addr show`
2. Teste ping: `ping ip-do-servidor`
3. Teste porta: `telnet ip-do-servidor 3000`
4. Verifique firewall corporativo

---

## Atualização da Aplicação

### Atualizar Frontend

```bash
# 1. Fazer novo build local
cd frontend
npm run build

# 2. Criar nova imagem
docker build -t organograma-frontend:v2 .
docker save organograma-frontend:v2 -o frontend-v2.tar

# 3. No Portainer: Import nova imagem

# 4. Editar Stack e trocar tag da imagem
# De: organograma-frontend:latest
# Para: organograma-frontend:v2

# 5. Update the stack
```

### Atualizar Backend

Similar ao frontend, mas para a pasta `backend/`

---

## Backup e Restore

### Backup do Banco

```bash
# Pelo Portainer Console (ou SSH):
docker exec organograma-postgres pg_dump -U postgres organograma > backup.sql

# Download do backup via Portainer:
# Containers > organograma-postgres > Console
# Executar comando acima
# Containers > organograma-postgres > Files
# Baixar o arquivo backup.sql
```

### Restore do Banco

```bash
# Upload do backup.sql para o servidor
# No Portainer Console:
docker exec -i organograma-postgres psql -U postgres organograma < backup.sql
```

---

## Monitoramento

### Ver logs em tempo real

No Portainer:
1. **Containers** → Selecione o container
2. **Logs**
3. Ative "Auto-refresh logs"

### Ver uso de recursos

1. **Containers** → Selecione o container
2. **Stats** - CPU, Memória, Rede

### Health Check

Adicione ao docker-compose.yml:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Troubleshooting Rápido

### Container não inicia
- Veja os logs no Portainer
- Verifique variáveis de ambiente
- Verifique se portas não estão em uso

### Banco não conecta
- Verifique se container postgres está rodando
- Verifique DATABASE_URL no backend
- Teste conexão: `docker exec organograma-postgres psql -U postgres -c "SELECT 1"`

### Frontend não carrega
- Verifique se backend está acessível
- Veja o console do navegador (F12)
- Verifique VITE_BACKEND_URL no .env do frontend

---

## Checklist Final

Antes de considerar deploy concluído:

- [ ] Frontend acessível na porta 3000
- [ ] Backend/API respondendo na porta 8000
- [ ] Documentação da API em /docs funcionando
- [ ] Login com Microsoft funcionando
- [ ] Banco de dados populado
- [ ] Logs sem erros críticos
- [ ] Backup automático configurado
- [ ] Usuários conseguem acessar de outras máquinas

---

## Suporte

Se encontrar problemas, veja **07-TROUBLESHOOTING.md**
