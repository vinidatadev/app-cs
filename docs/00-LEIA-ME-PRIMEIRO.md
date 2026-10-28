# 00 - Leia-me primeiro

## Stack

- Frontend React + Nginx
- Backend FastAPI (auth e uploads)
- PostgREST (CRUD REST)
- PostgreSQL 15
- MinIO (storage S3 local)

## Subir

```powershell
docker compose up -d --build
```

## URLs

| Recurso | URL |
|---|---|
| Aplicação | http://localhost:3000 |
| Backend / Swagger | http://localhost:8000/docs |
| Health | http://localhost:8000/health |
| PostgREST | http://localhost:3001 |
| Postgres | localhost:5432 |
| MinIO Console | http://localhost:9101 |

## Login inicial

- Admin: `admin@empresa.com` / `admin123`
- Usuários migrados: nome cadastrado / `organograma123`

## Documentos

1. [01-REQUISITOS.md](01-REQUISITOS.md)
2. [02-ARQUITETURA.md](02-ARQUITETURA.md)
3. [03-BANCO-DE-DADOS.md](03-BANCO-DE-DADOS.md)
4. [04-API-LOCAL.md](04-API-LOCAL.md)
5. [05-LOGIN-E-USUARIOS.md](05-LOGIN-E-USUARIOS.md)
6. [06-DEPLOY-PORTAINER.md](06-DEPLOY-PORTAINER.md)
7. [07-TROUBLESHOOTING.md](07-TROUBLESHOOTING.md)
8. [08-MIGRACAO-SUPABASE.md](08-MIGRACAO-SUPABASE.md)
9. [09-BACKUP-RESTORE.md](09-BACKUP-RESTORE.md)
10. [10-MIGRACAO-DADOS-SUPABASE.md](10-MIGRACAO-DADOS-SUPABASE.md)
