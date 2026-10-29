# Teste do MinIO

Guia para testar e validar o funcionamento do MinIO no sistema.

## Status Atual

O MinIO está configurado para **conexão lazy (sob demanda)**:
- ✅ Backend inicia sem depender do MinIO
- ✅ Conexão acontece apenas quando necessário (upload/download)
- ✅ Buckets são criados automaticamente no primeiro uso

## Endpoints Disponíveis

### 1. Health Check do Storage

```bash
GET http://IP:8000/api/storage/health
```

**Resposta quando MinIO está OK:**
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
  ],
  "message": "MinIO acessível"
}
```

**Resposta quando MinIO está offline:**
```json
{
  "status": "error",
  "endpoint": "minio:9000",
  "message": "Erro ao conectar: ...",
  "buckets": []
}
```

### 2. Upload de Arquivo

```bash
POST http://IP:8000/api/storage/{bucket}/{caminho}
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [arquivo]
```

**Exemplo com curl:**
```bash
# Fazer login primeiro
TOKEN=$(curl -X POST http://IP:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# Upload de imagem
curl -X POST http://IP:8000/api/storage/imagens/perfil/usuario1.jpg \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@foto.jpg"
```

**Resposta:**
```json
{
  "path": "perfil/usuario1.jpg",
  "fullPath": "imagens/perfil/usuario1.jpg",
  "size": 45678,
  "bucket": "imagens"
}
```

### 3. Download de Arquivo Público

```bash
GET http://IP:8000/api/storage/public/{bucket}/{caminho}
```

**Exemplo:**
```bash
curl http://IP:8000/api/storage/public/imagens/perfil/usuario1.jpg \
  --output foto_baixada.jpg
```

## Passo a Passo para Habilitar MinIO

### 1. Verificar se MinIO está rodando

No Portainer, verifique se o container `organograma_minio` está com status "running".

Se não estiver, o MinIO já está configurado na stack mas pode estar parado.

### 2. Testar Conectividade

```bash
# Health check
curl http://IP:8000/api/storage/health
```

Se retornar `status: "error"`, o MinIO não está acessível.

### 3. Acessar Console do MinIO

Abra no navegador:
```
http://IP:9101
```

**Credenciais padrão:**
- Username: `minioadmin`
- Password: `minioadmin`

### 4. Criar Buckets Manualmente (Opcional)

No console do MinIO:
1. Clique em "Buckets"
2. Clique em "Create Bucket"
3. Nome: `imagens`
4. Deixe as configurações padrão
5. Clique em "Create"

**Ou deixe o backend criar automaticamente no primeiro upload.**

### 5. Testar Upload

Use o exemplo de curl acima ou teste pelo frontend.

## Configuração Local (docker-compose)

Se estiver testando localmente, o MinIO deve iniciar automaticamente:

```bash
cd organograma
docker compose up -d minio
```

Aguarde alguns segundos e teste:
```bash
curl http://localhost:8000/api/storage/health
```

## Configuração no Portainer

O MinIO já está configurado na stack. Para ativá-lo:

### Opção 1: MinIO já está rodando

Se o serviço `minio` já está na stack e rodando, apenas teste os endpoints.

### Opção 2: MinIO não está rodando

Verifique no Portainer:
1. Services > organograma_minio
2. Se não existir, a stack precisa ser atualizada

## Variáveis de Ambiente

No backend (`.env` ou stack YAML):

```env
# MinIO habilitado para uso sob demanda
SEED_ASSETS_ON_START=false        # false = não verifica no startup
MINIO_ENDPOINT=minio:9000         # hostname do serviço
MINIO_ACCESS_KEY=minioadmin       # ⚠️ alterar em produção
MINIO_SECRET_KEY=minioadmin       # ⚠️ alterar em produção
MINIO_SECURE=false                # true se usar HTTPS
MINIO_BUCKETS=imagens             # buckets separados por vírgula
```

## Solução de Problemas

### Erro: "MinIO indisponível"

**Causa:** Container MinIO não está rodando ou não é acessível.

**Solução:**
1. Verificar se o serviço está rodando:
   ```bash
   docker service ls | grep minio
   ```

2. Ver logs do MinIO:
   ```bash
   docker service logs organograma_minio
   ```

3. Verificar conectividade de rede:
   ```bash
   # De dentro do container backend
   docker exec -it <backend_container> ping minio
   ```

### Erro: "Bucket inválido"

**Causa:** Bucket não está na lista `MINIO_BUCKETS`.

**Solução:** Adicionar o bucket na variável de ambiente `MINIO_BUCKETS`.

### Erro: "Failed to resolve 'minio'"

**Causa:** Containers não estão na mesma rede.

**Solução:** Verificar que backend e minio estão na mesma rede (`app-net`).

### Erro 413: "Arquivo maior que 25MB"

**Causa:** Limite de tamanho configurado no backend.

**Solução:** Ajustar `MAX_UPLOAD_BYTES` em `storage.py` se necessário.

## Integração com Frontend

### Upload de Imagem de Perfil

Exemplo de código React/JavaScript:

```javascript
async function uploadProfileImage(file) {
  const token = localStorage.getItem('token');
  const userId = 'usuario1'; // ou pegar do contexto
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch(
      `http://IP:8000/api/storage/imagens/perfil/${userId}.jpg`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error('Falha no upload');
    }
    
    const data = await response.json();
    console.log('Upload sucesso:', data);
    
    // URL pública da imagem
    const imageUrl = `http://IP:8000/api/storage/public/${data.fullPath}`;
    return imageUrl;
    
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
}
```

### Download/Exibir Imagem

```javascript
// URL pública (não precisa de autenticação)
const imageUrl = 'http://IP:8000/api/storage/public/imagens/perfil/usuario1.jpg';

// Usar diretamente em <img>
<img src={imageUrl} alt="Perfil" />
```

## Segurança

### Buckets Públicos vs Privados

Atualmente, o endpoint `/public/` permite acesso sem autenticação.

**Para arquivos privados:**
1. Não usar o endpoint `/public/`
2. Criar endpoint autenticado para download
3. Validar permissões do usuário

### Exemplo de Download Autenticado

```python
@router.get("/private/{bucket}/{file_path:path}")
def private_file(
    bucket: str,
    file_path: str,
    _user: dict = Depends(require_user)
):
    # Validar se usuário tem permissão para acessar esse arquivo
    # ...
    
    # Retornar arquivo (igual ao public_file)
```

## Monitoramento

### Verificar Espaço em Disco

```bash
# Tamanho do volume do MinIO
docker run --rm -v organograma_minio_data:/data alpine du -sh /data
```

### Listar Buckets e Objetos

Via console MinIO (http://IP:9101) ou via código Python:

```python
from minio import Minio

client = Minio('minio:9000', 'minioadmin', 'minioadmin', secure=False)

# Listar buckets
buckets = client.list_buckets()
for bucket in buckets:
    print(bucket.name)

# Listar objetos em um bucket
objects = client.list_objects('imagens', recursive=True)
for obj in objects:
    print(f"{obj.object_name} - {obj.size} bytes")
```

## Backup

### Backup de Arquivos do MinIO

```bash
# Backup do volume
docker run --rm \
  -v organograma_minio_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/minio-backup-$(date +%Y%m%d).tar.gz /data
```

### Restauração

```bash
# Restaurar backup
docker run --rm \
  -v organograma_minio_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd / && tar xzf /backup/minio-backup-20261029.tar.gz"
```

## Performance

### Otimizações

1. **Usar CDN:** Para produção, considere usar CDN na frente do MinIO
2. **Compressão:** Imagens devem ser otimizadas antes do upload
3. **Cache:** Configurar headers de cache nos endpoints públicos
4. **Thumbnails:** Gerar miniaturas de imagens grandes

## Próximos Passos

- [ ] Testar health check: `curl http://IP:8000/api/storage/health`
- [ ] Testar upload de imagem de perfil
- [ ] Verificar exibição de imagens no frontend
- [ ] Configurar política de retenção de arquivos
- [ ] Implementar limpeza de arquivos órfãos
- [ ] Adicionar compressão de imagens no frontend

---

**Última atualização:** 29/10/2026
