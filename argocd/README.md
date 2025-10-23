# ArgoCD GitOps Setup

This directory contains ArgoCD Application manifests for GitOps-based deployment.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Git Repository (Source of Truth)                       │
│  ├── k8s/                  ← Kubernetes manifests       │
│  └── argocd/               ← ArgoCD Applications        │
└──────────────┬──────────────────────────────────────────┘
               │
               │ Git polling / Webhook
               ▼
┌─────────────────────────────────────────────────────────┐
│  ArgoCD                                                  │
│  ├── Monitors git repo for changes                      │
│  ├── Syncs k8s manifests to cluster                     │
│  └── Auto-heals drift from desired state                │
└──────────────┬──────────────────────────────────────────┘
               │
               │ kubectl apply
               ▼
┌─────────────────────────────────────────────────────────┐
│  Kubernetes Cluster                                      │
│  └── namespace: threads                                 │
│      ├── PostgreSQL                                     │
│      ├── ML Service                                     │
│      └── Next.js                                        │
└─────────────────────────────────────────────────────────┘
```

## Local Testing (OrbStack)

### 1. Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd
```

### 2. Access ArgoCD UI

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward to localhost
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access UI at: https://localhost:8080
# Username: admin
# Password: (from command above)
```

### 3. Create Secrets (Required Before Deployment)

```bash
# Create threads namespace
kubectl create namespace threads

# Create PostgreSQL password secret
kubectl create secret generic postgres-password \
  --from-literal=password='your-postgres-password' \
  --namespace=threads

# Create Dagster PostgreSQL password secret
kubectl create secret generic dagster-postgres-password \
  --from-literal=password='your-dagster-password' \
  --namespace=threads

# Create Docker registry secret (for local testing, may not be needed)
kubectl create secret docker-registry gcr-json-key \
  --docker-server=us-east1-docker.pkg.dev \
  --docker-username=_json_key \
  --docker-password="$(cat /path/to/key.json)" \
  --namespace=threads
```

### 4. Deploy Application

```bash
# Apply ArgoCD Application manifest
kubectl apply -f argocd/threads-app.yaml

# Watch sync status
kubectl get application -n argocd threads -w

# Or use ArgoCD CLI
argocd app sync threads
argocd app wait threads
```

### 5. Verify Deployment

```bash
# Check all resources
kubectl get all -n threads

# Check ArgoCD application status
kubectl get application -n argocd threads

# Check pod logs
kubectl logs -f deployment/postgres -n threads
kubectl logs -f deployment/ml-service -n threads
kubectl logs -f deployment/nextjs -n threads
```

## Production Deployment (GCP VM with k0s)

### 1. Update Startup Script

The startup script should ONLY provision k8s cluster and install ArgoCD:

```bash
# terraform/modules/compute/startup-script-k0s.sh should:
1. Install k0s
2. Install kubectl
3. Install ArgoCD
4. Create secrets from Terraform variables
5. Deploy ArgoCD Application manifest
```

### 2. ArgoCD Will Handle App Deployment

ArgoCD will:

- Monitor the git repo for changes
- Automatically sync k8s manifests to the cluster
- Auto-heal if manual changes are made to the cluster
- Provide rollback capabilities

### 3. Deployment Flow

```
Push to Git → ArgoCD detects change → Syncs manifests → Apps deployed
```

## ArgoCD Features

### Auto Sync

The application is configured with `syncPolicy.automated`:

- `prune: true` - Delete resources not in git
- `selfHeal: true` - Revert manual changes
- `allowEmpty: false` - Prevent empty deployments

### Retry Logic

Automatic retry with exponential backoff:

- Initial: 5s
- Max: 3m
- Limit: 5 retries

## Files

- `threads-app.yaml` - Main ArgoCD Application for threads namespace
- `README.md` - This file

## Troubleshooting

### Check Sync Status

```bash
kubectl get application -n argocd threads -o yaml
```

### Force Sync

```bash
kubectl patch application threads -n argocd --type merge -p '{"spec":{"syncPolicy":null}}'
kubectl patch application threads -n argocd --type merge -p '{"metadata":{"annotations":{"argocd.argoproj.io/sync-wave":"0"}}}'
```

### View Sync History

```bash
argocd app history threads
```

### Rollback

```bash
argocd app rollback threads <revision>
```

## Next Steps

1. ✅ Test locally with OrbStack
2. Update startup script to only provision cluster + ArgoCD
3. Create secrets management solution (Sealed Secrets / External Secrets)
4. Add ArgoCD notifications (Slack/Discord)
5. Setup Image Updater for automated image updates
