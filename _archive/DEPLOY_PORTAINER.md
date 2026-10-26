# Deploy no Portainer - Organograma

## Preparação

### 1. Build local e criação do ZIP
Execute esses comandos na pasta `organograma`:

```bash
# Instalar dependências
npm install

# Criar build de produção
npm run build

# Criar arquivo ZIP com tudo necessário
```

Inclua no ZIP:
- Dockerfile
- docker-compose.yml
- nginx.conf
- .dockerignore
- .env (com as variáveis do Supabase)
- dist/ (pasta com o build)
- package.json
- package-lock.json

**IMPORTANTE**: O arquivo `.env` precisa estar no ZIP para que as variáveis do Supabase sejam incorporadas no build.

---

## Opção 1: Deploy via Portainer com Docker Compose

1. **Acesse o Portainer** do servidor da empresa
2. Vá em **Stacks** → **Add Stack**
3. Escolha **Upload** e faça upload do arquivo ZIP
4. Clique em **Deploy the stack**
5. A aplicação estará disponível na porta **3000**

---

## Opção 2: Deploy via Portainer com Container Único

1. **Build da imagem localmente** (antes de zipar):
```bash
docker build -t organograma:latest .
docker save organograma:latest -o organograma-image.tar
```

2. **No Portainer**:
   - Vá em **Images** → **Import**
   - Faça upload do arquivo `organograma-image.tar`
   - Vá em **Containers** → **Add container**
   - Use a imagem `organograma:latest`
   - Mapeie a porta: `3000:80`
   - Clique em **Deploy**

---

## Opção 3: Se Supabase não funcionar

Se houver problemas de conectividade com o Supabase externo, você precisará subir um Postgres local:

### Adicionar Postgres ao docker-compose.yml:

```yaml
version: '3.8'

services:
  organograma-frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: organograma-app
    ports:
      - "3000:80"
    depends_on:
      - postgres
    environment:
      - VITE_SUPABASE_URL=http://localhost:54321
      - VITE_SUPABASE_KEY=sua-chave-aqui
    networks:
      - organograma-network

  postgres:
    image: postgres:15-alpine
    container_name: organograma-db
    ports:
      - "54321:5432"
    environment:
      - POSTGRES_DB=organograma
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=sua-senha-segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase_setup.sql:/docker-entrypoint-initdb.d/01-setup.sql
      - ./supabase_posicao.sql:/docker-entrypoint-initdb.d/02-posicao.sql
      - ./supabase_atribuicoes.sql:/docker-entrypoint-initdb.d/03-atribuicoes.sql
    networks:
      - organograma-network

volumes:
  postgres_data:

networks:
  organograma-network:
    driver: bridge
```

Neste caso, você precisará:
1. Ajustar as URLs no código para apontar para o Postgres local
2. Incluir os arquivos SQL no ZIP
3. Fazer o upload completo no Portainer

---

## Verificação

Após o deploy, acesse:
- Frontend: `http://ip-do-servidor:3000`

## Troubleshooting

### Erro de conexão com Supabase
- Verifique se o servidor tem acesso à internet
- Teste: `curl https://kztzrejrhpsefvpugynq.supabase.co`
- Se não funcionar, use a Opção 3 com Postgres local

### Container não inicia
- Verifique os logs no Portainer: **Containers** → Selecione o container → **Logs**
- Verifique se a porta 3000 não está em uso

### Build falha
- Certifique-se que o arquivo `.env` está no ZIP
- Verifique se as dependências estão corretas no package.json
