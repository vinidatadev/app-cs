# Correção MinIO - Portas Internas Apenas

## Problema Identificado

MinIO com 0/1 tasks (rejeitado) - provavelmente conflito de portas.

## Solução

Configurar MinIO para usar **apenas rede interna** (sem expor portas no host).

## Stack YAML Atualizada

O MinIO agora está configurado assim:

```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin123
  volumes:
    - minio_data:/data
  networks:
    - app-net
  deploy:
    mode: replicated
    replicas: 1
    restart_policy:
      condition: on-failure
```

**Mudanças:**
- ❌ Removido mapeamento de portas externas (9000:9000 e 9001:9001)
- ✅ MinIO acessível apenas internamente via rede app-net
- ✅ Backend acessa via `minio:9000`
- ✅ Não há mais conflito de portas

## Passo a Passo de Atualização

### 1. Copiar YAML Atualizado

```
Portainer > Stacks > organograma > Editor
```

Cole o conteúdo completo de `deploy/portainer-stack.yml`

### 2. Update Stack

```
Clique em "Update the stack"
```

### 3. Verificar Serviços

```
Services > organograma_minio
```

Deve mostrar **1/1** tasks running (não mais 0/1).

### 4. Aguardar Inicialização

Espere ~10-30 segundos para o MinIO inicializar.

### 5. Testar

```bash
curl http://10.0.103.20:8000/api/storage/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "endpoint": "minio:9000",
  "buckets": [
    {
      "name": "imagens",
      "exists": true,
      "accessible": true
    }
  ]
}
```

## Acesso ao Console MinIO

### ⚠️ Console NÃO estará mais acessível externamente

Se precisar acessar o console do MinIO:

### Opção 1: Port Forward Temporário

```bash
# Descobrir ID do container
docker ps | grep minio

# Port forward
docker exec -it <container_id> /bin/sh
```

### Opção 2: Adicionar Porta Temporariamente

Se realmente precisar acessar o console:

```yaml
minio:
  # ... configurações ...
  ports:
    - "9001:9001"  # APENAS console (API continua interna)
```

Mas isso pode causar o mesmo problema de porta em uso.

### Opção 3: Usar MinIO Client (mc)

```bash
# Instalar mc
docker run --rm -it --network organograma_app-net \
  minio/mc alias set myminio http://minio:9000 minioadmin minioadmin123

# Listar buckets
docker run --rm -it --network organograma_app-net \
  minio/mc ls myminio
```

## Vantagens da Nova Configuração

1. ✅ **Sem conflito de portas** - não expõe portas no host
2. ✅ **Mais seguro** - MinIO não acessível externamente
3. ✅ **Swarm amigável** - funciona melhor em cluster
4. ✅ **Simplicidade** - menos configuração de rede

## Desvantagens

1. ❌ Console MinIO não acessível via navegador
2. ❌ Precisa de workarounds para gerenciamento manual

## Uso Normal

Para o uso normal da aplicação (upload de imagens), **nada muda**:

```javascript
// Upload continua funcionando igual
POST http://IP:8000/api/storage/imagens/foto.jpg

// Download continua funcionando igual  
GET http://IP:8000/api/storage/public/imagens/foto.jpg
```

O backend acessa o MinIO internamente via `minio:9000`.

## Alternativa: Usar Traefik/Nginx como Proxy

Se precisar acesso externo ao console:

1. Instalar Traefik ou Nginx na stack
2. Configurar proxy reverso para MinIO console
3. Acessar via subdomínio: `minio.seudominio.com`

Mas isso é mais complexo e não necessário para funcionamento básico.

## Troubleshooting

### MinIO ainda está rejeitado

1. Ver detalhes da task:
   ```
   Services > organograma_minio > Tasks
   ```

2. Procurar erro específico

3. Possíveis causas:
   - Volume não pode ser criado
   - Imagem não pode ser baixada
   - Restrições de recursos

### Testar manualmente

```bash
# Criar container MinIO standalone
docker run -d \
  --name minio-standalone \
  --network organograma_app-net \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  -v minio_test:/data \
  minio/minio server /data --console-address ":9001"

# Testar backend
curl http://10.0.103.20:8000/api/storage/health

# Limpar depois
docker rm -f minio-standalone
docker volume rm minio_test
```

## Rollback

Se der problema, voltar para versão sem MinIO:

```yaml
# Comentar ou remover serviço minio
#  minio:
#    ...
```

E manter `SEED_ASSETS_ON_START: "false"` no backend.

---

**Status:** Aguardando teste
**Data:** 29/10/2026
