#!/bin/bash
# Actualizar containers con nuevas variables de .env
# Uso: ./update-env.sh          (solo recrea containers)
#      ./update-env.sh --build  (rebuild imagen + recrea)
set -e
cd ~/apps/pinataposter

if [ "$1" = "--build" ]; then
  echo "[*] Rebuild + recreate containers..."
  docker compose up -d --build
else
  echo "[*] Recreate containers (sin rebuild)..."
  docker compose up -d --force-recreate
fi

echo "[*] Verificando variables..."
docker exec pinataposter-app-1 printenv | grep -E "GOOGLE|STRIPE|REPLICATE|NEXTAUTH" | sed 's/=.\{8\}/=****.../' 
echo "[OK] Containers actualizados con .env actual"
