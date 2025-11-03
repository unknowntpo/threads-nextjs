# Local Development Setup with Tilt

**Status**: 🚧 Work in Progress
**Last Updated**: 2025-11-03

## Overview

This guide sets up a local Kubernetes development environment using Tilt, Docker Desktop, and Kustomize. You'll be able to develop and test the full application stack locally before deploying to production.

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tilt (tilt up)                                            │  │
│  │  - Watches file changes                                   │  │
│  │  - Builds Docker images locally                           │  │
│  │  - Applies k8s manifests                                  │  │
│  │  - Port forwards services                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Docker Desktop Kubernetes                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ Namespace: threads                                 │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌───────────────┐  ┌───────────────┐            │  │  │
│  │  │  │ nextjs        │  │ ml-service    │            │  │  │
│  │  │  │ :3000         │  │ :8000         │            │  │  │
│  │  │  │ (hot reload)  │  │ (hot reload)  │            │  │  │
│  │  │  └───────────────┘  └───────────────┘            │  │  │
│  │  │           │                  │                     │  │  │
│  │  │           └──────────┬───────┘                     │  │  │
│  │  │                      ▼                             │  │  │
│  │  │              ┌───────────────┐                     │  │  │
│  │  │              │ postgres      │                     │  │  │
│  │  │              │ :5432         │                     │  │  │
│  │  │              │ (persistent)  │                     │  │  │
│  │  │              └───────────────┘                     │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ Port Forwards                       │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ localhost                                                 │  │
│  │  - http://localhost:3000  (nextjs)                        │  │
│  │  - http://localhost:8000  (ml-service)                    │  │
│  │  - http://localhost:5432  (postgres)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Install Docker Desktop

**macOS:**

```bash
brew install --cask docker
```

**Linux:**

```bash
# Follow official Docker installation guide
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

**Enable Kubernetes in Docker Desktop:**

1. Open Docker Desktop
2. Settings → Kubernetes → Enable Kubernetes
3. Apply & Restart

**Verify:**

```bash
kubectl cluster-info
# Should show: Kubernetes control plane is running at https://kubernetes.docker.internal:6443
```

### 2. Install Tilt

**macOS:**

```bash
brew install tilt
```

**Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash
```

**Verify:**

```bash
tilt version
# Should show: v0.33.x or newer
```

### 3. Install Additional Tools

```bash
# Kustomize (for k8s manifest management)
brew install kustomize

# Helm (for package management)
brew install helm

# kubectl (if not already installed)
brew install kubectl
```

## Project Structure

```
threads-nextjs/
├── Tiltfile                          # Tilt configuration
├── k8s/
│   ├── base/                         # Shared k8s resources
│   │   ├── namespace.yaml
│   │   ├── postgres.yaml
│   │   ├── ml-service.yaml
│   │   ├── nextjs.yaml
│   │   └── kustomization.yaml
│   └── overlays/
│       ├── local/                    # Local dev configs
│       │   ├── kustomization.yaml
│       │   ├── local-secrets.yaml
│       │   └── service-overrides.yaml
│       └── prod/                     # Production configs
│           └── kustomization.yaml
├── app/                              # Next.js app
├── ml-service/                       # ML service
└── docs/
    └── local-development-setup.md    # This file
```

## Quick Start

### 1. Create Local Secrets

Create secrets for local development:

```bash
# Create namespace first
kubectl create namespace threads

# Create NextAuth secrets
kubectl create secret generic nextauth-secret \
  --from-literal=secret="dev-secret-change-in-production-$(openssl rand -hex 16)" \
  --from-literal=alice_password="<GENERATED_HASH>" \
  --from-literal=bob_password="<GENERATED_HASH>" \
  -n threads

# Create postgres password
kubectl create secret generic postgres-password \
  --from-literal=password="local-dev-password" \
  -n threads
```

Or apply via kustomize:

```bash
kubectl apply -k k8s/overlays/local
```

### 2. Start Tilt

```bash
# From project root
tilt up

# View Tilt UI in browser (auto-opens)
# http://localhost:10350
```

### 3. Access Services

**Next.js App:**

```bash
open http://localhost:3000
```

**ML Service:**

```bash
curl http://localhost:8000/health
```

**PostgreSQL:**

```bash
psql postgresql://postgres:local-dev-password@localhost:5432/threads
```

### 4. Make Code Changes

Tilt watches for file changes and automatically:

1. Rebuilds Docker image (if Dockerfile changed)
2. Syncs code changes (live reload for Next.js)
3. Restarts pods if needed

**Test live reload:**

```bash
# Edit app/page.tsx
# Save
# Browser auto-refreshes with changes
```

### 5. View Logs

**In Tilt UI:**

- Click on service name (nextjs, ml-service, postgres)
- View real-time logs

**In Terminal:**

```bash
# All logs
kubectl logs -f -l app=nextjs -n threads

# Specific pod
kubectl logs -f nextjs-xxxxx -n threads
```

### 6. Stop Development

```bash
# In Tilt UI: Press 'q' or close browser
# Or Ctrl+C in terminal

# Clean up resources (optional)
kubectl delete namespace threads
```

## Tiltfile Configuration

See [Tiltfile](/Tiltfile) for full configuration. Key features:

### Docker Build

```python
# Build Next.js image locally
docker_build(
  'nextjs-local',
  context='.',
  dockerfile='Dockerfile',
  live_update=[
    sync('./app', '/app/app'),
    sync('./package.json', '/app/package.json'),
  ]
)
```

### Kubernetes Resources

```python
# Apply local k8s configs
k8s_yaml(kustomize('k8s/overlays/local'))

# Configure resources
k8s_resource(
  'nextjs',
  port_forwards=['3000:3000'],
  labels=['frontend']
)
```

### Resource Dependencies

```python
# Ensure postgres starts before nextjs
k8s_resource(
  'nextjs',
  resource_deps=['postgres']
)
```

## Environment Variables

### Local Development

Secrets are managed via Kubernetes secrets:

```yaml
# k8s/overlays/local/local-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: nextauth-secret
  namespace: threads
stringData:
  secret: 'dev-secret-for-local'
  alice_password: '<GENERATED_HASH>'
  bob_password: '<GENERATED_HASH>'
```

### Accessing in Pods

```yaml
# nextjs.yaml
env:
  - name: AUTH_SECRET
    valueFrom:
      secretKeyRef:
        name: nextauth-secret
        key: secret
  - name: AUTH_URL
    value: 'http://localhost:3000'
```

## Database Management

### PostgreSQL Persistence

**Local development uses emptyDir (non-persistent):**

```yaml
# k8s/overlays/local/postgres-override.yaml
spec:
  template:
    spec:
      volumes:
        - name: postgres-data
          emptyDir: {} # Data lost on pod restart
```

**To persist data:**

```yaml
volumes:
  - name: postgres-data
    hostPath:
      path: /tmp/postgres-data # Or use PVC
```

### Database Migrations

```bash
# Run migrations
kubectl exec -it deployment/nextjs -n threads -- pnpm prisma migrate deploy

# Generate Prisma client
kubectl exec -it deployment/nextjs -n threads -- pnpm prisma generate

# Seed database
kubectl exec -it deployment/nextjs -n threads -- pnpm prisma db seed
```

## Troubleshooting

### Pods Not Starting

**Check pod status:**

```bash
kubectl get pods -n threads
kubectl describe pod <pod-name> -n threads
```

**Common issues:**

- ImagePullBackOff: Docker build failed, check Tilt logs
- CrashLoopBackOff: App error, check pod logs
- Pending: Resource constraints, increase Docker Desktop memory

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Tilt Not Rebuilding

```bash
# Force rebuild
tilt up --stream  # Or press 'R' in Tilt UI
```

### Database Connection Issues

**Check postgres pod:**

```bash
kubectl logs -f deployment/postgres -n threads
```

**Test connection:**

```bash
kubectl exec -it deployment/postgres -n threads -- psql -U postgres -d threads
```

## Differences from Production

| Aspect             | Local             | Production                         |
| ------------------ | ----------------- | ---------------------------------- |
| **Kubernetes**     | Docker Desktop    | GCE VM + k0s                       |
| **Secrets**        | Plain K8s Secrets | External Secrets Operator + GCP SM |
| **Ingress**        | Port Forward      | Cloudflare Tunnel                  |
| **Storage**        | emptyDir          | PersistentVolume                   |
| **Image Registry** | Local build       | GCR (us-east1-docker.pkg.dev)      |
| **CI/CD**          | None              | GitHub Actions + ArgoCD            |
| **Monitoring**     | Tilt UI           | GCP Cloud Monitoring               |

## Best Practices

### Development Workflow

1. **Create feature branch:**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Start Tilt:**

   ```bash
   tilt up
   ```

3. **Make changes:**
   - Edit code
   - Tilt auto-rebuilds and reloads

4. **Test locally:**
   - Access http://localhost:3000
   - Run tests: `kubectl exec -it deployment/nextjs -n threads -- pnpm test`

5. **Commit and push:**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

6. **CI runs:**
   - GitHub Actions builds production images
   - ArgoCD deploys to production (if merged to master)

### Resource Limits

Docker Desktop defaults to **2GB RAM, 2 CPUs**. Increase for better performance:

**Settings → Resources:**

- Memory: 8GB
- CPUs: 4
- Swap: 2GB

### Clean Up

**Periodic cleanup:**

```bash
# Delete unused images
docker system prune -a

# Delete stopped containers
docker container prune

# Delete unused volumes
docker volume prune
```

## Next Steps

1. **Set up OAuth (optional):**
   - Create Google/GitHub OAuth apps
   - Add client ID/secret to local secrets

2. **Test full workflow:**
   - Make code change
   - Verify in local
   - Push to GitHub
   - Deploy to production

3. **Explore Tilt features:**
   - [Tilt Extensions](https://docs.tilt.dev/extensions.html)
   - [Tilt API](https://docs.tilt.dev/api.html)
   - [Custom Buttons](https://docs.tilt.dev/buttons.html)

## References

- [Tilt Documentation](https://docs.tilt.dev/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)

## Support

**Issues?** Check:

1. [Troubleshooting](#troubleshooting) section above
2. Tilt logs: `tilt logs`
3. Kubernetes events: `kubectl get events -n threads --sort-by='.lastTimestamp'`
4. GitHub Issues: [threads-nextjs/issues](https://github.com/unknowntpo/threads-nextjs/issues)
