# Session Summary - Infrastructure Rollback & External Secrets Setup

**Date**: 2025-10-30
**Status**: In Progress - Rollback to clean snapshot

## Current State

### VM Status

- VM from snapshot with k0s, ArgoCD, ArgoCD Image Updater
- ArgoCD pods **CrashLoopBackOff** (failed ESO deployment)
- Helm releases inconsistent state

### Action Plan

**Rollback to clean snapshot** containing only:

- k0s cluster (working)
- ArgoCD (working)
- ArgoCD Image Updater (working)

## Work Completed This Session

### 1. VM Configuration Improvements ✅

**Changes**:

- Switched SPOT/preemptible → non-preemptible VM
- Added Cloud Scheduler: auto start 9am, stop 9pm Asia/Taipei
- Removed external IP (IAP tunnel only)
- Set boot disk `auto_delete = true`

**Files Modified**:

- `terraform/modules/compute/main.tf` - VM config
- `terraform/modules/compute/scheduler.tf` - **NEW** Cloud Scheduler
- `terraform/main.tf` - Added cloudscheduler API

### 2. Snapshot Refresh Workflow ✅

**Completed**:

- Deleted old snapshot
- Created fresh VM from Debian base
- K0s installed automatically
- Created new snapshot `snapshot-k0s` with labels:
  - `component=k0s-cluster`
  - `environment=prod`
- Destroyed VM, recreated from snapshot
- Verified k0s working

### 3. Secret Management Architecture ✅

**Decision**: GCP Secret Manager + External Secrets Operator

**Pipeline**: GitHub CI → ArgoCD → k0s

- Secrets stored centrally in GCP Secret Manager
- ESO syncs to k8s automatically
- No secrets in Git

### 4. External Secrets Operator Module ✅

**Created**:

- `terraform/modules/external-secrets/main.tf` - **NEW**
- `terraform/modules/external-secrets/variables.tf` - **NEW**
- Added to `terraform/main.tf`
- Added iamcredentials API

**Implementation**:

- Helm chart: `external-secrets` v0.9.11
- Namespace: `external-secrets-system`
- ClusterSecretStore: `null_resource` + `kubectl` (CRD workaround)

**Why null_resource?**

- `kubernetes_manifest` validates CRDs at **plan time** (before Helm installs)
- `null_resource` + `kubectl` runs at **apply time** (after CRDs exist)

### 5. ArgoCD Application Manifest ✅

**Created**:

- `k8s/argocd-apps/threads-app.yaml` - ArgoCD Application
- Added Image Updater annotations to `k8s/base/nextjs.yaml`, `k8s/base/ml-service.yaml`

## Errors & Fixes

### Error 1: CRD Validation

**Problem**: `kubernetes_manifest` validates at plan time, CRDs don't exist yet

**Fix**: Use `null_resource` + `kubectl apply` (executes at apply time)

```hcl
resource "null_resource" "gcp_secret_store" {
  provisioner "local-exec" {
    command = "kubectl apply -f - <<EOF ... EOF"
    environment = { KUBECONFIG = "~/.kube/config-threads-k0s" }
  }
  depends_on = [helm_release.external_secrets]
}
```

### Error 2: Nested terraform/ Directory

**Problem**: Accidentally created `/terraform/terraform/`

**Fix**: Removed nested directory

### Error 3: Namespace/Helm Conflicts

**Problem**: Namespaces/Helm releases existed from manual setup

**Attempted Fix**: Import to Terraform state

**Outcome**: More conflicts, ArgoCD CrashLoopBackOff

**Decision**: **Rollback to clean snapshot**

## Next Steps (After Rollback)

### Immediate Tasks

1. **Destroy current VM**:

   ```bash
   terraform destroy -target=module.compute.google_compute_instance.vm \
     -target=module.compute.google_compute_disk.boot_from_snapshot \
     -auto-approve
   ```

2. **Recreate VM from clean snapshot**:

   ```bash
   terraform apply -auto-approve
   ```

3. **Reconnect kubectl**:

   ```bash
   ./scripts/kubectl-setup.sh
   ```

4. **Verify ArgoCD healthy**:

   ```bash
   KUBECONFIG=~/.kube/config-threads-k0s kubectl get pods -n argocd
   ```

5. **Apply External Secrets cleanly**:
   - Already in `terraform/main.tf`
   - Next `terraform apply` installs without conflicts

6. **Verify External Secrets**:
   ```bash
   KUBECONFIG=~/.kube/config-threads-k0s kubectl get pods -n external-secrets-system
   KUBECONFIG=~/.kube/config-threads-k0s kubectl get clustersecretstore
   ```

### Future Tasks

7. **Create secrets in GCP Secret Manager**:
   - `postgres-password`
   - `gcr-json-key`

8. **Create ExternalSecret resources**:

   ```yaml
   apiVersion: external-secrets.io/v1beta1
   kind: ExternalSecret
   metadata:
     name: postgres-secret
     namespace: threads
   spec:
     secretStoreRef:
       name: gcpsm-secret-store
       kind: ClusterSecretStore
     target:
       name: postgres-secret
     data:
       - secretKey: password
         remoteRef:
           key: postgres-password
   ```

9. **Take new snapshot with ESO**:
   ```bash
   gcloud compute disks snapshot boot-disk \
     --snapshot-name=snapshot-k0s-eso \
     --zone=us-east1-b \
     --labels=component=k0s-cluster,environment=prod,includes=eso
   ```

## Key Files Modified

### Terraform

- `terraform/modules/compute/main.tf` - VM config
- `terraform/modules/compute/scheduler.tf` - **NEW** Cloud Scheduler
- `terraform/modules/external-secrets/main.tf` - **NEW** ESO module
- `terraform/modules/external-secrets/variables.tf` - **NEW**
- `terraform/main.tf` - Added APIs, external_secrets module

### Kubernetes

- `k8s/base/nextjs.yaml` - Image Updater annotations
- `k8s/base/ml-service.yaml` - Image Updater annotations
- `k8s/argocd-apps/threads-app.yaml` - **NEW** ArgoCD Application

## Important Notes

### Snapshot

- Current: `snapshot-k0s` (k0s + ArgoCD + Image Updater)
- Labels: `component=k0s-cluster`, `environment=prod`

### Cost Optimization

- VM: start 9am, stop 9pm Asia/Taipei
- Non-preemptible (auto-restart on maintenance)
- No external IP (saves egress, better security)

### Access

- SSH: IAP tunnel via `scripts/kubectl-setup.sh`
- kubectl: Port-forward via IAP on localhost:16443
- ArgoCD: Port-forward via `scripts/tunnel-argocd.sh`

### External Secrets Architecture

```
GCP Secret Manager → ESO → k8s Secrets → Pods
                     (sync every 1h)
```

## Lessons Learned

1. **Rollback beats debugging**: Snapshot rollback faster than fixing complex Helm/Terraform state
2. **CRD chicken-egg**: Use `null_resource` + `kubectl` for CRD-dependent resources
3. **Snapshot labels critical**: Proper labels help filter/identify snapshots
4. **Don't import manual resources**: Recreate from scratch cleaner than import
5. **Dependencies matter**: Explicit `depends_on` ensures proper ordering

## Commands Reference

### VM

```bash
# Start/stop
gcloud compute instances start threads-prod-vm --zone=us-east1-b
gcloud compute instances stop threads-prod-vm --zone=us-east1-b

# SSH via IAP
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap
```

### Terraform

```bash
# Apply
terraform apply -auto-approve

# Destroy specific resources
terraform destroy -target=module.compute.google_compute_instance.vm -auto-approve

# Force unlock
terraform force-unlock -force <LOCK_ID>
```

### Kubernetes

```bash
# Set kubeconfig
export KUBECONFIG=~/.kube/config-threads-k0s

# Check cluster
kubectl get nodes
kubectl get pods -A

# Check External Secrets
kubectl get pods -n external-secrets-system
kubectl get clustersecretstore
kubectl get externalsecrets -A
```

### Snapshots

```bash
# List
gcloud compute snapshots list --filter="labels.component=k0s-cluster"

# Create
gcloud compute disks snapshot <DISK> \
  --snapshot-name=snapshot-k0s \
  --zone=us-east1-b \
  --labels=component=k0s-cluster,environment=prod
```

---

**Status**: VM destruction in progress, ready for clean snapshot recreation
