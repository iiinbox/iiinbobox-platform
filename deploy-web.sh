#!/usr/bin/env bash
# Deploy web app to PM2 after a fresh build.
# Run from repo root: ./deploy-web.sh
set -e

STANDALONE_ROOT=/opt/iiiiibox/apps/web/.next/standalone
STATIC_DEST=$STANDALONE_ROOT/apps/web/.next/static
PUBLIC_DEST=$STANDALONE_ROOT/apps/web/public

echo "→ Syncing standalone server..."
rsync -a --delete apps/web/.next/standalone/ "$STANDALONE_ROOT/"

echo "→ Copying static assets..."
mkdir -p "$STATIC_DEST"
rsync -a --delete apps/web/.next/static/ "$STATIC_DEST/"

echo "→ Copying public assets..."
mkdir -p "$PUBLIC_DEST"
rsync -a --delete apps/web/public/ "$PUBLIC_DEST/"

echo "→ Restarting PM2..."
pm2 restart web --update-env

echo "✓ Done"
