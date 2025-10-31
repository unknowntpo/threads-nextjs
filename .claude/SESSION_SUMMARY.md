# Session Summary - ArgoCD Image Updater Revert & Terraform Restructure

**Date**: 2025-10-31
**Status**: In Progress - Restructuring Terraform (00-infra / 01-k8s)

## Current State

### VM Status

- ✅ VM: Running on ARM64 (c4a-standard-2, Google Axion), fresh from debian-13-arm64
- ✅ k0s cluster: Healthy (fresh install, ~4min old)
- ✅ Infrastructure pods: ArgoCD, External Secrets running
- ⏳ ArgoCD Image Updater: Not yet deployed (terraform timing issue)
- ✅ kubectl tunnel: Working (localhost:16443, PID 95930)

### Snapshots

- ✅ Backup: `snapshot-k0s-backup-20251030-212108` (unlabeled, pre-restructure state)
- ❌ Clean labeled snapshot: Not yet created (waiting for restructure completion)

## Work Completed This Session (2025-10-31)

### 1. ArgoCD Image Updater Revert ✅

**Completed from previous session**

**Changes**:

- ✅ `terraform/main.tf` - Replaced Keel with argocd_image_updater module
- ✅ `k8s/base/nextjs.yaml` - Removed Keel annotations
- ✅ `k8s/base/ml-service.yaml` - Removed Keel annotations
- ✅ `k8s/argocd-apps/threads-app.yaml` - Added Image Updater annotations
- ✅ `terraform/modules/keel/` - Deleted
- ✅ Terraform state - Removed 3 Keel resources
- ✅ Terraform apply - Created 4 Image Updater resources

**Verification**:

```
argocd-image-updater-7cfc8f8bf8-8dvfd   1/1     Running   0   113s
Version: v0.14.0+af844fe
```

### 2. Snapshot Recreation Plan ✅

**Goal**: Create clean snapshot for reproducible infrastructure

**Process**:

1. ✅ Backup current state (snapshot-k0s-backup-20251030-212108) - no labels
2. ✅ Destroy VM (disk auto-deleted)
3. ✅ Fresh k0s install from debian-13-arm64 base image (~10 min)
4. ✅ Verify infrastructure deployed (ArgoCD, External Secrets, namespaces)
5. ⏳ Create labeled snapshot with full infrastructure
6. ⏳ Test recovery from snapshot

**What's in snapshot**:

- ✅ k0s cluster (single controller)
- ✅ ArgoCD (Helm)
- ✅ External Secrets Operator (Helm)
- ✅ Namespaces (threads)
- ⏳ ArgoCD Image Updater (Helm) - pending
- ❌ Applications (k8s/argocd-apps/) - not included

### 3. Timing Issue Discovery ❌

**Problem**: Terraform provider initialization vs kubectl_setup race condition

**Root Cause**:

```
terraform apply
  ↓
1. Providers initialize (reads old kubeconfig)
  ↓
2. kubectl_setup runs (writes new kubeconfig with new certs)
  ↓
3. k8s resources apply (provider still has old certs cached)
  ↓
ERROR: x509: certificate signed by unknown authority
```

**Error Details**:

```
Error: Post "https://localhost:16443/api/v1/namespaces": tls: failed to verify
certificate: x509: certificate signed by unknown authority
```

**Why it happens**:

- Fresh k0s = NEW certificates
- kubectl_setup fetches new kubeconfig DURING apply
- But kubernetes/helm providers already initialized with old config
- Cert mismatch → TLS error

**Workaround**: Second `terraform apply` succeeds (provider picks up new config)

### 4. Terraform Restructure Decision ✅

**Solution**: Adopt Anton Putra pattern (layered infrastructure)

**Reference**: https://github.com/antonputra/tutorials/blob/main/lessons/198/v2/envs/dev/

**New Structure**:

```
terraform/
├── 00-infra/envs/prod/       # Base infrastructure layer
│   ├── main.tf               # VM, networking, kubectl_setup
│   ├── backend.tf            # GCS: threads-tf-state-*/00-infra/state
│   ├── variables.tf
│   ├── outputs.tf            # Export for 01-k8s
│   └── terraform.tfvars
│
└── 01-k8s/envs/prod/         # Kubernetes layer
    ├── data.tf               # Read from 00-infra remote state
    ├── main.tf               # ArgoCD, Image Updater, External Secrets
    ├── backend.tf            # GCS: threads-tf-state-*/01-k8s/state
    └── variables.tf
```

**Workflow**:

```bash
# Step 1: Base infra (VM + kubectl)
cd terraform/00-infra/envs/prod
terraform init
terraform apply  # Creates VM, fresh kubeconfig written

# Step 2: K8s resources (provider now has fresh config)
cd ../../../01-k8s/envs/prod
terraform init
terraform apply  # No timing issue!
```

**Benefits**:

- ✅ No timing issues (providers initialize AFTER kubectl_setup)
- ✅ Clear for new users ("run 00-infra then 01-k8s")
- ✅ Can destroy k8s without touching VM
- ✅ Industry standard pattern
- ✅ Supports multi-env (dev/staging/prod)

**Variables**:

- GCS bucket name NOT hardcoded (in variables)
- Used via `terraform_remote_state` data block

### 5. Directory Structure Creation 🔄 IN PROGRESS

**Status**: Creating environment-based layout

**Created**:

- ✅ `terraform/00-infra/envs/prod/` directory
- ✅ `terraform/01-k8s/envs/prod/` directory
- ⏳ `terraform/00-infra/envs/prod/main.tf` - partial
- ⏳ `terraform/00-infra/envs/prod/backend.tf` - partial
- ⏳ `terraform/00-infra/envs/prod/variables.tf` - partial

**Next**:

- Complete 00-infra files
- Create 01-k8s files with data.tf
- Create apply.sh/destroy.sh convenience scripts
- Test full workflow
- Take clean snapshot

## Key Files Modified

### terraform/main.tf

```diff
- module "keel" {
-   source = "./modules/keel"
+ module "argocd_image_updater" {
+   source = "./modules/argocd-image-updater"
+   depends_on = [module.kubectl_setup, module.argocd, module.namespaces]
```

### k8s/base/\*.yaml

```diff
- annotations:
-   keel.sh/policy: force
-   keel.sh/trigger: poll
(Removed from nextjs.yaml, ml-service.yaml)
```

### k8s/argocd-apps/threads-app.yaml

```diff
+ annotations:
+   argocd-image-updater.argoproj.io/image-list: nextjs=...,ml-service=...
+   argocd-image-updater.argoproj.io/nextjs.update-strategy: latest
+   argocd-image-updater.argoproj.io/ml-service.update-strategy: latest
+   argocd-image-updater.argoproj.io/write-back-method: argocd
```

## Errors & Fixes

### Error 1: Terraform Provider Timing

**Problem**: k8s provider initialized before kubectl_setup writes new kubeconfig
**Fix**: Restructure into 00-infra (VM) → 01-k8s (apps) layers

### Error 2: VM Already Exists

**Problem**: `terraform apply` tried to recreate existing VM
**Cause**: State drift after manual operations
**Fix**: In progress - restructure will clarify state boundaries

## Snapshots Created

| Name                                  | Labels                                  | Purpose                       | Status     |
| ------------------------------------- | --------------------------------------- | ----------------------------- | ---------- |
| `snapshot-k0s-backup-20251030-212108` | None                                    | Safety backup pre-restructure | ✅ READY   |
| `snapshot-k0s-YYYYMMDD-HHMMSS`        | component=k0s-cluster, environment=prod | Clean golden image            | ⏳ Pending |

**Snapshot Description** (for labeled snapshot):

```
k0s cluster + ArgoCD + ArgoCD Image Updater + External Secrets Operator - ARM64 ready
```

## Key Architectural Decisions

### 1. Layered Terraform (Anton Putra Pattern)

**Why**: Eliminates provider timing issues, clear workflow
**Trade-off**: Two terraform directories vs. one-command apply

### 2. Environment-based Structure

**Why**: Supports dev/staging/prod, industry standard
**Trade-off**: Deeper directory nesting vs. simpler flat structure

### 3. Remote State with Data Blocks

**Why**: Forces sequential apply (infra → k8s), explicit dependencies
**Trade-off**: Extra data.tf file vs. direct module dependencies

## Next Steps

### Immediate (Current Session)

1. ⏳ Complete 00-infra/envs/prod files
2. ⏳ Create 01-k8s/envs/prod files with data.tf
3. ⏳ Create apply.sh script (auto run both layers)
4. ⏳ Create destroy.sh script (cleanup)
5. ⏳ Test: destroy current VM, apply via new structure
6. ⏳ Verify all infrastructure pods Running
7. ⏳ Create clean labeled snapshot
8. ⏳ Test snapshot recovery
9. ⏳ Update terraform.tfvars with comments
10. ⏳ Update plan.md

### Future

- Multi-env support (dev/staging)
- CI/CD integration with layered structure
- Snapshot automation scripts

## Lessons Learned

1. **Terraform provider timing**: Providers initialize once at start, can't pick up mid-apply config changes
2. **Layered > monolithic**: Separation prevents timing issues, clearer workflow
3. **Anton Putra pattern works**: Industry-proven approach for multi-layer infra
4. **Remote state > module deps**: Forces correct apply order, no race conditions
5. **Fresh installs > snapshots**: Snapshots useful for recovery, but fresh install validates reproducibility
6. **GCS bucket naming**: Use variables, never hardcode (terraform/modules can reference)

## Commands Reference

### Snapshot Operations

```bash
# Backup (no labels)
gcloud compute disks snapshot threads-prod-vm-boot \
  --snapshot-names=snapshot-k0s-backup-$(date +%Y%m%d-%H%M%S) \
  --zone=us-east1-b

# Clean labeled snapshot
gcloud compute disks snapshot threads-prod-vm-boot \
  --snapshot-names=snapshot-k0s-$(date +%Y%m%d-%H%M%S) \
  --zone=us-east1-b \
  --labels=component=k0s-cluster,environment=prod \
  --description="k0s cluster + ArgoCD + ArgoCD Image Updater + External Secrets Operator - ARM64 ready"

# List snapshots
gcloud compute snapshots list \
  --filter="labels.component=k0s-cluster AND labels.environment=prod" \
  --sort-by="-creationTimestamp"
```

### New Terraform Workflow (Post-restructure)

```bash
# Apply infrastructure
cd terraform/00-infra/envs/prod
terraform init
terraform apply

# Apply k8s resources
cd ../../../01-k8s/envs/prod
terraform init
terraform apply

# Or use convenience script
bash terraform/apply.sh prod
```

### Fresh Install

```bash
# Destroy VM
terraform destroy -target=module.compute.google_compute_instance.vm

# Fresh install (no snapshot)
terraform apply -var="use_latest_snapshot=false"

# From labeled snapshot
terraform apply -var="use_latest_snapshot=true"
```

---

**Status**: Creating 00-infra and 01-k8s directory structures, then will test full workflow and take clean snapshot

**Bucket**: `threads-tf-state-0bcb17db57fe8e84`
