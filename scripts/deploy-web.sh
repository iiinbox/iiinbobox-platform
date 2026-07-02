#!/bin/bash
set -e
cd /opt/iiiiibox

echo "=== Deploy started at $(date) ==="

git pull origin main

corepack enable 2>/dev/null || true
pnpm install --frozen-lockfile

export NEXT_PUBLIC_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" .env | cut -d= -f2-)
pnpm turbo build --filter=@iiiiibox/web

cp -r apps/web/.next/static  apps/web/.next/standalone/apps/web/.next/
cp -r apps/web/public         apps/web/.next/standalone/apps/web/

pm2 restart web

echo "=== Deploy complete at $(date) ==="
