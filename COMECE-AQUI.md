# Comece aqui

Este projeto não usa mais Supabase. Tudo roda em containers Docker com PostgreSQL e MinIO locais.

## Subir agora

```powershell
cd app-cs
docker compose up -d --build
```

Acesse http://localhost:3000.

- Admin: `admin@empresa.com` / `admin123`
- Demais usuários migrados: login pelo nome ou `nome@organograma.local` / `organograma123`
- MinIO Console: http://localhost:9101 (`minioadmin` / `minioadmin123`)

## Ordem de leitura

| Objetivo | Documento |
|---|---|
| Entender a arquitetura | [docs/02-ARQUITETURA.md](docs/02-ARQUITETURA.md) |
| Ver o banco e tabelas | [docs/03-BANCO-DE-DADOS.md](docs/03-BANCO-DE-DADOS.md) |
| Usar a API | [docs/04-API-LOCAL.md](docs/04-API-LOCAL.md) |
| Entender login e contas | [docs/05-LOGIN-E-USUARIOS.md](docs/05-LOGIN-E-USUARIOS.md) |
| Fazer deploy no servidor | [DEPLOY-COMPLETO.md](DEPLOY-COMPLETO.md) |
| Resolver problemas | [docs/07-TROUBLESHOOTING.md](docs/07-TROUBLESHOOTING.md) |
| Saber o que mudou do Supabase | [docs/08-MIGRACAO-SUPABASE.md](docs/08-MIGRACAO-SUPABASE.md) |

## Arquivos importantes

```text
docker-compose.yml       serviços Docker
.env                     senhas e configuração local
database/init/           schema + seed + permissões
backend/                 autenticação e uploads para o MinIO
frontend/                React + proxy Nginx
```

## Avisos

- O `.env` é obrigatório e contém as senhas. Não suba para o Git.
- Troque `POSTGRES_PASSWORD`, `MINIO_SECRET_KEY`, `SECRET_KEY` e `ADMIN_PASSWORD` antes do deploy.
- `docker compose down -v` apaga o banco e os arquivos do MinIO.
