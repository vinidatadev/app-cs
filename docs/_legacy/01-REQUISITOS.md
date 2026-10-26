# 📦 Requisitos

## Para Desenvolvimento Local

### Obrigatório
- **Docker Desktop** (Windows/Mac) ou Docker Engine (Linux)
  - Download: https://www.docker.com/products/docker-desktop/
  - Versão mínima: 20.10+
- **Git** (para versionamento)

### Opcional (apenas se não usar Docker)
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

## Para Deploy no Portainer

### Servidor da Empresa
- **Portainer** instalado e rodando
- **Docker** no servidor
- **Acesso** ao servidor (SSH ou console do Portainer)
- **Portas liberadas**:
  - 3000 (Frontend)
  - 8000 (Backend API)
  - 5432 (Postgres - apenas interno)

### Rede
- Acesso à internet para baixar imagens Docker (inicial)
- Após download, funciona offline
- **Não precisa** de acesso ao Supabase externo

## Credenciais Azure AD (para autenticação Microsoft)

Você vai precisar do **App Registration** no Azure:
- **Client ID** (Application ID)
- **Client Secret**
- **Tenant ID**
- **Redirect URI** configurada

Veja o arquivo **02-CONFIGURACAO-AZURE.md** para detalhes.

## Verificação Rápida

### Verificar se Docker está instalado:
```bash
docker --version
docker-compose --version
```

### Verificar se Portainer está acessível:
- Abra: `http://ip-do-servidor:9000` (ou porta configurada)
- Deve aparecer o login do Portainer

## Recursos de Hardware Recomendados

### Servidor de Produção
- **CPU**: 2+ cores
- **RAM**: 4GB mínimo (8GB recomendado)
- **Disco**: 20GB livres
- **SO**: Linux (Ubuntu/Debian) ou Windows Server

### Desenvolvimento Local
- **CPU**: 2+ cores
- **RAM**: 8GB mínimo
- **Disco**: 10GB livres
