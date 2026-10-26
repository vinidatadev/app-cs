# 06 - Deploy no Portainer

## Opção recomendada: Stack com Docker Compose

1. No servidor, clone/copie a pasta `app-cs`.
2. Crie o `.env` com base em `.env.example`.
3. No Portainer: **Stacks → Add stack**.
4. Nomeie a stack (ex.: `organograma`).
5. Cole o conteúdo de `docker-compose.yml` ou aponte para o repositório Git.
6. Se usar upload de arquivo, envie também as pastas `frontend/`, `backend/` e `database/`, pois o compose faz build local.
7. Faça o deploy.

## Variáveis obrigatórias

```env
POSTGRES_PASSWORD=senha_forte
MINIO_ACCESS_KEY=organograma
MINIO_SECRET_KEY=senha_forte_minimo_8_caracteres
SECRET_KEY=chave_jwt_com_32_caracteres_ou_mais
CORS_ORIGINS=http://IP_DO_SERVIDOR:3000
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=senha_forte
```

## Portas

| Porta | Serviço | Recomendação |
|---|---|---|
| 3000 | frontend | liberar para usuários |
| 8000 | backend | liberar só para administradores ou proxy |
| 3001 | PostgREST | preferencialmente interno/firewall |
| 5432 | Postgres | preferencialmente interno/firewall |
| 9100 | MinIO API | interno ou registry de arquivos |
| 9101 | MinIO Console | restrito a administradores |

## Se o Portainer não conseguir buildar

Publique as imagens em um registry:

```bash
docker compose build
docker tag app-cs-frontend registry.local/organograma-frontend:1.0
docker tag app-cs-backend  registry.local/organograma-backend:1.0
docker push registry.local/organograma-frontend:1.0
docker push registry.local/organograma-backend:1.0
```

No compose do Portainer, troque:

```yaml
frontend:
  build: ...
backend:
  build: ...
```

por:

```yaml
frontend:
  image: registry.local/organograma-frontend:1.0
backend:
  image: registry.local/organograma-backend:1.0
```

Postgres, PostgREST e MinIO já usam imagens oficiais. Se o servidor não conseguir baixar `minio/minio:latest`, importe a imagem de uma máquina que já a tenha (`docker save`/`docker load`) ou use um mirror interno.

## Atualizar

```bash
docker compose pull
docker compose up -d --build
```

Não use `down -v` em produção: apaga os volumes.

## Checklist

- [ ] `.env` ajustado
- [ ] senhas trocadas
- [ ] stack saudável (`docker compose ps`)
- [ ] `/health` retornando ok
- [ ] login funcionando
- [ ] upload de imagem funcionando
- [ ] backup agendado
