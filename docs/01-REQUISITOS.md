# 01 - Requisitos

## Obrigatórios

- Docker Desktop/Engine
- Docker Compose v2 (`docker compose`)
- Portas livres: 3000, 5432, 8000, 3001, 9100 e 9101
- Cerca de 1,5 GB de RAM disponível para a stack

## Opcionais (desenvolvimento sem Docker)

- Node.js 18+
- Python 3.11+
- npm 9+

## Verificar

```powershell
docker --version
docker compose version
```

## Teste rápido de portas

```powershell
Test-NetConnection localhost -Port 3000
Test-NetConnection localhost -Port 8000
Test-NetConnection localhost -Port 5432
Test-NetConnection localhost -Port 9100
```
