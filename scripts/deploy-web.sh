#!/bin/bash
set -e
cd /opt/iiiiibox

echo "=== Deploy started at $(date) ==="

git pull origin main

corepack enable 2>/dev/null || true
pnpm install --frozen-lockfile

set -a && source .env && set +a
export API_INTERNAL_URL=http://localhost:4000
pnpm turbo build --filter=@iiiiibox/web

cp -r apps/web/.next/static  apps/web/.next/standalone/apps/web/.next/
cp -r apps/web/public         apps/web/.next/standalone/apps/web/

pm2 restart web --update-env

echo "=== Deploy complete at $(date) ==="
