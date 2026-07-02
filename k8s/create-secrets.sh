#!/bin/bash
# Reads values from /opt/iiiiibox/.env and creates the K8s secret
set -e

ENV_FILE="/opt/iiiiibox/.env"

get() { grep "^$1=" "$ENV_FILE" | cut -d= -f2-; }

kubectl create secret generic iiiiibox-secrets \
  --namespace=iiiiibox \
  --from-literal=POSTGRES_USER="$(get POSTGRES_USER)" \
  --from-literal=POSTGRES_PASSWORD="$(get POSTGRES_PASSWORD)" \
  --from-literal=POSTGRES_DB="$(get POSTGRES_DB)" \
  --from-literal=DATABASE_URL="$(get DATABASE_URL)" \
  --from-literal=JWT_SECRET="$(get JWT_SECRET)" \
  --from-literal=JWT_REFRESH_SECRET="$(get JWT_REFRESH_SECRET)" \
  --from-literal=MINIO_ROOT_USER="$(get MINIO_ROOT_USER)" \
  --from-literal=MINIO_ROOT_PASSWORD="$(get MINIO_ROOT_PASSWORD)" \
  --from-literal=MEILISEARCH_MASTER_KEY="$(get MEILISEARCH_MASTER_KEY)" \
  --from-literal=NEXT_PUBLIC_API_URL="$(get NEXT_PUBLIC_API_URL)" \
  --from-literal=RAZORPAY_KEY_ID="$(get RAZORPAY_KEY_ID)" \
  --from-literal=RAZORPAY_KEY_SECRET="$(get RAZORPAY_KEY_SECRET)" \
  --from-literal=RAZORPAY_WEBHOOK_SECRET="$(get RAZORPAY_WEBHOOK_SECRET)" \
  --from-literal=GITHUB_WEBHOOK_SECRET="$(get GITHUB_WEBHOOK_SECRET)" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secret applied."
