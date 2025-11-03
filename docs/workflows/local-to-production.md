# Local to Production Workflow

**Last Updated**: 2025-11-03

## Overview

This document describes the complete development and deployment workflow from local development to production, covering code changes, testing, CI/CD, and deployment.

## Architecture Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT WORKFLOW                               │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
│   Developer  │ --> │ Local Tilt   │ --> │   GitHub     │ --> │   GitHub   │
│   Workstation│     │   Testing    │     │     Repo     │     │   Actions  │
└──────────────┘     └──────────────┘     └──────────────┘     └────────────┘
       │                     │                     │                    │
       │                     │                     │                    │
       ▼                     ▼                     ▼                    ▼
  Edit Code            Test Locally          git push              Build Images
  Run Tests            Hot Reload            Create PR             Run Tests
                       Port Forward                                Push to GCR

                                                                        │
┌───────────────────────────────────────────────────────────────────────┘
│
│     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
└──>  │   ArgoCD     │ --> │  Kubernetes  │ --> │  Production  │
      │ Image Updater│     │    Cluster   │     │     Live     │
      └──────────────┘     └──────────────┘     └──────────────┘
             │                     │                    │
             │                     │                    │
             ▼                     ▼                    ▼
      Detect new       Sync manifests        https://threads.
      image tags       Deploy pods           unknowntpo.com
      Update git       Rolling restart
```

## Detailed Workflow

### 1. Local Development

#### Setup

```bash
# One-time setup
git clone https://github.com/unknowntpo/threads-nextjs.git
cd threads-nextjs

# Install dependencies
pnpm install

# Create local secrets
kubectl create namespace threads
kubectl create secret generic nextauth-secret \
  --from-literal=secret="dev-secret-$(openssl rand -hex 16)" \
  --from-literal=alice_password="0534fcde3061dd177f45a9092712cbb83beeda8d" \
  --from-literal=bob_password="0534fcde3061dd177f45a9092712cbb83beeda8d" \
  -n threads
kubectl create secret generic postgres-password \
  --from-literal=password="local-dev-password" \
  -n threads

# Start Tilt
tilt up
```

#### Development Loop

```
┌─────────────────────────────────────────┐
│         Local Development Loop          │
├─────────────────────────────────────────┤
│                                         │
│  1. Edit code (app/, components/, etc.) │
│           │                             │
│           ▼                             │
│  2. Tilt detects changes                │
│           │                             │
│           ▼                             │
│  3. Tilt rebuilds/syncs code            │
│     (live update for Next.js)           │
│           │                             │
│           ▼                             │
│  4. Pod restarts (if needed)            │
│           │                             │
│           ▼                             │
│  5. Browser auto-refreshes              │
│     http://localhost:3000               │
│           │                             │
│           ▼                             │
│  6. Test changes manually               │
│           │                             │
│           └─────> Repeat                │
│                                         │
└─────────────────────────────────────────┘
```

#### Local Environment Details

```
Docker Desktop K8s:
├── Namespace: threads
│   ├── nextjs (1 replica)
│   │   ├── Image: nextjs-local:latest (local build)
│   │   ├── Port: 3000 (forwarded to localhost:3000)
│   │   ├── Env: AUTH_SECRET (from K8s secret)
│   │   └── Hot reload: Yes (Tilt live_update)
│   │
│   ├── ml-service (1 replica)
│   │   ├── Image: ml-service-local:latest (local build)
│   │   ├── Port: 8000 (forwarded to localhost:8000)
│   │   └── Hot reload: Yes (Tilt live_update)
│   │
│   └── postgres (1 replica)
│       ├── Image: postgres:16
│       ├── Port: 5432 (forwarded to localhost:5432)
│       ├── Storage: emptyDir (ephemeral)
│       └── Data: Lost on pod restart
│
└── Secrets:
    ├── nextauth-secret (manual kubectl create)
    └── postgres-password (manual kubectl create)
```

### 2. Testing

#### Local Testing

```bash
# Run in Tilt UI (custom buttons):
# - "test-nextjs": Unit/integration tests
# - "lint": ESLint + Prettier
# - "db-migrate": Prisma migrations
# - "db-seed": Seed test data

# Or manually:
kubectl exec -it deployment/nextjs -n threads -- pnpm test
kubectl exec -it deployment/nextjs -n threads -- pnpm lint
```

#### Manual Testing Checklist

- [ ] Homepage loads (http://localhost:3000)
- [ ] Auth flow works (login/logout)
- [ ] Create/read threads works
- [ ] ML service returns predictions (http://localhost:8000/predict)
- [ ] Database persists data (until pod restart)

### 3. Commit & Push

#### Create Feature Branch

```bash
git checkout -b feature/my-feature
```

#### Make Changes

```bash
# Edit code, test locally with Tilt
vim app/page.tsx

# Check Tilt UI for live reload
# Test at http://localhost:3000
```

#### Commit

```bash
git add .
git commit -m "feat: add new feature"

# Pre-commit hook runs (lint-staged):
# - ESLint on *.ts, *.tsx files
# - Prettier on *.json, *.md files
```

#### Push

```bash
git push origin feature/my-feature
```

### 4. GitHub Actions (CI)

**Triggered on:** `push` to any branch

#### Build Workflow

```yaml
# .github/workflows/deploy-gcp.yml

Jobs:
  1. Build Next.js Image
     ├── Checkout code
     ├── Set up Docker Buildx
     ├── Authenticate to GCR (GCP Artifact Registry)
     ├── Build Docker image (linux/amd64)
     ├── Tag: us-east1-docker.pkg.dev/.../nextjs:<git-sha>
     └── Push to GCR

  2. Build ML Service Image
     ├── Same as above
     ├── Tag: us-east1-docker.pkg.dev/.../ml-service:<git-sha>
     └── Push to GCR
```

**Artifacts:**

```
GCR (Artifact Registry):
├── nextjs:<commit-sha>
│   └── Example: nextjs:ac8347e944b9815dcfc25d2f1f
└── ml-service:<commit-sha>
    └── Example: ml-service:ac8347e944b9815dcfc25d2f1f
```

**Timeline:**

- Build time: ~5-7 minutes
- Push time: ~1-2 minutes
- **Total: ~8-10 minutes**

### 5. ArgoCD Image Updater

**Triggered:** Every 2 minutes (automatic polling)

#### Detection

```
ArgoCD Image Updater:
├── Checks GCR for new image tags
├── Compares with current deployment
└── Detects: "New image available!"

Example:
  Current: nextjs:df7f275a1e...
  Latest:  nextjs:ac8347e944...  <-- NEW!
```

#### Update Process

```
1. Image Updater finds new image in GCR
           │
           ▼
2. Updates k8s manifest in git:
   - k8s/base/nextjs.yaml
   - k8s/base/ml-service.yaml
   (Creates commit via ArgoCD write-back)
           │
           ▼
3. ArgoCD detects manifest change
           │
           ▼
4. ArgoCD syncs deployment
           │
           ▼
5. Kubernetes pulls new image from GCR
           │
           ▼
6. Pods restart with new image
```

**Annotations** (terraform/modules/argocd-app/threads-app.yaml):

```yaml
annotations:
  argocd-image-updater.argoproj.io/image-list: nextjs=us-east1-docker.pkg.dev/.../nextjs:latest
  argocd-image-updater.argoproj.io/nextjs.update-strategy: latest
  argocd-image-updater.argoproj.io/write-back-method: argocd
```

**Timeline:**

- Check interval: 2 minutes
- Update + sync: ~1-2 minutes
- **Total: ~3-4 minutes after image push**

### 6. ArgoCD Sync

**Triggered:**

- Manual (via ArgoCD UI/CLI)
- Automatic (every 3 minutes)
- Git webhook (if configured)

#### Sync Process

```
ArgoCD:
├── Compares git repo (k8s/base) with cluster state
├── Detects drift (new image tags, config changes)
├── Applies changes (kubectl apply)
└── Reports status: Synced/Healthy
```

#### Deployment Strategy

```yaml
# Rolling update (default)
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # 1 extra pod during update
      maxUnavailable: 0 # Keep at least 1 pod running
```

**Timeline:**

- Sync time: ~30-60 seconds
- Pod restart: ~30-60 seconds
- **Total: ~1-2 minutes**

### 7. Production Deployment

**Environment:** GCE VM (e2-standard-2) running k0s

#### Production Stack

```
GCE VM (k0s):
├── Namespace: threads
│   ├── nextjs (1 replica)
│   │   ├── Image: us-east1-docker.pkg.dev/.../nextjs:<sha>
│   │   ├── Env: AUTH_SECRET (from External Secrets Operator)
│   │   ├── Service: ClusterIP
│   │   └── Ingress: Via Cloudflare Tunnel
│   │
│   ├── ml-service (1 replica)
│   │   ├── Image: us-east1-docker.pkg.dev/.../ml-service:<sha>
│   │   └── Service: ClusterIP
│   │
│   ├── postgres (1 replica)
│   │   ├── Image: postgres:16
│   │   ├── Storage: PVC (10Gi, local-path)
│   │   └── Persistent: Yes
│   │
│   └── cloudflared (2 replicas, HA)
│       ├── Image: cloudflare/cloudflared:2024.10.0
│       ├── Tunnel: threads-prod-k0s-tunnel
│       └── Public: https://threads.unknowntpo.com
│
└── Secrets:
    ├── nextauth-secret (External Secrets Operator → GCP SM)
    ├── postgres-password (Kustomize secretGenerator)
    └── cloudflared-credentials (Terraform)
```

#### Health Checks

```bash
# ArgoCD status
argocd app get threads

# Pod status
kubectl get pods -n threads

# Tunnel status
kubectl logs -f deployment/cloudflared -n threads

# Public access
curl -I https://threads.unknowntpo.com
```

### 8. End-to-End Timeline

**From Code to Production:**

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT TIMELINE                       │
├──────────────────┬──────────────────────┬───────────────────┤
│ Event            │ Duration             │ Cumulative        │
├──────────────────┼──────────────────────┼───────────────────┤
│ git push         │ Instant              │ T+0               │
│ GitHub Actions   │ ~8-10 min            │ T+10              │
│ Image Updater    │ ~2-3 min (polling)   │ T+13              │
│ ArgoCD Sync      │ ~1-2 min             │ T+15              │
│ Pod Restart      │ ~1-2 min             │ T+17              │
│                  │                      │                   │
│ **TOTAL**        │ **~15-20 minutes**   │ **T+20**          │
└──────────────────┴──────────────────────┴───────────────────┘
```

**Optimization Opportunities:**

- Git webhook for ArgoCD: -3 min (no polling delay)
- Faster GitHub Actions runners: -3-5 min
- Multi-stage Docker builds with cache: -2-3 min
- **Potential: ~8-10 minutes total**

## Rollback Procedures

### Rollback via ArgoCD

**Option 1: UI**

```
1. Open ArgoCD UI
2. Select "threads" application
3. Click "History"
4. Click "Rollback" on previous revision
5. Confirm
```

**Option 2: CLI**

```bash
# List revisions
argocd app history threads

# Rollback to revision N
argocd app rollback threads <revision>

# Example:
argocd app rollback threads 5
```

### Rollback via Git

```bash
# Revert commit
git revert <commit-sha>
git push origin master

# ArgoCD auto-syncs and deploys previous version
```

### Emergency Rollback (kubectl)

```bash
# Rollback deployment
kubectl rollout undo deployment/nextjs -n threads

# Check status
kubectl rollout status deployment/nextjs -n threads
```

## Monitoring & Debugging

### Logs

**ArgoCD:**

```bash
# Application logs
argocd app logs threads --follow

# Sync logs
kubectl logs -f -l app.kubernetes.io/name=argocd-application-controller -n argocd
```

**Application Pods:**

```bash
# Next.js logs
kubectl logs -f deployment/nextjs -n threads

# ML Service logs
kubectl logs -f deployment/ml-service -n threads

# Postgres logs
kubectl logs -f deployment/postgres -n threads
```

**Cloudflare Tunnel:**

```bash
# Tunnel connection status
kubectl logs -f deployment/cloudflared -n threads
```

### Metrics

**Pod Status:**

```bash
kubectl get pods -n threads
kubectl top pods -n threads  # Resource usage
```

**ArgoCD Sync Status:**

```bash
argocd app get threads
```

**Public Access:**

```bash
curl -I https://threads.unknowntpo.com
# Should return: HTTP/2 200
```

## Best Practices

### Local Development

- ✅ Always test with `tilt up` before pushing
- ✅ Run `pnpm lint` before committing
- ✅ Use feature branches, not `master`
- ✅ Keep commits atomic and descriptive

### Code Review

- ✅ Create PR for all changes
- ✅ Wait for GitHub Actions to pass
- ✅ Request review from team
- ✅ Merge to `master` only after approval

### Deployment

- ✅ Monitor ArgoCD sync status
- ✅ Check pod logs after deployment
- ✅ Test production URL immediately
- ✅ Keep ArgoCD in sync (no manual kubectl changes)

### Rollback

- ✅ Document reason for rollback
- ✅ Fix issue before re-deploying
- ✅ Test fix locally first
- ✅ Monitor post-rollback

## Troubleshooting

### Image Not Updating

**Symptom:** ArgoCD shows old image after push

**Check:**

```bash
# 1. Verify image exists in GCR
gcloud artifacts docker images list \
  us-east1-docker.pkg.dev/web-service-design/threads/nextjs

# 2. Check ArgoCD Image Updater logs
kubectl logs -f deployment/argocd-image-updater -n argocd

# 3. Check ArgoCD Application annotations
kubectl get application threads -n argocd -o yaml | grep argocd-image-updater
```

**Fix:**

```bash
# Force image update
argocd app set threads --revision HEAD --force
```

### ArgoCD Out of Sync

**Symptom:** ArgoCD shows "OutOfSync" status

**Check:**

```bash
# Compare git vs cluster
argocd app diff threads
```

**Fix:**

```bash
# Manual sync
argocd app sync threads

# Or enable auto-sync
argocd app set threads --sync-policy automated
```

### Pod CrashLoopBackOff

**Symptom:** Pods keep restarting

**Check:**

```bash
# Pod logs
kubectl logs -f deployment/nextjs -n threads

# Events
kubectl get events -n threads --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name> -n threads
```

**Common Causes:**

- Missing environment variables
- Database connection failure
- Secrets not found
- Image pull errors

## References

- [Local Development Setup](../local-development-setup.md)
- [Secret Management Strategy](../secret-management-strategy.md)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Tilt Documentation](https://docs.tilt.dev/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## Changelog

| Date       | Change                | Author |
| ---------- | --------------------- | ------ |
| 2025-11-03 | Initial documentation | Claude |
