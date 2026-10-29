# Troubleshooting MinIO no Portainer

## Situação Atual

Logs mostram:
```
"Failed to resolve 'minio'" - DNS não encontra o serviço
Service organograma_minio: 0/1 tasks (rejected)
```

## Diagnóstico

O MinIO está configurado na stack mas **não está rodando nenhuma task**.

## Soluções

### 1. Verificar Por Que MinIO Está Rejeitado

No Portainer:
1. Services > `organograma_minio`
2. Verificar a aba "Tasks"
3. Ver mensagens de erro nas tasks rejeitadas

**Possíveis causas:**
- Porta já em uso
- Volume não pode ser criado
- Erro na imagem
- Limite de recursos

### 2. Ver Logs do MinIO

```
Portainer > Services > organograma_minio > Logs
```

Procure por:
- `Address already in use` → Porta ocupada
- `permission denied` → Problema de permissão
- `no space left` → Disco cheio

### 3. Forçar Reinicialização

```
Portainer > Services > organograma_minio
- Clique em "Update service"
- Force update: ✅
- Update
```

### 4. Verificar Portas Disponíveis

Se houver conflito de portas, tente portas diferentes:

**Opção A: Portas altas (evita conflitos)**
```yaml
ports:
  - "19000:9000"  # MinIO API
  - "19001:9001"  # MinIO Console
```

**Opção B: Portas originais (usadas agora)**
```yaml
ports:
  - "9000:9000"
  - "9001:9001"
```

### 5. Remover e Recriar Serviço MinIO

Se nada funcionar:

1. **Deletar apenas o serviço MinIO:**
   ```
   Services > organograma_minio > Remove service
   ```

2. **Atualizar a stack:**
   ```
   Stacks > organograma > Editor
   - Verificar configuração do MinIO
   - Update
   ```

### 6. Verificar Rede

Verificar se MinIO está na rede app-net:

```
Portainer > Networks > app-net
- Deve listar: backend, minio, postgres, postgrest, frontend
```

## Stack YAML Corrigida

Use esta configuração (portas padrão):

```yaml
minio:
  image: minio/minio:latest
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin123
  volumes:
    - minio_data:/data
  ports:
    - "9000:9000"
    - "9001:9001"
  networks:
    - app-net
  deploy:
    replicas: 1
    restart_policy:
      condition: on-failure
```

## Teste Alternativo: MinIO Standalone

Se o MinIO no Swarm continuar com problemas, teste com container standalone:

```bash
docker run -d \
  --name minio-test \
  --network organograma_app-net \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"
```

Depois teste:
```bash
curl http://10.0.103.20:8000/api/storage/health
```

## Solução Temporária: Usar IP em vez de Nome

Se o DNS não resolver, pode temporariamente usar o IP:

1. Descobrir IP do MinIO:
   ```
   docker inspect <container_id_minio> | grep IPAddress
   ```

2. Mudar variável no backend:
   ```yaml
   MINIO_ENDPOINT: "10.0.X.X:9000"  # IP real do container
   ```

Mas isso **não é ideal** para produção.

## Verificar Logs Detalhados

### Backend
```bash
docker service logs organograma_backend --tail 50
```

### MinIO
```bash
docker service logs organograma_minio --tail 50
```

### DNS/Rede
```bash
# De dentro do container backend
docker exec -it <backend_container> nslookup minio
docker exec -it <backend_container> ping minio
```

## Checklist de Verificação

- [ ] MinIO tem 1 task rodando (não 0/1)
- [ ] Portas 9000 e 9001 estão livres
- [ ] Volume minio_data existe
- [ ] MinIO está na rede app-net
- [ ] DNS resolve `minio` para IP do container
- [ ] Backend consegue fazer ping no MinIO
- [ ] Console do MinIO acessível em http://IP:9001

## Próximos Passos

1. **Ver logs do MinIO** para identificar erro específico
2. **Ajustar configuração** conforme erro encontrado
3. **Atualizar stack** com correção
4. **Testar** health check novamente

---

**Atualizado:** 29/10/2026
