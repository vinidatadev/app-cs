# Mudanças para Habilitar MinIO

## Resumo

O MinIO foi reconfigurado para usar **conexão lazy (sob demanda)**:
- ✅ Backend inicia normalmente sem depender do MinIO
- ✅ Conexão acontece apenas quando necessário (nos endpoints de upload/download)
- ✅ Buckets são criados automaticamente no primeiro uso
- ✅ Novo endpoint de health check: `/api/storage/health`

## Arquivos Modificados

### 1. `backend/app/api/storage.py`

**Mudanças:**

a) **Função `ensure_storage()`** - Não bloqueia mais o startup:
   - Se `SEED_ASSETS_ON_START=false`, apenas loga e retorna
   - Se `true`, tenta conectar mas com timeout menor (10 tentativas vs 30)
   - Não lança exceção se falhar, apenas avisa no log

b) **Novo endpoint `/api/storage/health`**:
   - Verifica status do MinIO
   - Lista todos os buckets e seu status
   - Retorna informações detalhadas de conectividade

c) **Endpoint de upload melhorado**:
   - Cria bucket automaticamente se não existir
   - Mensagens de erro mais claras
   - Retorna HTTP 503 se MinIO não estiver disponível

## Como Funciona Agora

### Fluxo de Inicialização

```
1. Backend inicia
2. ensure_storage() é chamado
3. Como SEED_ASSETS_ON_START=false:
   - Apenas loga "conexão será feita sob demanda"
   - Retorna imediatamente
4. Backend fica online ✅
```

### Fluxo de Upload

```
1. Usuario faz upload de foto
2. POST /api/storage/imagens/perfil/user1.jpg
3. ensure_bucket() tenta conectar ao MinIO
   - Se conectar: cria bucket se necessário
   - Se falhar: retorna HTTP 503
4. Se bucket OK, faz upload
5. Retorna dados do arquivo
```

## Testes Necessários no Portainer

### 1. Backend inicia sem MinIO?

```bash
# Antes de iniciar MinIO, verificar se backend sobe
curl http://IP:8000/health

# Deve retornar:
# {"status": "ok", "database": true, "storage": false}
```

### 2. Health check do storage

```bash
curl http://IP:8000/api/storage/health

# Com MinIO offline:
# {"status": "error", "message": "Erro ao conectar...", ...}

# Com MinIO online:
# {"status": "ok", "buckets": [...], ...}
```

### 3. Upload funciona?

```bash
# Fazer login
TOKEN=$(curl -X POST http://IP:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# Upload de imagem
curl -X POST http://IP:8000/api/storage/imagens/teste.jpg \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@imagem.jpg"

# Deve retornar:
# {"path": "teste.jpg", "fullPath": "imagens/teste.jpg", ...}
```

### 4. Download funciona?

```bash
# Acessar imagem (público, sem autenticação)
curl http://IP:8000/api/storage/public/imagens/teste.jpg \
  --output baixado.jpg
```

## Passo a Passo de Deploy

### 1. Gerar Novos TARs

```powershell
.\scripts\gerar-tars.ps1
```

Isso vai gerar:
- `deploy/tars/backend-code.tar.gz` (com código atualizado)
- `deploy/tars/frontend-code.tar.gz`

### 2. Rebuild Imagem Backend no Portainer

1. Portainer > Images > Build a new image
2. Nome: `organograma-backend:latest`
3. Upload: `backend-code.tar.gz`
4. Build

### 3. Atualizar Stack (opcional)

A stack já está correta, mas se quiser garantir:

1. Portainer > Stacks > organograma > Editor
2. Verificar que tem todas as variáveis do MinIO
3. Verificar `SEED_ASSETS_ON_START: "false"`
4. Update

### 4. Restart do Serviço Backend

Após rebuild da imagem:

1. Portainer > Services > organograma_backend
2. Clique em "Update" ou "Force update"
3. Aguarde nova task iniciar

### 5. Verificar Logs

```
Portainer > Services > organograma_backend > Logs
```

Deve aparecer:
```
Inicialização do MinIO pulada (SEED_ASSETS_ON_START=False).
Conexão será feita sob demanda nos endpoints de storage.
```

### 6. Testar Endpoints

Seguir os testes acima (health, upload, download).

## Variáveis de Ambiente

Na stack YAML, o backend tem:

```yaml
MINIO_ENDPOINT: ${MINIO_ENDPOINT:-minio:9000}
MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin123}
MINIO_SECURE: ${MINIO_SECURE:-false}
MINIO_BUCKETS: imagens,transacoes,task-attachments
SEED_ASSETS_ON_START: "false"
```

**Importante:** 
- `SEED_ASSETS_ON_START: "false"` permite backend iniciar sem MinIO
- Buckets são criados automaticamente no primeiro uso

## Endpoints da API

### Health Check
```
GET /api/storage/health
Autenticação: Não requerida
```

### Upload
```
POST /api/storage/{bucket}/{caminho}
Autenticação: Bearer token
Body: multipart/form-data com campo "file"
```

### Download Público
```
GET /api/storage/public/{bucket}/{caminho}
Autenticação: Não requerida
```

## Integração com Frontend

Exemplo de upload de foto de perfil:

```javascript
const uploadProfileImage = async (file, userId) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(
    `${API_URL}/api/storage/imagens/perfil/${userId}.jpg`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }
  );
  
  const data = await response.json();
  return `${API_URL}/api/storage/public/${data.fullPath}`;
};
```

## Solução de Problemas

### Backend não inicia

❌ **Problema:** Backend fica reiniciando
✅ **Solução:** Verificar se `SEED_ASSETS_ON_START="false"` (com aspas)

### Upload retorna 503

❌ **Problema:** "MinIO indisponível"
✅ **Solução:** 
1. Verificar se container minio está running
2. Verificar se estão na mesma rede (app-net)
3. Testar ping: `docker exec backend ping minio`

### Bucket inválido

❌ **Problema:** "Bucket inválido"
✅ **Solução:** Adicionar bucket em `MINIO_BUCKETS`

### Imagem não carrega

❌ **Problema:** 404 ao acessar imagem
✅ **Solução:** 
1. Verificar se upload foi feito com sucesso
2. Usar caminho completo: `/api/storage/public/{bucket}/{caminho}`
3. Verificar logs do MinIO

## Benefícios da Nova Abordagem

1. ✅ **Backend resiliente:** Inicia mesmo sem MinIO
2. ✅ **Deploy mais rápido:** Não espera 30 tentativas de conexão
3. ✅ **Diagnóstico mais fácil:** Endpoint `/health` mostra status
4. ✅ **Criação automática:** Buckets criados sob demanda
5. ✅ **Mensagens claras:** Erros são mais descritivos

## Documentação Adicional

- **Guia de testes:** `docs/TESTE-MINIO.md`
- **Deploy Portainer:** `docs/DEPLOY-PORTAINER.md`
- **FAQ:** `docs/FAQ-PORTAINER.md`

---

**Data:** 29/10/2026
**Status:** ✅ Pronto para deploy
