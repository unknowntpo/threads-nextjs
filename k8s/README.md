# Kubernetes Manifests

This directory contains Kubernetes manifests for the Threads Next.js application.

## Files

- `namespace.yaml` - Creates the `threads` namespace
- `postgres.yaml` - PostgreSQL database with persistent volume
- `ml-service.yaml` - ML service deployment
- `nextjs.yaml` - Next.js web application

## Deployment Order

1. Create namespace and secrets first (handled by startup script)
2. Deploy PostgreSQL: `kubectl apply -f postgres.yaml`
3. Wait for PostgreSQL to be ready
4. Deploy ML service: `kubectl apply -f ml-service.yaml`
5. Deploy Next.js: `kubectl apply -f nextjs.yaml`

Or deploy all at once:

```bash
kubectl apply -f k8s/
```

## Environment Variables

These manifests use environment variable substitution for:

- `${POSTGRES_PASSWORD}` - PostgreSQL password

The startup script should substitute these values before applying.

## Secrets Required

Before deploying, ensure these secrets exist in the `threads` namespace:

- `postgres-password` - PostgreSQL password
- `dagster-postgres-password` - Dagster PostgreSQL password
- `gcr-json-key` - Docker registry credentials for pulling images

## Notes

- PostgreSQL uses a 10Gi persistent volume
- Next.js is exposed via NodePort 30000
- ML service is internal only (ClusterIP)
- All services are in the `threads` namespace
