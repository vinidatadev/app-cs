#!/bin/sh
# Script para rodar NO SERVIDOR via Portainer Console

# Build da aplicação
npm install
npm run build

# Iniciar nginx
nginx -g 'daemon off;'
