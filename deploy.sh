#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
# deploy.sh – Despliega PinataPoster en Oracle Cloud VM
# ══════════════════════════════════════════════════════════
# Uso desde tu PC (Windows / Git Bash / WSL):
#   bash deploy.sh
#
# Requisitos en la VM:
#   - Docker y Docker Compose instalados
#   - Puerto 80 abierto en Security List de Oracle Cloud
# ══════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuración ─────────────────────────────────────────
VM_USER="ubuntu"
VM_HOST="163.192.153.190"
VM_DIR="/home/ubuntu/pinataposter"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"

echo "══════════════════════════════════════════════════════"
echo "  Desplegando PinataPoster → ${VM_USER}@${VM_HOST}"
echo "══════════════════════════════════════════════════════"

# ── 1. Crear directorio en la VM ──────────────────────────
echo "→ Preparando directorio remoto..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${VM_USER}@${VM_HOST}" \
  "mkdir -p ${VM_DIR}/nginx"

# ── 2. Sincronizar archivos ──────────────────────────────
echo "→ Subiendo archivos al servidor..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude '.env.development' \
  --exclude '*.pub' \
  --exclude '*.key' \
  --exclude 'ssh-key*' \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
  ./ "${VM_USER}@${VM_HOST}:${VM_DIR}/"

# ── 3. Subir .env si existe ──────────────────────────────
if [ -f ".env.production" ]; then
  echo "→ Subiendo .env.production como .env..."
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    .env.production "${VM_USER}@${VM_HOST}:${VM_DIR}/.env"
fi

# ── 4. Build y deploy en la VM ────────────────────────────
echo "→ Construyendo y levantando contenedores..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${VM_USER}@${VM_HOST}" << 'REMOTE'
  cd /home/ubuntu/pinataposter

  # Instalar Docker si no está
  if ! command -v docker &> /dev/null; then
    echo "→ Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "⚠ Docker instalado. Cierra sesión y reconecta para que tome efecto."
    echo "  Luego vuelve a ejecutar: bash deploy.sh"
    exit 1
  fi

  # Instalar Docker Compose plugin si no está
  if ! docker compose version &> /dev/null; then
    echo "→ Instalando Docker Compose plugin..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
  fi

  # Build y restart
  docker compose down --remove-orphans 2>/dev/null || true
  docker compose up -d --build

  echo ""
  echo "══════════════════════════════════════════════════════"
  echo "  ✅ PinataPoster desplegado correctamente"
  echo "  🌐 http://163.192.153.190"
  echo "══════════════════════════════════════════════════════"
  echo ""
  docker compose ps
REMOTE

echo ""
echo "¡Deploy completado! 🎉"
