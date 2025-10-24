# ArgoCD Deployment Guide

This guide explains how to deploy ArgoCD and applications to the k0s cluster using Terraform.

## Prerequisites

1. VM is already running with k0s installed
2. IAP tunnel is configured
3. kubectl access is set up

## Step 1: Setup kubectl Access

Before running Terraform, you need to fetch the kubeconfig from the VM:

```bash
# From project root
./scripts/kubectl-setup.sh
```

This will:

- Fetch kubeconfig from VM via IAP tunnel
- Save to `~/.kube/config-threads-k0s`
- Configure server URL for `https://localhost:6443`

## Step 2: Start IAP Tunnel

In a **separate terminal**, start the IAP tunnel to the k8s API:

```bash
gcloud compute start-iap-tunnel threads-prod-vm 6443 \
  --local-host-port=localhost:6443 \
  --zone=us-east1-b \
  --project=web-service-design
```

**Keep this terminal open during terraform apply!**

## Step 3: Update Terraform Provider Config

Edit `terraform/main.tf` and update the kubernetes providers to use the local kubeconfig:

```hcl
# Configure Kubernetes provider
provider "kubernetes" {
  config_path = "~/.kube/config-threads-k0s"
}

# Configure kubectl provider
provider "kubectl" {
  config_path = "~/.kube/config-threads-k0s"
}
```

## Step 4: Deploy ArgoCD

```bash
cd terraform

# Initialize providers
terraform init -upgrade

# Plan deployment (review what will be created)
terraform plan

# Apply (deploy ArgoCD + apps)
terraform apply
```

## What Gets Deployed

1. **ArgoCD Installation**
   - Namespace: `argocd`
   - All ArgoCD components (server, repo-server, application-controller, etc.)

2. **Secrets** (in `threads` namespace)
   - `postgres-password`
   - `dagster-postgres-password`
   - `gcr-json-key` (Docker registry credentials)

3. **ArgoCD Application**
   - Monitors: `https://github.com/unknowntpo/threads-nextjs.git`
   - Path: `k8s/`
   - Auto-syncs to cluster

4. **Applications** (deployed by ArgoCD)
   - PostgreSQL
   - ML Service
   - Next.js

## Verify Deployment

```bash
# Set kubeconfig
export KUBECONFIG=~/.kube/config-threads-k0s

# Check ArgoCD pods
kubectl get pods -n argocd

# Check ArgoCD application
kubectl get application -n argocd

# Check threads apps
kubectl get all -n threads
```

## Access ArgoCD UI

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward ArgoCD UI (in another terminal)
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at: https://localhost:8080
# Username: admin
# Password: (from command above)
```

## Update Applications

To update applications, simply push changes to GitHub:

```bash
# Make changes to k8s/*.yaml
git add k8s/
git commit -m "update: deployment config"
git push

# ArgoCD will automatically detect and sync changes within 3 minutes
# Or force sync via UI or CLI:
argocd app sync threads
```

## Important Notes

- **No VM restart needed**: Terraform only updates k8s resources
- **IAP tunnel required**: Must be running during terraform apply
- **Kubeconfig**: Must be fetched before each terraform session
- **GitOps**: ArgoCD monitors GitHub for changes automatically

## Troubleshooting

### "connection refused" errors

Ensure IAP tunnel is running:

```bash
# Check if tunnel is active
ps aux | grep "gcloud compute start-iap-tunnel"
```

### "unauthorized" errors

Refresh kubeconfig:

```bash
./scripts/kubectl-setup.sh
```

### ArgoCD not syncing

Check application status:

```bash
kubectl describe application threads -n argocd
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```
