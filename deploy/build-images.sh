#!/bin/sh
set -eu

docker build -t organograma-backend:latest ./backend
docker build \
  --build-arg VITE_FLOWCHECK_URL="${VITE_FLOWCHECK_URL:-https://flowcheck-three.vercel.app/home}" \
  -t organograma-frontend:latest \
  ./frontend

echo "Imagens criadas: organograma-backend:latest e organograma-frontend:latest"
echo "Agora use deploy/portainer-stack.yml no Portainer."
