# MinIO Standalone - Solução Alternativa

## Problema

MinIO não funciona no Docker Swarm (todas as tasks rejeitadas).

## Solução

Rodar MinIO como **container standalone** fora da stack, mas conectado à mesma rede.

## Passo a Passo

### 1. Stack Sem MinIO

A stack está configurada **sem o serviço MinIO** (comentado).

Atualize a stack no Portainer:
```
Stacks > organograma > Editor > Update
```

### 2. Criar MinIO Standalone

Via linha de comando no servidor Portainer:

```bash
docker run -d \
  --name organograma-minio \
  --network organograma_app-net \
  --restart unless-stopped \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123456 \
  -v organograma_minio_data:/data \
  minio/minio:RELEASE.2024-10-13T13-34-11Z \
  server /data --console-address ":9001"
```

**Importante:**
- ✅ Nome: `organograma-minio` (ou apenas `minio` se preferir)
- ✅ Rede: `organograma_app-net` (mesma rede da stack)
- ✅ Volume: `organograma_minio_data` (persistência)
- ✅ Restart policy: `unless-stopped`

### 3. Verificar Container

```bash
docker ps | grep minio
```

Deve mostrar o container rodando.

### 4. Testar Conectividade

```bash
# Health check
curl http://10.0.103.20:8000/api/storage/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "endpoint": "minio:9000",
  "buckets": [...]
}
```

### 5. Atualizar Backend (se necessário)

Se o nome do container for diferente de `minio`, atualizar variável:

```yaml
backend:
  environment:
    MINIO_ENDPOINT: "organograma-minio:9000"  # Nome do container
```

## Criação via Portainer

Alternativamente, criar via Portainer UI:

1. **Containers > Add container**

2. **Configurações:**
   ```
   Name: organograma-minio
   Image: minio/minio:RELEASE.2024-10-13T13-34-11Z
   
   Command: server /data --console-address :9001
   
   Environment variables:
   - MINIO_ROOT_USER=minioadmin
   - MINIO_ROOT_PASSWORD=minioadmin123456
   
   Network: organograma_app-net
   
   Volumes:
   - Volume: organograma_minio_data
   - Container path: /data
   
   Restart policy: Unless stopped
   ```

3. **Deploy container**

## Vantagens

- ✅ Funciona fora do Swarm (sem problemas de tasks rejeitadas)
- ✅ Conectado à mesma rede (backend acessa normalmente)
- ✅ Volume persistente (dados não se perdem)
- ✅ Restart automático

## Desvantagens

- ❌ Não gerenciado pelo Swarm
- ❌ Não escala automaticamente
- ❌ Precisa criar manualmente

## Acesso ao Console

Se quiser acessar o console MinIO, adicionar mapeamento de porta:

```bash
docker run -d \
  --name organograma-minio \
  --network organograma_app-net \
  --restart unless-stopped \
  -p 9001:9001 \  # Adicionar esta linha
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123456 \
  -v organograma_minio_data:/data \
  minio/minio:RELEASE.2024-10-13T13-34-11Z \
  server /data --console-address ":9001"
```

Depois acessar: `http://10.0.103.20:9001`

## Gerenciamento

### Parar
```bash
docker stop organograma-minio
```

### Iniciar
```bash
docker start organograma-minio
```

### Ver Logs
```bash
docker logs organograma-minio -f
```

### Remover
```bash
docker rm -f organograma-minio
```

### Backup
```bash
docker run --rm \
  -v organograma_minio_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup.tar.gz /data
```

## Verificação

### 1. Container rodando?
```bash
docker ps | grep minio
# Deve mostrar: organograma-minio ... Up ...
```

### 2. Na rede correta?
```bash
docker inspect organograma-minio | grep organograma_app-net
# Deve mostrar a rede
```

### 3. Backend consegue conectar?
```bash
# De dentro do backend
docker exec -it <backend_container> ping organograma-minio
# ou
docker exec -it <backend_container> ping minio
```

### 4. Health check OK?
```bash
curl http://10.0.103.20:8000/api/storage/health
```

## Troubleshooting

### Erro: network not found

Listar redes:
```bash
docker network ls | grep organograma
```

Se a rede não existir, a stack precisa estar rodando primeiro.

### Erro: container name already in use

Remover container antigo:
```bash
docker rm -f organograma-minio
```

### Backend não resolve hostname

Verificar nome DNS:
```bash
docker exec -it <backend_container> nslookup minio
```

Se não resolver, usar o nome completo: `organograma-minio`

## Migração Futura para Stack

Quando o problema do Swarm for resolvido:

1. Parar container standalone:
   ```bash
   docker stop organograma-minio
   ```

2. Descomentar serviço na stack

3. Update stack no Portainer

4. Remover container standalone:
   ```bash
   docker rm organograma-minio
   ```

O volume `organograma_minio_data` será reusado automaticamente.

---

**Status:** Solução alternativa funcional
**Data:** 29/10/2026
