# ArgoCD Deployment with Terraform + Helm

This guide explains how to deploy ArgoCD and ArgoCD Image Updater using Helm charts via Terraform.

## Prerequisites

**IMPORTANT:** Before running `terraform apply`, you **must** set up kubectl connection to your k0s cluster:

```bash
./scripts/kubectl-setup.sh
```

This script:

1. Sets up IAP tunnel to your GCP VM
2. Fetches kubeconfig from k0s cluster
3. Saves it to `~/.kube/k0s-gcp-config`
4. Keeps the tunnel running in the background

**Keep the IAP tunnel running during terraform apply!**

## Configuration

### Service Account Key

In `terraform.tfvars`, set the **file path** to your GCP service account key:

```hcl
gcp_service_account_key = "~/.gcloud/keys/github-actions-artifact-registry-push.json"
```

**Note:** This should be a **file path**, not the JSON content itself.

### Snapshot Configuration

To boot VMs from a snapshot (optional):

```hcl
snapshot_name = "projects/web-service-design/global/snapshots/snapshot-k0s"
```

Leave empty to use base Debian image:

```hcl
snapshot_name = ""
```

## Deployment Steps

```bash
# 1. Run kubectl setup first (creates tunnel and kubeconfig)
./scripts/kubectl-setup.sh

# 2. Navigate to terraform directory
cd terraform

# 3. Initialize Terraform (if not done already)
terraform init

# 4. Review planned changes
terraform plan

# 5. Apply configuration
terraform apply
```

## What Gets Deployed

### ArgoCD (Helm Chart)

- **Chart:** `argo-cd` from https://argoproj.github.io/argo-helm
- **Namespace:** `argocd`
- **Version:** 5.51.6
- **Components:** ArgoCD server, repo-server, application-controller, etc.

### ArgoCD Image Updater (Helm Chart)

- **Chart:** `argocd-image-updater` from https://argoproj.github.io/argo-helm
- **Namespace:** `argocd`
- **Version:** 0.9.6
- **Configuration:** Monitors Artifact Registry for new images

### Kubernetes Resources

- **Namespaces:** `argocd`, `threads`
- **Secrets:**
  - `postgres-password` (threads namespace)
  - `dagster-postgres-password` (threads namespace)
  - `gcr-json-key` (threads namespace) - Artifact Registry auth
  - `gcr-image-updater-secret` (argocd namespace) - Image Updater auth
- **RBAC:** Role and RoleBinding for image updater to access threads namespace

## Terraform Modules

- `modules/argocd/` - ArgoCD Helm deployment
- `modules/argocd-image-updater/` - ArgoCD Image Updater Helm deployment

## Verify Deployment

```bash
# Set kubeconfig
export KUBECONFIG=~/.kube/k0s-gcp-config

# Check ArgoCD pods
kubectl get pods -n argocd

# Check ArgoCD Image Updater
kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-image-updater

# Check ArgoCD applications
kubectl get application -n argocd

# Check threads namespace resources
kubectl get all -n threads
```

## Access ArgoCD UI

```bash
# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Port-forward ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Access at: https://localhost:8080
# Username: admin
# Password: (from command above)
```

## How Image Updates Work

1. GitHub Actions builds and pushes new image to Artifact Registry
2. ArgoCD Image Updater detects new image tag
3. Image Updater updates the Application manifest in Git
4. ArgoCD syncs the updated manifest to cluster
5. New pods are deployed with latest image

## Important Notes

- **IAP Tunnel Required:** Must be running during `terraform apply`
- **Kubeconfig Path:** Providers use `~/.kube/k0s-gcp-config`
- **Service Account Key:** Loaded from file path specified in tfvars
- **Helm Deployment:** Both ArgoCD and Image Updater use official Helm charts
- **No kubectl Provider:** Switched from kubectl provider to pure Helm

## Troubleshooting

### Connection Refused Errors

Ensure IAP tunnel is running:

```bash
# Check if tunnel is active
ps aux | grep "gcloud compute start-iap-tunnel"

# If not running, restart kubectl-setup
./scripts/kubectl-setup.sh
```

### Unauthorized Errors

Refresh kubeconfig:

```bash
./scripts/kubectl-setup.sh
```

### Helm Release Already Exists

If Helm release is stuck:

```bash
# List releases
helm list -n argocd

# Delete stuck release
helm delete argocd -n argocd
helm delete argocd-image-updater -n argocd

# Reapply
terraform apply
```

### Image Updater Not Working

Check logs:

```bash
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-image-updater --tail=50
```

Verify secret exists:

```bash
kubectl get secret gcr-image-updater-secret -n argocd
```

### ArgoCD Not Syncing

Check application status:

```bash
kubectl describe application threads -n argocd
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller --tail=50
```

## Cleanup

To remove ArgoCD and Image Updater:

```bash
terraform destroy -target=module.argocd_image_updater
terraform destroy -target=module.argocd
```
