#!/bin/bash
# Run once after installing Rancher Desktop to bootstrap the cluster
set -e

echo "=== iiiiiBOX Kubernetes Setup ==="

# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets from .env
bash k8s/create-secrets.sh

# 3. Apply all workloads
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/meilisearch.yaml
kubectl apply -f k8s/ingress.yaml

echo ""
echo "Waiting for Postgres to be ready..."
kubectl rollout status deployment/postgres -n iiiiibox --timeout=120s

echo ""
echo "=== Base services up. Deploy API next: ==="
echo "  1. Push to main — GitHub Actions will build & push the API image"
echo "  2. Or manually: kubectl apply -f k8s/api.yaml"
echo ""
echo "kubectl get pods -n iiiiibox"
