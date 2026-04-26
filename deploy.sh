#!/usr/bin/env bash
# Deploy ObservaBox to a VPS.
# Usage: ./deploy.sh user@your-vps-ip
# Prerequisites:
#   - SSH key-based access to the VPS
#   - .env.prod file exists (copy from .env.prod.example and fill in)
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Usage: ./deploy.sh user@your-vps-ip"
  exit 1
fi

ENV_FILE=".env.prod"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found. Copy .env.prod.example → .env.prod and fill in values."
  exit 1
fi

REMOTE_DIR="/opt/observabox"
echo "==> Deploying to $TARGET:$REMOTE_DIR"

# ── 1. First-time VPS bootstrap (idempotent) ──────────────────────────────────
echo "==> Bootstrapping VPS..."
ssh "$TARGET" "bash -s" < infra/setup-vps.sh

# ── 2. Sync code ──────────────────────────────────────────────────────────────
echo "==> Syncing code..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='data' \
  --exclude='.env*' \
  ./ "$TARGET:$REMOTE_DIR/"

# ── 3. Upload production env ──────────────────────────────────────────────────
echo "==> Uploading .env.prod..."
scp "$ENV_FILE" "$TARGET:$REMOTE_DIR/.env.prod"

# ── 4. Build and start services ───────────────────────────────────────────────
echo "==> Building and starting containers..."
ssh "$TARGET" bash << ENDSSH
  set -euo pipefail
  cd $REMOTE_DIR
  cp .env.prod .env

  # Pull latest images
  docker compose -f docker-compose.prod.yml pull caddy clickhouse

  # Build app images
  docker compose -f docker-compose.prod.yml build --parallel ingestion dashboard

  # Rolling restart: stop old, start new
  docker compose -f docker-compose.prod.yml up -d --remove-orphans

  echo ""
  echo "==> Containers:"
  docker compose -f docker-compose.prod.yml ps
ENDSSH

echo ""
echo "✓ Deployment complete!"
echo ""
# Read domain from .env.prod
DOMAIN=$(grep ^DOMAIN= "$ENV_FILE" | cut -d= -f2)
echo "  Dashboard  → https://$DOMAIN"
echo "  Ingestion  → https://ingest.$DOMAIN"
echo ""
echo "DNS: Make sure both $DOMAIN and ingest.$DOMAIN have A records pointing to your VPS IP."
echo "SSL: Caddy will automatically provision HTTPS certificates on first request."
