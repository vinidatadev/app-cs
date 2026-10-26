# 09 - Backup e restauração

## Backup do banco

```powershell
docker exec organograma-postgres pg_dump -U postgres -d organograma -Fc -f /tmp/organograma.dump
docker cp organograma-postgres:/tmp/organograma.dump .\backup-organograma.dump
```

## Restauração do banco

```powershell
docker cp .\backup-organograma.dump organograma-postgres:/tmp/organograma.dump
docker exec -it organograma-postgres pg_restore -U postgres -d organograma --clean --if-exists /tmp/organograma.dump
```

## Backup dos arquivos (MinIO)

Recomendado, sem parar o serviço:

```powershell
docker exec organograma-minio sh -lc "mc alias set local http://localhost:9000 minioadmin minioadmin123 >/dev/null && rm -rf /tmp/backup && mkdir -p /tmp/backup && mc mirror local /tmp/backup"
docker cp organograma-minio:/tmp/backup .\minio-backup
```

Ajuste usuário/senha se você trocou `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`.

Alternativa: backup bruto do volume (pare o MinIO antes):

```powershell
docker compose stop minio
docker run --rm -v app-cs_minio_data:/data -v ${PWD}:/backup alpine tar czf /backup/minio-backup.tar.gz -C /data .
docker compose start minio
```

O nome do volume pode variar conforme a pasta/stack. Confira com:

```powershell
docker volume ls
```

## Restaurar arquivos

Com o MinIO rodando:

```powershell
docker cp .\minio-backup organograma-minio:/tmp/backup
docker exec organograma-minio sh -lc "mc alias set local http://localhost:9000 minioadmin minioadmin123 >/dev/null && mc mirror --overwrite /tmp/backup local"
```

## Backup completo sugerido

1. `pg_dump` do banco.
2. Backup do MinIO (`mc mirror` ou volume).
3. Cópia do `.env` em local seguro (contém segredos).
4. Guardar a versão do código (tag/commit).

## Antes de atualizar

```powershell
docker compose down
# fazer backup
docker compose up -d --build
```

Evite `docker compose down -v` sem backup.
