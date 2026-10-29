# Deploy

Esta pasta contém arquivos relacionados ao deploy da aplicação em diferentes ambientes.

## Arquivos

### `portainer-stack.yml`

Arquivo de configuração da stack para deploy no Portainer usando Docker Swarm.

**Uso:**
1. Acesse o Portainer
2. Vá em Stacks > Add stack
3. Cole o conteúdo deste arquivo
4. Clique em "Deploy the stack"

**Serviços incluídos:**
- postgres (PostgreSQL 15)
- minio (MinIO para storage)
- postgrest (API REST automática)
- backend (FastAPI - autenticação e lógica)
- frontend (React/Next.js)

**Rede:**
- Nome: `app-net`
- Tipo: overlay (requerido pelo Docker Swarm)
- Attachable: true

**Volumes:**
- `postgres_data`: Dados do PostgreSQL
- `minio_data`: Arquivos do MinIO

**Portas expostas:**
- 3000: Frontend
- 8000: Backend API
- 3001: PostgREST
- 5432: PostgreSQL
- 9100: MinIO API
- 9101: MinIO Console

### `tars/` (criado automaticamente)

Pasta onde os scripts de geração de TARs salvam os arquivos:
- `backend-code.tar.gz`: Código do backend empacotado
- `frontend-code.tar.gz`: Código do frontend empacotado

Estes arquivos são usados para fazer upload e build das imagens no Portainer.

## Como Usar

### Deploy Completo no Portainer

Siga a documentação completa em:
- **Índice:** [../docs/INDEX-PORTAINER.md](../docs/INDEX-PORTAINER.md)
- **Guia completo:** [../docs/DEPLOY-PORTAINER.md](../docs/DEPLOY-PORTAINER.md)
- **Resumo rápido:** [../docs/RESUMO-DEPLOY.md](../docs/RESUMO-DEPLOY.md)

### Passos Resumidos

```bash
# 1. Gerar TARs (na raiz do projeto)
.\scripts\gerar-tars.ps1

# 2. No Portainer:
# - Images > Build > Upload backend-code.tar.gz
#   Nome: organograma-backend:latest
# - Images > Build > Upload frontend-code.tar.gz
#   Nome: organograma-frontend:latest

# 3. Stacks > Add stack
# - Nome: organograma
# - Copiar conteúdo de portainer-stack.yml
# - Deploy
```

## Modificações Importantes

### Rede Overlay

O arquivo usa `driver: overlay` em vez de `bridge` porque Docker Swarm requer redes overlay para comunicação entre serviços.

### MinIO Desabilitado no Startup

O backend está configurado com `SEED_ASSETS_ON_START: "false"` para não tentar conectar ao MinIO durante a inicialização, evitando delays e erros.

### Variáveis de Ambiente

Principais configurações que podem ser alteradas:

```yaml
# Banco de dados
POSTGRES_PASSWORD: postgres123  # ⚠️ ALTERAR EM PRODUÇÃO

# Backend
SECRET_KEY: [32+ caracteres]    # ⚠️ ALTERAR EM PRODUÇÃO
ADMIN_PASSWORD: admin123        # ⚠️ ALTERAR EM PRODUÇÃO
CORS_ORIGINS: http://IP:3000   # Ajustar para seu IP

# MinIO
MINIO_SECRET_KEY: minioadmin123 # ⚠️ ALTERAR EM PRODUÇÃO
```

## Outros Ambientes

### Docker Compose (Local)

Para desenvolvimento local, use o arquivo na raiz:
```bash
cd organograma
docker compose up -d
```

### Kubernetes

Não há arquivo Kubernetes nesta versão. Para migrar para K8s:
1. Converter o `portainer-stack.yml` para manifests K8s
2. Configurar PersistentVolumeClaims para volumes
3. Configurar Ingress para acesso externo

## Segurança

⚠️ **IMPORTANTE:**

Antes de fazer deploy em produção:

1. **Alterar todas as senhas padrão:**
   - POSTGRES_PASSWORD
   - ADMIN_PASSWORD
   - MINIO_SECRET_KEY
   - SECRET_KEY

2. **Usar HTTPS:**
   - Configure certificado SSL/TLS
   - Use reverse proxy (nginx, traefik)

3. **Restringir CORS:**
   - Não use `*` em produção
   - Liste apenas origens confiáveis

4. **Firewall:**
   - Bloquear portas desnecessárias
   - Permitir apenas tráfego necessário

## Backup

Antes de fazer qualquer alteração:

```bash
# Backup do banco
docker exec organograma_postgres \
  pg_dump -U postgres organograma > backup-$(date +%Y%m%d).sql

# Backup dos volumes
docker run --rm \
  -v organograma_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /data
```

## Troubleshooting

### Stack não cria

- Verifique se não há redes antigas tipo `bridge`
- Delete stacks antigas antes de recriar
- Confirme que Docker Swarm está ativo

### Serviços não se comunicam

- Todos devem estar na mesma rede `app-net`
- Rede deve ser tipo `overlay`
- Use nomes dos serviços como hostnames

### Backend reiniciando

- Verifique logs: `docker service logs organograma_backend`
- Confirme `SEED_ASSETS_ON_START: "false"`
- Verifique conexão com banco de dados

Para mais soluções, consulte [../docs/FAQ-PORTAINER.md](../docs/FAQ-PORTAINER.md)

## Documentação Relacionada

- 📑 [Índice de Documentos](../docs/INDEX-PORTAINER.md)
- 📘 [Guia Completo de Deploy](../docs/DEPLOY-PORTAINER.md)
- 📄 [Resumo Rápido](../docs/RESUMO-DEPLOY.md)
- 🔄 [Fluxo Visual](../docs/FLUXO-DEPLOY.md)
- ✅ [Checklist](../docs/CHECKLIST-PORTAINER.md)
- ❓ [FAQ](../docs/FAQ-PORTAINER.md)

---

**Última atualização:** 29/10/2026
