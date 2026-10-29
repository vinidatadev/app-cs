# Resumo Rápido - Deploy no Portainer

## TL;DR - Passos Essenciais

```bash
# 1. Gerar TARs
cd seu-projeto
.\scripts\gerar-tars.ps1

# 2. Upload no Portainer
# - Images > Build > Upload backend-code.tar.gz (nome: organograma-backend:latest)
# - Images > Build > Upload frontend-code.tar.gz (nome: organograma-frontend:latest)

# 3. Deploy Stack
# - Stacks > Add stack > Nome: organograma
# - Copiar conteúdo de deploy/portainer-stack.yml
# - Deploy

# 4. Inicializar Banco
# - Containers > postgres > Console
# - Executar scripts SQL: 01-schema.sql, 02-seed.sql, 99-grants.sql
```

## Comandos Rápidos

### Gerar TARs (Windows)
```cmd
tar -czf backend-code.tar.gz -C organograma\backend .
tar -czf frontend-code.tar.gz -C organograma\frontend .
```

### Gerar TARs (Linux/Mac)
```bash
tar -czf backend-code.tar.gz -C organograma/backend .
tar -czf frontend-code.tar.gz -C organograma/frontend .
```

### Testar Serviços
```bash
# Health check
curl http://SEU-IP:8000/health

# PostgREST
curl http://SEU-IP:3001/

# Frontend
curl http://SEU-IP:3000
```

## Arquivos Importantes

```
organograma/
├── docs/
│   ├── DEPLOY-PORTAINER.md        # 📖 Guia completo
│   ├── CHECKLIST-PORTAINER.md     # ✅ Checklist de deploy
│   └── RESUMO-DEPLOY.md           # 🚀 Este arquivo
├── scripts/
│   ├── gerar-tars.bat             # 🪟 Script Windows CMD
│   ├── gerar-tars.ps1             # 💠 Script PowerShell
│   └── README.md                  # 📝 Documentação dos scripts
├── deploy/
│   ├── portainer-stack.yml        # 🐳 YAML da stack
│   └── tars/                      # 📦 TARs gerados
│       ├── backend-code.tar.gz
│       └── frontend-code.tar.gz
└── backend/
    └── app/api/storage.py         # 🔧 Modificado (skip MinIO)
```

## Estrutura dos Serviços

```
┌─────────────────────────────────────────┐
│         Docker Swarm (Portainer)        │
├─────────────────────────────────────────┤
│                                         │
│  app-net (overlay network)              │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │  frontend:80 ──────► :3000        │ │
│  │      │                             │ │
│  │      ├──► backend:8000             │ │
│  │      │        │                    │ │
│  │      │        └──► postgres:5432   │ │
│  │      │                             │ │
│  │      └──► postgrest:3000           │ │
│  │                │                   │ │
│  │                └──► postgres:5432  │ │
│  │                                    │ │
│  │  minio:9000 (opcional)             │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  Volumes:                               │
│  - postgres_data                        │
│  - minio_data                           │
│                                         │
└─────────────────────────────────────────┘
```

## Portas Expostas

| Serviço   | Interna | Externa | URL                        |
|-----------|---------|---------|----------------------------|
| Frontend  | 80      | 3000    | http://IP:3000             |
| Backend   | 8000    | 8000    | http://IP:8000             |
| PostgREST | 3000    | 3001    | http://IP:3001             |
| Postgres  | 5432    | 5432    | postgres://IP:5432         |
| MinIO API | 9000    | 9100    | http://IP:9100             |
| MinIO UI  | 9001    | 9101    | http://IP:9101             |

## Credenciais Padrão (ALTERAR EM PRODUÇÃO!)

```yaml
# PostgreSQL
Usuario: postgres
Senha: postgres123
Database: organograma

# Aplicação Admin
Usuario: admin
Senha: admin123

# MinIO
Usuario: minioadmin
Senha: minioadmin123

# PostgREST
Usuario: authenticator
Senha: postgrest_local_pwd
```

## Variáveis de Ambiente Críticas

```yaml
# Backend
SEED_ASSETS_ON_START: "false"  # IMPORTANTE: Desabilita MinIO no startup
DATABASE_URL: postgresql://...
SECRET_KEY: [mínimo 32 caracteres]
CORS_ORIGINS: http://SEU-IP:3000

# PostgREST
PGRST_DB_URI: postgres://authenticator:...
PGRST_JWT_SECRET: [mesmo valor do SECRET_KEY]
```

## Problemas Comuns e Soluções Rápidas

### 1. "network cannot be used with services"
**Solução:** Use `driver: overlay` com `attachable: true`

### 2. Backend tentando conectar ao MinIO
**Solução:** Verificar `SEED_ASSETS_ON_START: "false"`

### 3. "Failed to resolve 'postgres'"
**Solução:** Todos serviços na mesma rede overlay

### 4. Imagem não encontrada
**Solução:** Reconstruir imagens com nomes exatos

### 5. Login não funciona
**Solução:** Executar scripts SQL de inicialização do banco

## Scripts SQL - Ordem de Execução

```sql
-- 1. Criar estrutura
\i /path/to/01-schema.sql

-- 2. Popular dados
\i /path/to/02-seed.sql

-- 3. Configurar permissões
\i /path/to/99-grants.sql
```

## Verificação Rápida

```bash
# 1. Verificar se serviços estão rodando
docker service ls

# 2. Ver logs do backend
docker service logs organograma_backend

# 3. Testar health
curl http://IP:8000/health

# 4. Testar PostgREST
curl http://IP:3001/user

# 5. Acessar frontend
# Abrir navegador: http://IP:3000
```

## Atualização Rápida

```bash
# 1. Gerar novos TARs
.\scripts\gerar-tars.ps1

# 2. Rebuild imagens no Portainer
# Images > Build > Upload novamente

# 3. Atualizar stack
# Stacks > organograma > Editor > Update
```

## Backup Rápido

```bash
# Banco de dados
docker exec organograma_postgres \
  pg_dump -U postgres organograma > backup.sql

# Volume PostgreSQL
docker run --rm \
  -v organograma_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Restauração Rápida

```bash
# Restaurar banco
docker exec -i organograma_postgres \
  psql -U postgres organograma < backup.sql
```

## Links Úteis

- 📖 [Guia Completo](DEPLOY-PORTAINER.md)
- ✅ [Checklist](CHECKLIST-PORTAINER.md)
- 🔧 [Scripts](../scripts/README.md)
- 🏠 [Início](../COMECE-AQUI.md)

## Suporte

1. Verificar logs no Portainer
2. Consultar seção "Solução de Problemas" no guia completo
3. Revisar checklist de deploy
4. Validar conectividade de rede
5. Confirmar variáveis de ambiente

---

**Última atualização:** 29/10/2026

**Versão compatível:** Docker Swarm + Portainer
