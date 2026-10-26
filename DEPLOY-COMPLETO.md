# Deploy completo

## 1. Pré-requisitos

- Docker Engine + Docker Compose no servidor
- Portas 3000, 8000, 3001, 5432, 9100 e 9101 liberadas (ou ajustadas no `docker-compose.yml`)
- Pasta do projeto copiada para o servidor

## 2. Configurar o `.env`

```env
POSTGRES_PASSWORD=uma_senha_forte
MINIO_ACCESS_KEY=organograma
MINIO_SECRET_KEY=uma_senha_forte_minimo_8_caracteres
SECRET_KEY=uma_chave_jwt_aleatoria_com_32_caracteres_ou_mais
CORS_ORIGINS=http://IP_DO_SERVIDOR:3000
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=uma_senha_forte_para_admin
VITE_FLOWCHECK_URL=https://flowcheck-three.vercel.app/home
```

`CORS_ORIGINS` só é necessário para chamadas diretas ao backend. Em produção o frontend usa o mesmo domínio via proxy Nginx.

> A imagem usada é `minio/minio:latest`. Se o servidor não conseguir baixá-la, transporte a imagem de uma máquina que já a tenha (`docker save`/`docker load`) ou use um registry/mirror interno.

## 3. Subir a stack

```bash
docker compose up -d --build
docker compose ps
```

Verificações:

```bash
curl http://localhost:8000/health
curl http://localhost:3000/
```

## 4. Acessar

- Aplicação: `http://IP_DO_SERVIDOR:3000`
- Swagger: `http://IP_DO_SERVIDOR:8000/docs`
- PostgREST: `http://IP_DO_SERVIDOR:3001` (exige JWT)
- MinIO Console: `http://IP_DO_SERVIDOR:9101`
- MinIO API: `http://IP_DO_SERVIDOR:9100`

## 5. Deploy via Portainer

O modo mais simples é usar o projeto com Docker Compose:

1. Copie a pasta `app-cs` para o servidor (Git, SCP ou volume compartilhado).
2. Ajuste o `.env` no servidor.
3. No Portainer, crie uma Stack a partir do repositório/pasta.
4. Use o conteúdo de `docker-compose.yml`.
5. Faça o deploy e acompanhe os logs dos cinco serviços (frontend, backend, postgrest, postgres e minio).

Se o Portainer não tiver acesso ao código-fonte, gere as imagens em uma máquina com Docker e publique-as em um registry interno:

```bash
docker compose build
docker tag app-cs-frontend registry.local/organograma-frontend:1.0
docker tag app-cs-backend  registry.local/organograma-backend:1.0
docker push registry.local/organograma-frontend:1.0
docker push registry.local/organograma-backend:1.0
```

Depois substitua os blocos `build:` do compose por `image:`.

## 6. Atualização

```bash
docker compose pull
docker compose up -d --build
```

Para atualizar sem perder dados, nunca use `down -v`: os dados ficam nos volumes `postgres_data` e `minio_data`.

## 7. Backup

Veja [docs/09-BACKUP-RESTORE.md](docs/09-BACKUP-RESTORE.md).

## 8. Segurança mínima

- Troque todas as senhas padrão.
- Restrinja as portas 5432, 8000, 3001, 9100 e 9101 ao firewall interno.
- Use HTTPS na frente do Nginx (proxy reverso ou certificado próprio).
- Faça backup do banco antes de atualizações.
- As contas locais migradas usam senha padrão `organograma123`; troque-as.
