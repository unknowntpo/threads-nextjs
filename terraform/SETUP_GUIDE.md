# Terraform Setup Guide - k0s Cluster on GCP

Complete guide for setting up Terraform to manage your k0s Kubernetes cluster on GCP.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GCP Service Account Setup](#gcp-service-account-setup)
3. [Kubernetes Cluster Access](#kubernetes-cluster-access)
4. [Terraform Initialization](#terraform-initialization)
5. [ArgoCD Image Updater RBAC](#argocd-image-updater-rbac)
6. [Running Terraform](#running-terraform)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### 1. Install Required Tools

```bash
# Terraform
brew install terraform

# Google Cloud SDK
brew install google-cloud-sdk

# kubectl
brew install kubectl
```

### 2. Authenticate with GCP

```bash
# Login to GCP
gcloud auth login

# Set your project
gcloud config set project web-service-design
```

## GCP Service Account Setup

### Step 1: Create Service Account

```bash
export PROJECT_ID="web-service-design"

# Create service account for Terraform
gcloud iam service-accounts create terraform-admin \
    --display-name="Terraform Admin" \
    --project=$PROJECT_ID
```

### Step 2: Grant IAM Roles

The service account needs these permissions:

```bash
# Compute Admin - for VM, network, firewall management
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:terraform-admin@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/compute.admin"

# Service Account User - for service account operations
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:terraform-admin@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Service Account Admin - for creating service accounts
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:terraform-admin@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountAdmin"

# Service Usage Admin - for enabling GCP APIs
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:terraform-admin@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/serviceusage.serviceUsageAdmin"
```

### Step 3: Create and Store Service Account Key

```bash
# Create directory for GCP credentials
mkdir -p ~/.gcp
chmod 700 ~/.gcp  # Restrict access to only your user

# Create key file in ~/.gcp directory
gcloud iam service-accounts keys create ~/.gcp/terraform-admin-key.json \
    --iam-account=terraform-admin@${PROJECT_ID}.iam.gserviceaccount.com

# Restrict key file permissions
chmod 600 ~/.gcp/terraform-admin-key.json

# Verify key was created
ls -lh ~/.gcp/terraform-admin-key.json
```

**⚠️ SECURITY WARNING:**

- Never commit this key to git
- Key stored in `~/.gcp/` (secure, persistent location)
- File permissions set to 600 (only owner can read/write)
- Rotate keys regularly (every 90 days recommended)
- Add to global `.gitignore`: `~/.gcp/` directory

## Kubernetes Cluster Access

Your k0s cluster runs on a GCP VM. You need kubectl access to it.

### Step 1: Get kubeconfig from k0s VM

```bash
# Create kubeconfig directory
mkdir -p ~/.kube

# Retrieve kubeconfig from k0s cluster
gcloud compute ssh threads-prod-vm \
    --zone=us-east1-b \
    --tunnel-through-iap \
    --command='sudo k0s kubeconfig admin' > ~/.kube/config-threads-k0s

# Verify file was created
cat ~/.kube/config-threads-k0s | head -20
```

### Step 2: Set up IAP Tunnel

The k0s API server runs on private IP `10.0.0.12:6443`. You need an IAP tunnel:

```bash
# Start tunnel in background
gcloud compute start-iap-tunnel threads-prod-vm 6443 \
    --local-host-port=localhost:16443 \
    --zone=us-east1-b &

# Note the PID to stop later
echo $! > /tmp/iap-tunnel.pid

# Verify tunnel is running
lsof -i:16443
```

### Step 3: Update kubeconfig for Tunnel

```bash
# Backup original
cp ~/.kube/config-threads-k0s ~/.kube/config-threads-k0s.backup

# Update server endpoint
sed -i '' 's|https://10.0.0.12:6443|https://localhost:16443|' ~/.kube/config-threads-k0s

# Verify change
grep 'server:' ~/.kube/config-threads-k0s
```

### Step 4: Test kubectl Access

```bash
# Test connection
KUBECONFIG=~/.kube/config-threads-k0s kubectl get nodes

# Expected output:
# NAME              STATUS   ROLES           AGE   VERSION
# threads-prod-vm   Ready    control-plane   ...   v1.27.x+k0s
```

## Terraform Initialization

### Step 1: Navigate to Terraform Directory

```bash
cd /Users/unknowntpo/repo/unknowntpo/threads-nextjs/terraform
```

### Step 2: Initialize Terraform

```bash
# Download providers
terraform init

# Verify initialization
ls -la .terraform/
```

### Step 3: Validate Configuration

```bash
terraform validate

# Expected output:
# Success! The configuration is valid.
```

## ArgoCD Image Updater RBAC

### What RBAC Permissions Are Created?

The Image Updater module creates cross-namespace RBAC permissions:

#### 1. Role in `threads` Namespace

Location: `modules/argocd-image-updater/main.tf:75-86`

```hcl
resource "kubernetes_role" "image_updater_threads" {
  metadata {
    name      = "argocd-image-updater"
    namespace = "threads"
  }

  rule {
    api_groups = [""]           # Core API group
    resources  = ["secrets"]    # Only secrets
    verbs      = ["get", "list", "watch"]  # Read-only
  }
}
```

**Permissions granted:**

- `get`: Read specific secret by name
- `list`: List all secrets in namespace
- `watch`: Watch for secret changes

**What can it NOT do:**

- Cannot `create`, `update`, `delete`, or `patch` secrets
- Cannot access secrets in other namespaces
- Cannot access other resources (pods, services, etc.)

#### 2. RoleBinding in `threads` Namespace

Location: `modules/argocd-image-updater/main.tf:88-106`

```hcl
resource "kubernetes_role_binding" "image_updater_threads" {
  metadata {
    name      = "argocd-image-updater"
    namespace = "threads"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = "argocd-image-updater"
  }

  subject {
    kind      = "ServiceAccount"
    name      = "argocd-image-updater"
    namespace = "argocd"
  }
}
```

**Binding details:**

- **Who**: `system:serviceaccount:argocd:argocd-image-updater`
- **What**: Role `argocd-image-updater` permissions
- **Where**: Only in `threads` namespace

### Why These Permissions Are Needed

**The Problem:**

- Image Updater runs in `argocd` namespace
- Container registry credentials (`gcr-json-key` secret) are in `threads` namespace
- Kubernetes RBAC blocks cross-namespace access by default

**The Solution:**

- Create Role in `threads` namespace with read-only secret access
- Bind Role to `argocd-image-updater` service account from `argocd` namespace
- Image Updater can now read `gcr-json-key` to authenticate to Artifact Registry

**Without these permissions:**

```
Error: secrets "gcr-json-key" is forbidden:
User "system:serviceaccount:argocd:argocd-image-updater"
cannot get resource "secrets" in API group "" in namespace "threads"
```

### Security Analysis

✅ **Follows least privilege principle:**

- Minimum permissions needed (read-only)
- Scoped to one namespace (`threads`)
- Scoped to one resource type (`secrets`)
- Scoped to one service account (`argocd-image-updater`)

✅ **No cluster-wide access:**

- Not a ClusterRole (would grant cluster-wide access)
- Limited to `threads` namespace only

✅ **Read-only:**

- Cannot modify, create, or delete secrets
- Cannot escalate privileges

⚠️ **Potential risks:**

- Can read ALL secrets in `threads` namespace (not just `gcr-json-key`)
- Consider using field selectors for more granular access in production

### Verifying RBAC Permissions

```bash
# Check if Role exists
kubectl get role argocd-image-updater -n threads

# Check if RoleBinding exists
kubectl get rolebinding argocd-image-updater -n threads

# Test permissions (should succeed)
kubectl auth can-i get secrets \
    --as=system:serviceaccount:argocd:argocd-image-updater \
    -n threads

# Test forbidden action (should fail)
kubectl auth can-i create secrets \
    --as=system:serviceaccount:argocd:argocd-image-updater \
    -n threads
```

## Running Terraform

### Step 1: Set Environment Variables

```bash
# Set service account key
export TF_VAR_gcp_service_account_key=$(cat ~/.gcp/terraform-admin-key.json)

# Set kubeconfig
export KUBECONFIG=~/.kube/config-threads-k0s

# Verify variables are set
echo "Key loaded: $(echo $TF_VAR_gcp_service_account_key | head -c 50)..."
echo "KUBECONFIG: $KUBECONFIG"
```

### Step 2: Preview Changes

```bash
# Full plan
terraform plan

# Plan specific module
terraform plan -target=module.argocd_image_updater
```

### Step 3: Apply Changes

```bash
# Apply all changes (requires confirmation)
terraform apply

# Apply specific module
terraform apply -target=module.argocd_image_updater

# Auto-approve (CI/CD use only)
terraform apply -auto-approve
```

### Step 4: Verify Deployment

```bash
# Check Image Updater pod
kubectl get pods -n argocd | grep image-updater

# Check Image Updater logs
kubectl logs -n argocd deployment/argocd-image-updater --tail=50

# Expected success logs:
# "Successfully updated image ... to ..."
# "Processing results: applications=1 images_considered=2 images_updated=2 errors=0"
```

## Common Terraform Workflows

### Update Only ArgoCD Image Updater

```bash
cd terraform
export TF_VAR_gcp_service_account_key=$(cat ~/.gcp/terraform-admin-key.json)
export KUBECONFIG=~/.kube/config-threads-k0s

terraform apply -target=module.argocd_image_updater
```

### Restart Image Updater After Changes

```bash
# Restart to pick up new RBAC permissions
kubectl rollout restart deployment/argocd-image-updater -n argocd

# Wait for pod to be ready
kubectl rollout status deployment/argocd-image-updater -n argocd

# Check logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-image-updater --tail=100
```

### View Terraform State

```bash
# List all resources
terraform state list

# Show specific resource
terraform state show module.argocd_image_updater.kubernetes_role.image_updater_threads

# Get outputs
terraform output
```

### Destroy Resources

```bash
# Destroy specific module (be careful!)
terraform destroy -target=module.argocd_image_updater

# Destroy everything (very dangerous!)
terraform destroy
```

## Troubleshooting

### Problem: Cannot connect to k0s cluster

**Symptoms:**

```
Unable to connect to the server: dial tcp 10.0.0.12:6443: i/o timeout
```

**Solution:**

```bash
# Check if IAP tunnel is running
lsof -i:16443

# If not running, start it
gcloud compute start-iap-tunnel threads-prod-vm 6443 \
    --local-host-port=localhost:16443 \
    --zone=us-east1-b &

# Verify kubeconfig uses localhost:16443
grep 'server:' ~/.kube/config-threads-k0s
```

### Problem: Terraform authentication failed

**Symptoms:**

```
Error: google: could not find default credentials
```

**Solution:**

```bash
# Check if key is set
echo $TF_VAR_gcp_service_account_key | head -c 50

# Re-export if empty
export TF_VAR_gcp_service_account_key=$(cat ~/.gcp/terraform-admin-key.json)

# Verify file exists
ls -lh ~/.gcp/terraform-admin-key.json
```

### Problem: Image Updater shows forbidden errors

**Symptoms:**

```
secrets "gcr-json-key" is forbidden: User "system:serviceaccount:argocd:argocd-image-updater"
cannot get resource "secrets" in namespace "threads"
```

**Solution:**

```bash
# Apply RBAC fix
cd terraform
terraform apply -target=module.argocd_image_updater

# Restart Image Updater pod
kubectl rollout restart deployment/argocd-image-updater -n argocd

# Wait 30 seconds and check logs
sleep 30
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-image-updater --tail=50
```

### Problem: IAP tunnel keeps disconnecting

**Symptoms:**
Intermittent connection failures to k0s API

**Solution:**

```bash
# Install NumPy for better tunnel performance
pip3 install numpy

# Or use a helper script to auto-restart tunnel
cat > ~/restart-iap-tunnel.sh << 'EOF'
#!/bin/bash
while true; do
    gcloud compute start-iap-tunnel threads-prod-vm 6443 \
        --local-host-port=localhost:16443 \
        --zone=us-east1-b
    echo "Tunnel disconnected, restarting in 5s..."
    sleep 5
done
EOF

chmod +x ~/restart-iap-tunnel.sh
~/restart-iap-tunnel.sh &
```

### Problem: Image Updater not detecting new images

**Symptoms:**
Logs show "images_considered=2 images_skipped=0 images_updated=0"

**Solution:**

```bash
# Check Image Updater configuration
kubectl get application threads -n argocd -o yaml | grep -A 20 'annotations'

# Verify images exist in Artifact Registry
gcloud artifacts docker images list \
    us-east1-docker.pkg.dev/web-service-design/threads/nextjs \
    --format='table(IMAGE,TAGS)'

# Check Image Updater strategy
kubectl logs -n argocd deployment/argocd-image-updater | grep "update-strategy"
```

## GitHub Actions Setup

For CI/CD, add service account key to GitHub Secrets:

```bash
# Display key (copy output)
cat ~/.gcp/terraform-admin-key.json

# In GitHub:
# 1. Go to: Settings > Secrets and variables > Actions
# 2. Click: New repository secret
# 3. Name: GCP_SA_KEY
# 4. Value: Paste the entire JSON key
# 5. Click: Add secret
```

## Best Practices

1. **Keep service account keys secure**
   - Never commit to git
   - Rotate every 90 days
   - Use GitHub Secrets for CI/CD

2. **Use IAP tunnel for cluster access**
   - Never expose k0s API publicly
   - IAP provides audit logging
   - Supports MFA and conditional access

3. **Target specific modules when possible**
   - Faster applies
   - Reduces blast radius
   - Easier to rollback

4. **Always review terraform plan**
   - Understand what will change
   - Catch potential issues early
   - Document major changes

5. **Monitor RBAC permissions**
   - Regularly audit who has access
   - Use `kubectl auth can-i` to test
   - Follow principle of least privilege

6. **Backup terraform state**
   - Consider using GCS remote backend
   - Enable versioning on state bucket
   - Never manually edit state

## Next Steps

1. **Set up remote state** (recommended for teams):

   ```bash
   # Create GCS bucket for state
   gsutil mb gs://$PROJECT_ID-terraform-state

   # Configure backend in main.tf
   terraform {
     backend "gcs" {
       bucket = "web-service-design-terraform-state"
       prefix = "terraform/state"
     }
   }
   ```

2. **Automate with GitHub Actions**:
   - Terraform plan on PR
   - Terraform apply on merge to main
   - See `.github/workflows/` for examples

3. **Add monitoring**:
   - Alert on Image Updater errors
   - Track deployment frequency
   - Monitor resource usage

## Resources

- [Terraform GCP Provider Docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Kubernetes Provider Docs](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs)
- [ArgoCD Image Updater Docs](https://argocd-image-updater.readthedocs.io/)
- [GCP IAP Documentation](https://cloud.google.com/iap/docs)
- [Kubernetes RBAC Documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
