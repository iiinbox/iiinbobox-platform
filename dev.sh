#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
# iiinbox local dev — hot reload for web + API
# ─────────────────────────────────────────────

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# 1. Ensure infrastructure containers are running
echo "▶ Starting infrastructure containers..."
docker compose up -d postgres minio meilisearch
echo ""

# 2. Wait for postgres to be ready
until docker exec iiiiibox-postgres-1 pg_isready -U postgres >/dev/null 2>&1; do
  sleep 1
done
echo "✅ Postgres ready"

# 3. Run any pending migrations
export DATABASE_URL="postgresql://postgres:IiinboxSecure2024@localhost:5433/iiiiibox"
pnpm --filter @iiiiibox/database exec prisma migrate deploy 2>/dev/null || true

# 4. Start API in watch mode (hot reload for backend too)
echo ""
echo "▶ Starting API on :4000 (watch mode)..."
DATABASE_URL="postgresql://postgres:IiinboxSecure2024@localhost:5433/iiiiibox" \
  JWT_SECRET=devsecret \
  JWT_REFRESH_SECRET=devrefresh \
  MINIO_ENDPOINT=localhost \
  MINIO_PORT=9000 \
  MINIO_ROOT_USER=minioadmin \
  MINIO_ROOT_PASSWORD=minioadmin \
  MINIO_BUCKET=iiiiibox-uploads \
  MINIO_PUBLIC_URL=http://localhost:9000 \
  RAZORPAY_WEBHOOK_SECRET=devwebhooksecret \
  PORT=4000 \
  pnpm --filter @iiiiibox/api exec nest start --watch &
API_PID=$!

# Give the API a moment to start
sleep 4

# 5. Start Next.js dev server (hot reload for UI)
echo ""
echo "▶ Starting web on :3000 (hot reload)..."
echo "   → Open http://localhost:3000"
echo "   → Save any file in apps/web/src → browser updates instantly"
echo ""
pnpm --filter @iiiiibox/web exec next dev &
WEB_PID=$!

# Trap Ctrl+C to kill both
trap "echo ''; echo 'Stopping...'; kill $API_PID $WEB_PID 2>/dev/null; exit 0" INT TERM

wait
