#!/bin/sh
set -eu

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Criei o .env. Edite POSTGRES_PASSWORD, MINIO_*, SECRET_KEY e ADMIN_PASSWORD e rode novamente."
  exit 1
fi

echo "Construindo imagens..."
docker compose build

echo "Subindo containers..."
docker compose up -d --no-build
docker compose ps

echo "Pronto. Acesse http://IP_DO_SERVIDOR:3000"
