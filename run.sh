#!/usr/bin/env bash
# run.sh — Build and start all three containers independently
set -e

NETWORK=calculator-network

echo "→ Creating network (skipped if already exists)"
docker network create $NETWORK 2>/dev/null || true

# ─── Step 1: Database ──────────────────────────────────────
echo "→ Starting database"
docker run -d \
  --name db-container \
  --network $NETWORK \
  --env-file ./database/.env \
  -p 5432:5432 \
  -v calculator-postgres-data:/var/lib/postgresql/data \
  -v "$(pwd)/database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro" \
  --health-cmd "pg_isready -U postgres -d calculator_db" \
  --health-interval 10s \
  --health-timeout 5s \
  --health-retries 5 \
  --health-start-period 10s \
  --restart unless-stopped \
  postgres:15-alpine

echo "→ Waiting for database to be healthy..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' db-container 2>/dev/null)" = "healthy" ]; do
  sleep 2
done

# ─── Step 2: Backend ───────────────────────────────────────
echo "→ Building backend image"
docker build -t calculator-backend ./backend

echo "→ Starting backend"
docker run -d \
  --name backend-container \
  --network $NETWORK \
  --env-file ./backend/.env \
  -p 3001:3001 \
  --health-cmd "wget -qO- http://localhost:3001/health || exit 1" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  --health-start-period 15s \
  --restart unless-stopped \
  calculator-backend

echo "→ Waiting for backend to be healthy..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' backend-container 2>/dev/null)" = "healthy" ]; do
  sleep 3
done

# ─── Step 3: Frontend ──────────────────────────────────────
echo "→ Building frontend image"
docker build -t calculator-frontend ./frontend

echo "→ Starting frontend"
docker run -d \
  --name frontend-container \
  --network $NETWORK \
  -p 80:80 \
  --restart unless-stopped \
  calculator-frontend

echo ""
echo "✓ All containers running."
echo "  Frontend  → http://localhost"
echo "  Backend   → http://localhost:3001"
echo "  Database  → localhost:5432"
