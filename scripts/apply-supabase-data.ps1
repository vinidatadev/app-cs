param(
  [string]$SqlPath = "database/init/03-supabase-data.sql",
  [string]$Container = "organograma-postgres",
  [string]$Database = "organograma",
  [string]$User = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SqlPath)) {
  Write-Error "Arquivo não encontrado: $SqlPath. Rode scripts/export-supabase-data.mjs primeiro."
  exit 1
}

Write-Output "Copiando $SqlPath para o container $Container..."
docker cp $SqlPath "${Container}:/tmp/03-supabase-data.sql"

Write-Output "Aplicando dados no banco $Database..."
docker exec $Container psql -U $User -d $Database -v ON_ERROR_STOP=1 -f /tmp/03-supabase-data.sql

Write-Output "Reiniciando backend para semear novos arquivos no MinIO..."
docker compose restart backend

Write-Output "Concluído."
