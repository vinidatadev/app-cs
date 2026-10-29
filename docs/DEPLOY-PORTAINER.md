# Deploy do Organograma no Portainer

Este guia documenta o processo completo para fazer deploy da aplicação Organograma no Portainer usando Docker Swarm.

## Índice
- [Pré-requisitos](#pré-requisitos)
- [Preparação dos Arquivos TAR](#preparação-dos-arquivos-tar)
- [Upload das Imagens no Portainer](#upload-das-imagens-no-portainer)
- [Build das Imagens](#build-das-imagens)
- [Deploy da Stack](#deploy-da-stack)
- [Verificação e Testes](#verificação-e-testes)
- [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

- Portainer instalado e configurado
- Docker Swarm ativo no ambiente
- Acesso ao código fonte da aplicação
- Ferramenta `tar` disponível no sistema

---

## Preparação dos Arquivos TAR

Os arquivos TAR são necessários para fazer upload do código no Portainer e construir as imagens Docker.

### 1. Backend TAR

Gera um arquivo comprimido com todo o código do backend:

```bash
tar -czf backend-code.tar.gz -C organograma/backend .
```

**O que esse comando faz:**
- `tar`: ferramenta de arquivamento
- `-c`: cria um novo arquivo
- `-z`: comprime com gzip
- `-f backend-code.tar.gz`: nome do arquivo de saída
- `-C organograma/backend`: muda para o diretório backend antes de arquivar
- `.`: inclui todos os arquivos do diretório atual

**Conteúdo incluído:**
- Código Python da API FastAPI
- Dockerfile
- requirements.txt
- Arquivo .env (com configurações)

### 2. Frontend TAR

Gera um arquivo comprimido com todo o código do frontend:

```bash
tar -czf frontend-code.tar.gz -C organograma/frontend .
```

**Conteúdo incluído:**
- Código React/Next.js
- Dockerfile
- nginx.conf
- package.json e dependências

### 3. Quando Recriar os TARs

Você precisa recriar os arquivos TAR sempre que:
- Modificar o código da aplicação
- Atualizar dependências (requirements.txt ou package.json)
- Alterar configurações do Dockerfile
- Mudar variáveis de ambiente no .env

---

## Upload das Imagens no Portainer

### Passo 1: Acessar Images

1. No menu lateral do Portainer, clique em **Images**
2. Clique no botão **Build a new image**

### Passo 2: Upload do Backend

1. **Image name:** `organograma-backend:latest`
2. **Build method:** Upload
3. **Upload:** Selecione o arquivo `backend-code.tar.gz`
4. Clique em **Build the image**
5. Aguarde a conclusão do build (pode demorar alguns minutos)

### Passo 3: Upload do Frontend

1. Repita o processo acima
2. **Image name:** `organograma-frontend:latest`
3. **Upload:** Selecione o arquivo `frontend-code.tar.gz`
4. Clique em **Build the image**

---

## Build das Imagens

O Portainer vai executar o build usando os Dockerfiles incluídos nos arquivos TAR.

### Backend Dockerfile

O Dockerfile do backend:
- Usa Python 3.12
- Instala dependências do requirements.txt
- Expõe a porta 8000
- Executa o Uvicorn

### Frontend Dockerfile

O Dockerfile do frontend:
- Usa Node.js para build
- Usa Nginx para servir os arquivos estáticos
- Expõe a porta 80

---

## Deploy da Stack

### Passo 1: Criar Nova Stack

1. No menu lateral, clique em **Stacks**
2. Clique em **+ Add stack**
3. **Name:** `organograma`
4. **Build method:** Web editor

### Passo 2: Cole o YAML

Cole o conteúdo do arquivo `deploy/portainer-stack.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: organograma
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-net

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin123}
    volumes:
      - minio_data:/data
    ports:
      - "9100:9000"
      - "9101:9001"
    networks:
      - app-net

  postgrest:
    image: postgrest/postgrest:v12.2.3
    environment:
      PGRST_DB_URI: postgres://authenticator:postgrest_local_pwd@postgres:5432/organograma
      PGRST_DB_SCHEMAS: public
      PGRST_JWT_SECRET: ${SECRET_KEY:-chave-secreta-jwt-local-minimo-32-caracteres}
      PGRST_SERVER_PORT: 3000
      PGRST_LOG_LEVEL: info
    ports:
      - "3001:3000"
    depends_on:
      - postgres
    networks:
      - app-net

  backend:
    image: organograma-backend:latest
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres123}@postgres:5432/organograma
      SECRET_KEY: ${SECRET_KEY:-chave-secreta-jwt-local-minimo-32-caracteres}
      ACCESS_TOKEN_EXPIRE_MINUTES: 10080
      CORS_ORIGINS: ${CORS_ORIGINS:-http://10.0.103.20:3000}
      MINIO_ENDPOINT: ${MINIO_ENDPOINT:-minio:9000}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin123}
      MINIO_SECURE: ${MINIO_SECURE:-false}
      MINIO_BUCKETS: imagens,transacoes,task-attachments
      SEED_ASSETS_DIR: /app/seed-assets
      SEED_ASSETS_ON_START: "false"
      ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@empresa.com}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-admin123}
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    networks:
      - app-net

  frontend:
    image: organograma-frontend:latest
    ports:
      - "3000:80"
    depends_on:
      - backend
      - postgrest
    networks:
      - app-net

volumes:
  postgres_data:
  minio_data:

networks:
  app-net:
    driver: overlay
    attachable: true
```

### Passo 3: Deploy

1. Clique em **Deploy the stack**
2. Aguarde a criação dos serviços

---

## Configuração do Banco de Dados

### Conexão ao PostgreSQL

Após o deploy, você precisa inicializar o banco:

1. No Portainer, vá em **Containers**
2. Encontre o container `organograma_postgres`
3. Clique em **Exec Console**
4. Execute:

```bash
psql -U postgres -d organograma
```

### Executar Scripts de Inicialização

Execute os scripts SQL na seguinte ordem:

```sql
-- 1. Criar o schema
\i /caminho/para/01-schema.sql

-- 2. Popular dados iniciais
\i /caminho/para/02-seed.sql

-- 3. Configurar permissões
\i /caminho/para/99-grants.sql
```

**Ou copie os scripts via Portainer:**

1. Vá em **Containers** > `organograma_postgres`
2. Clique em **Console**
3. Cole o conteúdo de cada script SQL manualmente

---

## Verificação e Testes

### 1. Verificar Status dos Serviços

No Portainer, vá em **Stacks** > **organograma**:
- Todos os serviços devem estar com status "running"
- Verifique os logs se algum estiver com erro

### 2. Testar Backend

```bash
curl http://10.0.103.20:8000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "database": true,
  "storage": false
}
```

### 3. Testar PostgREST

```bash
curl http://10.0.103.20:3001/
```

### 4. Acessar Frontend

Abra no navegador: `http://10.0.103.20:3000`

### 5. Testar Login

Credenciais padrão:
- **Username:** `admin`
- **Password:** `admin123`

---

## Solução de Problemas

### Problema: Erro de Rede "cannot be used with services"

**Causa:** Docker Swarm requer redes do tipo `overlay`, não `bridge`.

**Solução:**
1. Remova a stack antiga
2. Vá em **Networks** e delete redes antigas tipo `bridge`
3. Use o YAML atualizado com `driver: overlay`

### Problema: Backend não inicia - tentando conectar ao MinIO

**Causa:** O backend tenta conectar ao MinIO no startup mesmo quando não é necessário.

**Solução:** 
- Certifique-se que `SEED_ASSETS_ON_START: "false"` está configurado
- O código foi modificado para pular a verificação do MinIO quando seed está desabilitado

### Problema: Erro "Failed to resolve 'postgres'"

**Causa:** Containers não conseguem se comunicar pela rede overlay.

**Solução:**
- Verifique que todos os serviços estão na mesma rede (`app-net`)
- Certifique-se que a rede tem `attachable: true`

### Problema: Imagem não encontrada

**Causa:** A imagem não foi construída ou tem nome diferente.

**Solução:**
1. Vá em **Images** e verifique os nomes exatos
2. Reconstrua as imagens se necessário
3. Use exatamente os mesmos nomes no YAML da stack

---

## Estrutura de Rede

```
app-net (overlay)
├── postgres:5432
├── minio:9000
├── postgrest:3000
├── backend:8000
└── frontend:80
```

Os serviços se comunicam usando os nomes dos containers como hostnames.

---

## Portas Expostas

| Serviço   | Porta Interna | Porta Externa | Descrição              |
|-----------|---------------|---------------|------------------------|
| Frontend  | 80            | 3000          | Interface React        |
| Backend   | 8000          | 8000          | API FastAPI            |
| PostgREST | 3000          | 3001          | API REST do PostgreSQL |
| Postgres  | 5432          | 5432          | Banco de dados         |
| MinIO     | 9000          | 9100          | Storage S3             |
| MinIO UI  | 9001          | 9101          | Console do MinIO       |

---

## Variáveis de Ambiente Importantes

### Backend

- `DATABASE_URL`: String de conexão com PostgreSQL
- `SECRET_KEY`: Chave para assinar JWTs (mínimo 32 caracteres)
- `CORS_ORIGINS`: Lista de origens permitidas (separadas por vírgula)
- `SEED_ASSETS_ON_START`: `"false"` para desabilitar MinIO no startup
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`: Credenciais do admin

### PostgREST

- `PGRST_DB_URI`: String de conexão usando o usuário `authenticator`
- `PGRST_JWT_SECRET`: Deve ser igual ao `SECRET_KEY` do backend

---

## Atualização da Aplicação

Quando precisar atualizar o código:

1. **Gere novos TARs:**
   ```bash
   tar -czf backend-code.tar.gz -C organograma/backend .
   tar -czf frontend-code.tar.gz -C organograma/frontend .
   ```

2. **Reconstrua as imagens no Portainer:**
   - Images > Build a new image
   - Use o mesmo nome (vai sobrescrever)

3. **Atualize a stack:**
   - Stacks > organograma > Editor
   - Clique em **Update the stack**
   - Ou delete e recrie a stack

---

## Backup

### Banco de Dados

```bash
docker exec organograma_postgres pg_dump -U postgres organograma > backup.sql
```

### Volumes

Os dados persistentes estão nos volumes:
- `postgres_data`: dados do PostgreSQL
- `minio_data`: arquivos do MinIO

Para backup, use:
```bash
docker run --rm -v organograma_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

---

## Limpeza

Para remover completamente a stack:

1. **Remover a stack:**
   - Stacks > organograma > Delete

2. **Remover volumes (CUIDADO: apaga dados):**
   - Volumes > selecione `organograma_postgres_data` e `organograma_minio_data`
   - Clique em Remove

3. **Remover imagens:**
   - Images > selecione as imagens do organograma
   - Clique em Remove

4. **Remover rede:**
   - Networks > `organograma_app-net`
   - Remove

---

## Modificações Importantes Realizadas

### 1. Arquivo `backend/app/api/storage.py`

Modificada a função `ensure_storage()` para não tentar conectar ao MinIO quando `SEED_ASSETS_ON_START=false`:

```python
def ensure_storage() -> None:
    # Se não há buckets configurados ou não é para fazer seed, pula a verificação do MinIO
    buckets = configured_buckets()
    if not buckets or not settings.SEED_ASSETS_ON_START:
        logger.info("Inicialização do MinIO desabilitada (SEED_ASSETS_ON_START=%s)", settings.SEED_ASSETS_ON_START)
        return
    
    # ... resto do código
```

### 2. Arquivo `deploy/portainer-stack.yml`

- Alterada rede de `bridge` para `overlay` (requerido pelo Docker Swarm)
- Adicionado `attachable: true` na definição da rede
- Configurado `SEED_ASSETS_ON_START: "false"` no backend

### 3. Arquivo `backend/.env`

Adicionadas variáveis de ambiente do MinIO e admin:
- `SEED_ASSETS_ON_START=false`
- `MINIO_*` variáveis de configuração
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`

---

## Contato e Suporte

Para problemas ou dúvidas:
1. Verifique os logs dos containers no Portainer
2. Consulte a seção de Solução de Problemas deste documento
3. Verifique o arquivo `COMECE-AQUI.md` para informações gerais do projeto

---

**Última atualização:** 29/10/2026
