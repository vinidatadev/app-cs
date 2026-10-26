# Deploy Manual no Portainer - Organograma

## Método Simplificado (Recomendado)

Como o Portainer não aceita ZIP com build, use este método:

### Passo 1: No Portainer, use o Web Editor

1. No Portainer, vá em **Stacks** → **Add Stack**
2. Nome: `organograma`
3. Escolha **Web editor** (não Upload!)
4. Cole o conteúdo do arquivo `docker-compose.simple.yml` (veja abaixo)
5. Clique em **Deploy the stack**

### Conteúdo para colar no Web Editor:

```yaml
version: '3.8'

services:
  organograma:
    image: node:18-alpine
    container_name: organograma-app
    working_dir: /app
    ports:
      - "3000:3000"
    volumes:
      - ./app:/app
    command: sh -c "npm install -g http-server && http-server /app/dist -p 3000"
    restart: unless-stopped
    networks:
      - organograma-network

networks:
  organograma-network:
    driver: bridge
```

### Passo 2: Após Deploy, fazer Upload dos arquivos

1. O stack vai criar, mas o container vai ficar reiniciando (normal)
2. No Portainer, vá em **Volumes**
3. Procure o volume `organograma_app` 
4. Faça upload do arquivo `organograma-app-files.zip` no volume

---

## Método Alternativo: Container Direto (Mais Simples)

### Opção A: Upload de Arquivos Estáticos com Nginx

1. No Portainer, vá em **Containers** → **Add Container**
2. Configure:
   - **Name**: `organograma`
   - **Image**: `nginx:alpine`
   - **Port mapping**: Host `3000` → Container `80`

3. Em **Volumes** adicione:
   - **container**: `/usr/share/nginx/html`
   - **bind**: Crie uma pasta no servidor e coloque os arquivos da pasta `dist/`

4. Deploy

### Opção B: Usar Servidor Python Simples

1. Copie a pasta `dist/` para o servidor em: `/opt/organograma/`

2. No Portainer, crie container:
   - **Name**: `organograma`
   - **Image**: `python:3-alpine`
   - **Port mapping**: Host `3000` → Container `8000`
   - **Command**: `python -m http.server 8000`
   - **Volume**: `/opt/organograma:/app`
   - **Working dir**: `/app`

---

## Solução Mais Fácil: Arquivo Único HTML

Se nada funcionar, podemos gerar um build como arquivo único e você sobe direto no nginx do servidor.

Avise qual método prefere tentar!
