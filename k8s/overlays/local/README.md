# Local Development Overlay

This overlay configures Kubernetes resources for local development with Tilt and Docker Desktop.

## Quick Start

### 1. Create Namespace and Secrets

```bash
# Create namespace
kubectl create namespace threads

# Create secrets
kubectl create secret generic nextauth-secret \
  --from-literal=secret="dev-secret-$(openssl rand -hex 16)" \
  --from-literal=alice_password="0534fcde3061dd177f45a9092712cbb83beeda8d" \
  --from-literal=bob_password="0534fcde3061dd177f45a9092712cbb83beeda8d" \
  -n threads

kubectl create secret generic postgres-password \
  --from-literal=password="local-dev-password" \
  -n threads
```

### 2. Apply Manifests

**Option A: Via Tilt (Recommended)**

```bash
# From project root
tilt up
```

**Option B: Via kubectl**

```bash
# From project root
kubectl apply -k k8s/overlays/local
```

## Configuration Files

### kustomization.yaml

Main kustomize configuration:

- References base k8s manifests
- Applies local-specific patches
- Replaces production images with local builds

### image-overrides.yaml

Configures local Docker images:

- `nextjs-local:latest` (built by Tilt)
- `ml-service-local:latest` (built by Tilt)
- Removes `imagePullSecrets` (not needed locally)

### postgres-storage-override.yaml

Uses `emptyDir` for PostgreSQL storage:

- **Pros**: Fast, no setup
- **Cons**: Data lost on pod restart

For persistent storage, edit to use `hostPath`:

```yaml
volumes:
  - name: postgres-data
    hostPath:
      path: /tmp/postgres-data
      type: DirectoryOrCreate
```

## Differences from Production

| Aspect       | Local              | Production                                     |
| ------------ | ------------------ | ---------------------------------------------- |
| **Images**   | Local build        | GCR                                            |
| **Secrets**  | Manual K8s secrets | External Secrets Operator + GCP SM             |
| **Storage**  | emptyDir           | PersistentVolume                               |
| **Ingress**  | Port forward       | Cloudflare Tunnel                              |
| **Replicas** | 1                  | Varies (nextjs: 1, ml-service: 1, postgres: 1) |

## Troubleshooting

### Secrets Not Found

```bash
# Check if secrets exist
kubectl get secrets -n threads

# Recreate if missing
kubectl delete secret nextauth-secret postgres-password -n threads
# Then create again (see Quick Start)
```

### Images Not Pulling

```bash
# Check if Tilt built images
docker images | grep -E "nextjs-local|ml-service-local"

# Rebuild with Tilt
tilt up --stream
```

### Postgres Data Lost

This is expected with `emptyDir`. For persistence:

1. Edit `postgres-storage-override.yaml`
2. Change `emptyDir` to `hostPath`
3. Reapply: `kubectl apply -k k8s/overlays/local`

## See Also

- [Local Development Setup](../../../docs/local-development-setup.md)
- [Tiltfile](../../../Tiltfile)
- [Secret Management Strategy](../../../docs/secret-management-strategy.md)
