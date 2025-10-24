# Session Summary: ArgoCD Terraform Deployment

**Date:** 2025-10-24
**Status:** 🚧 In Progress - Fixing provider configuration

---

## Session Objective

Deploy ArgoCD to production GCP VM using Terraform **without reprovisioning the VM**. The VM startup script should only provision k0s cluster, while ArgoCD and applications are managed separately via Terraform.

## Key Requirements

1. ✅ **No VM reprovisioning**: Startup script must only contain k0s setup (reverted to commit ca1f330)
2. ✅ **Terraform-managed ArgoCD**: Deploy ArgoCD using Terraform kubernetes/kubectl providers
3. ✅ **Automated IAP tunnel**: No manual tunnel management required
4. ✅ **Port conflict avoidance**: Use port 16443 to avoid conflict with local OrbStack (port 6443)
5. ⏳ **GitOps workflow**: ArgoCD monitors GitHub repo and auto-syncs applications (pending deployment)

---

## Work Completed This Session

### 1. Reverted Startup Script to ca1f330

**File:** `terraform/modules/compute/startup-script-k0s.sh`

**Change:** Reverted to only provision k0s cluster (no application deployments):

- Install k0s
- Start k0s controller (single-node)
- Configure kubectl aliases
- Install and configure gcloud CLI for Docker auth
- **Removed:** All application deployment logic (PostgreSQL, ArgoCD, etc.)

**Why:** Ensures VM doesn't get reprovisioned when ArgoCD/k8s resources change.

### 2. Created ArgoCD Terraform Module

**Location:** `terraform/modules/argocd/`

**Files created:**

- `main.tf` - Main ArgoCD deployment logic
- `variables.tf` - Input variables (postgres_password, dagster_postgres_password, gcp_access_token, repo_url)
- `argocd-install.yaml` - Official ArgoCD installation manifest (v2.13.4)
- `argocd-application.yaml` - ArgoCD Application for threads

**What it deploys:**

1. **ArgoCD namespace** (`argocd`)
2. **ArgoCD installation** (all components: server, repo-server, application-controller, etc.)
3. **Threads namespace** (`threads`)
4. **Kubernetes secrets** in threads namespace:
   - `postgres-password` - PostgreSQL password
   - `dagster-postgres-password` - Dagster PostgreSQL password
   - `gcr-json-key` - Artifact Registry auth using GCP OAuth token
5. **ArgoCD Application** pointing to GitHub repo:
   - Repo: `https://github.com/unknowntpo/threads-nextjs.git`
   - Path: `k8s/`
   - Auto-sync enabled with prune and self-heal

### 3. Updated Main Terraform Configuration

**File:** `terraform/main.tf`

**Changes:**

1. **Added kubernetes provider:**

   ```hcl
   provider "kubernetes" {
     host                   = "https://localhost:16443"
     cluster_ca_certificate = base64decode(yamldecode(base64decode(
       data.external.kubeconfig.result.kubeconfig
     )).clusters[0].cluster.certificate-authority-data)

     exec {
       api_version = "client.authentication.k8s.io/v1beta1"
       command     = "bash"
       args = ["-c", "gcloud compute ssh ${module.compute.vm_name} --zone=${var.zone} --tunnel-through-iap --command='sudo k0s kubeconfig admin' 2>/dev/null | grep -A 999 'apiVersion:' | base64 | tr -d '\n'"]
     }
   }
   ```

2. **Added kubectl provider** (same config as kubernetes)

3. **Added data.external.kubeconfig** to dynamically fetch kubeconfig:

   ```hcl
   data "external" "kubeconfig" {
     program = ["bash", "-c", <<-EOT
       CONFIG=$(gcloud compute ssh ${module.compute.vm_name} \
         --zone=${var.zone} \
         --tunnel-through-iap \
         --command='sudo k0s kubeconfig admin' 2>/dev/null | grep -A 999 'apiVersion:')
       echo "{\"kubeconfig\":\"$(echo "$CONFIG" | base64 | tr -d '\n')\"}"
     EOT
     ]
     depends_on = [module.compute]
   }
   ```

4. **Added null_resource.iap_tunnel** for automatic tunnel management:

   ```hcl
   resource "null_resource" "iap_tunnel" {
     provisioner "local-exec" {
       command = <<-EOT
         # Kill existing tunnel on port 16443
         lsof -ti:16443 | xargs kill -9 2>/dev/null || true

         # Start IAP tunnel in background
         gcloud compute start-iap-tunnel ${module.compute.vm_name} 6443 \
           --local-host-port=localhost:16443 \
           --zone=${var.zone} \
           --project=${var.project_id} &

         # Wait for tunnel
         sleep 10
       EOT
     }

     provisioner "local-exec" {
       when    = destroy
       command = "lsof -ti:16443 | xargs kill -9 2>/dev/null || true"
     }

     depends_on = [module.compute]
   }
   ```

5. **Added data.google_client_config** to get GCP access token for Artifact Registry

6. **Added module.argocd invocation:**

   ```hcl
   module "argocd" {
     source = "./modules/argocd"

     postgres_password         = var.postgres_password
     dagster_postgres_password = var.dagster_postgres_password
     gcp_access_token          = data.google_client_config.default.access_token

     depends_on = [module.compute, null_resource.iap_tunnel]
   }
   ```

### 4. Updated Terraform Providers

**File:** `terraform/.terraform.lock.hcl`

**Change:** Added providers:

- `hashicorp/null` v3.2.4 - For IAP tunnel lifecycle management
- `hashicorp/external` v2.3.5 - For dynamic kubeconfig fetching

**Command run:** `terraform init -upgrade`

### 5. Created Documentation

**File:** `terraform/ARGOCD_DEPLOYMENT.md`

Comprehensive deployment guide covering:

- Prerequisites
- Setup steps (kubectl access, IAP tunnel, provider config)
- What gets deployed
- Verification commands
- ArgoCD UI access
- Update process
- Troubleshooting

---

## Current Issue

### Problem: Provider Configuration Error

When running `terraform plan`, encountered error:

```
Error: Unsupported attribute
Can't access attributes on a primitive-typed value (string).
```

**Root cause:** The `data.external.kubeconfig.result.kubeconfig` returns a base64-encoded string, but the provider configuration was trying to parse it directly with `yamldecode()` without decoding first.

**Fix applied:** Added `base64decode()` before `yamldecode()`:

```hcl
# Before (broken)
cluster_ca_certificate = base64decode(yamldecode(data.external.kubeconfig.result.kubeconfig).clusters[0].cluster.certificate-authority-data)

# After (fixed)
cluster_ca_certificate = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).clusters[0].cluster.certificate-authority-data)
```

**Status:** Fix applied, needs testing with `terraform plan`

---

## Files Modified in This Session

1. ✅ `terraform/modules/compute/startup-script-k0s.sh` - Reverted to ca1f330 (k8s only)
2. ✅ `terraform/modules/argocd/main.tf` - Created ArgoCD deployment module
3. ✅ `terraform/modules/argocd/variables.tf` - Created module variables
4. ✅ `terraform/modules/argocd/argocd-install.yaml` - Downloaded ArgoCD v2.13.4 manifest
5. ✅ `terraform/modules/argocd/argocd-application.yaml` - Created threads Application
6. ✅ `terraform/main.tf` - Added k8s providers, IAP tunnel, and ArgoCD module
7. ✅ `terraform/.terraform.lock.hcl` - Updated with null and external providers
8. ✅ `terraform/ARGOCD_DEPLOYMENT.md` - Created deployment guide
9. ✅ `.claude/SESSION_SUMMARY.md` - This file

---

## Next Steps

1. ⏳ **Test terraform plan** - Verify the provider configuration fix works
2. ⏳ **Run terraform apply** - Deploy ArgoCD to production VM
3. ⏳ **Verify deployment:**
   ```bash
   export KUBECONFIG=~/.kube/config-threads-k0s
   kubectl get pods -n argocd
   kubectl get application -n argocd
   kubectl get all -n threads
   ```
4. ⏳ **Access ArgoCD UI:**

   ```bash
   # Get admin password
   kubectl -n argocd get secret argocd-initial-admin-secret \
     -o jsonpath="{.data.password}" | base64 -d

   # Port forward
   kubectl port-forward svc/argocd-server -n argocd 8080:443

   # Access: https://localhost:8080 (admin / password-from-above)
   ```

5. ⏳ **Test local OrbStack** - Ensure no port conflict on 6443
6. ⏳ **Test GitOps workflow** - Make change to k8s manifests, verify ArgoCD syncs

---

## Architecture

```
Local Machine (Terraform)
  |
  |-- IAP Tunnel (localhost:16443 -> VM:6443)
  |   Managed by null_resource
  |
  v
GCP VM (threads-prod-vm)
  |
  |-- k0s Kubernetes cluster (from startup script)
      |
      |-- ArgoCD (namespace: argocd) [deployed by Terraform]
      |   |-- Application Controller
      |   |-- Repo Server
      |   |-- Server (UI)
      |   |
      |   |-- Application: threads
      |       |-- Monitors: github.com/unknowntpo/threads-nextjs/k8s/
      |       |-- Auto-sync: enabled
      |
      |-- threads (namespace) [deployed by Terraform]
          |-- PostgreSQL [deployed by ArgoCD from GitHub]
          |-- ML Service [deployed by ArgoCD from GitHub]
          |-- Next.js [deployed by ArgoCD from GitHub]
          |
          |-- Secrets [deployed by Terraform]
              |-- postgres-password
              |-- dagster-postgres-password
              |-- gcr-json-key (OAuth token)
```

---

## Key Design Decisions

### 1. Separation of Concerns

- **VM startup script**: Only k0s infrastructure (minimal, stable)
- **Terraform**: ArgoCD + k8s secrets
- **ArgoCD (GitOps)**: Application deployments from GitHub

### 2. No VM Reprovisioning

- Startup script is minimal and stable
- Changes to ArgoCD/apps don't trigger VM restart
- Faster iteration on k8s resources
- Lower cost (no VM downtime)

### 3. Automated IAP Tunnel

- `null_resource` manages tunnel lifecycle
- Starts before k8s resources are created
- Cleans up on terraform destroy
- Port 16443 avoids local OrbStack conflicts

### 4. Dynamic Kubeconfig

- Fetched via gcloud SSH (no manual setup)
- Works through IAP tunnel
- Terraform manages credentials automatically
- No static kubeconfig files to manage

### 5. GitOps Workflow

- Single source of truth: GitHub repo
- ArgoCD auto-syncs changes within 3 minutes
- No manual kubectl apply needed
- Declarative infrastructure

### 6. Artifact Registry Authentication

- Uses GCP OAuth access token (short-lived)
- Refreshed by Terraform on each apply
- More secure than service account keys
- Aligns with GCP best practices

---

## Lessons Learned

1. **Provider configuration complexity**: Kubernetes provider requires careful handling of kubeconfig data and base64 encoding/decoding. The data flow is: fetch kubeconfig → base64encode → store in external data → base64decode → yamldecode → extract CA cert.

2. **Port conflicts**: Always consider local dev environments. OrbStack (and Docker Desktop) use port 6443 for k8s API. Using 16443 avoids conflicts.

3. **Terraform dependencies**: Proper `depends_on` is critical for IAP tunnel timing. The tunnel must be established before kubernetes provider tries to connect.

4. **VM reprovisioning prevention**: Keep startup script minimal and stable. Applications should be deployed via GitOps, not embedded in startup scripts.

5. **External data source**: The `external` data source returns JSON with all values as strings. Need to handle encoding/decoding carefully.

---

## Troubleshooting Guide

### Issue: "Inconsistent dependency lock file"

**Solution:** Run `terraform init -upgrade`

### Issue: "connection refused" during terraform apply

**Check:**

1. Is IAP tunnel running on port 16443?
   ```bash
   lsof -i:16443
   ```
2. Can you reach the k8s API?
   ```bash
   curl -k https://localhost:16443
   ```

### Issue: "unauthorized" errors

**Solution:** Kubeconfig might be stale. The external data source should refresh it automatically, but if not, manually fetch:

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b \
  --tunnel-through-iap --command='sudo k0s kubeconfig admin'
```

### Issue: ArgoCD not syncing

**Check:**

```bash
kubectl describe application threads -n argocd
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```

### Issue: Local OrbStack cluster stopped working

**Cause:** Port 6443 conflict
**Solution:** We use port 16443 for IAP tunnel, so OrbStack on 6443 should work fine. If issues persist, stop IAP tunnel: `lsof -ti:16443 | xargs kill -9`

---

## References

- [ArgoCD Installation Guide](https://argo-cd.readthedocs.io/en/stable/getting_started/)
- [ArgoCD GitOps Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)
- [k0s Documentation](https://docs.k0sproject.io/)
- [Terraform Kubernetes Provider](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs)
- [Terraform kubectl Provider](https://registry.terraform.io/providers/gavinbunney/kubectl/latest/docs)
- [GCP IAP Tunneling](https://cloud.google.com/iap/docs/using-tcp-forwarding)
- [GCP Artifact Registry Authentication](https://cloud.google.com/artifact-registry/docs/docker/authentication)

---

## Previous Session Context

**From 2025-10-23:**

- Set up k0s cluster on GCP VM (c4a-standard-2, ARM Axion)
- Configured kubectl access via IAP tunnel
- Extracted k8s manifests from startup script to `k8s/` directory:
  - `k8s/namespace.yaml`
  - `k8s/postgres.yaml`
  - `k8s/ml-service.yaml`
  - `k8s/nextjs.yaml`
- Startup script deployed apps directly (before this session's refactor)

**Current State:**

- VM is running with k0s cluster
- Startup script now only provisions k0s (reverted to ca1f330)
- k8s manifests exist in `k8s/` directory
- ArgoCD Terraform module created, ready to deploy

---

**End of Session Summary**
