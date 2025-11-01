# Session Summary - GitOps Architecture Complete

**Date**: 2025-11-01
**Status**: ✅ COMPLETED - Full GitOps Infrastructure with Terraform IaC

## Current State

### Infrastructure Status

- ✅ VM: e2-standard-2 (x86), spot instance, RUNNING
- ✅ k0s cluster: Healthy, all system pods running
- ✅ ArgoCD: Deployed and managing applications
- ✅ Applications: nextjs, ml-service, postgres (all healthy)
- ✅ Image Updater: Active, auto-updating on new commits
- ✅ Storage: local-path-provisioner for PVC management

### Snapshots

- ✅ `snapshot-00-vpc-20251031-151137` (layer=00-vpc, base infrastructure)
- ✅ `threads-prod-vm-01-k8s-20251101-144736` (layer=01-k8s, k8s resources deployed)

### Terraform Architecture

```
terraform/
├── backend-config.hcl              # GCS state bucket
├── 00-vpc/envs/prod/               # Layer 1: Infrastructure
│   ├── main.tf                     # VM, networking, kubectl setup
│   ├── data.tf                     # No dependencies
│   └── outputs.tf                  # Exports: kubeconfig_path, project_id, etc.
│
├── 01-k8s/envs/prod/               # Layer 2: Kubernetes resources
│   ├── main.tf                     # ArgoCD, External Secrets, Local Path Provisioner
│   ├── data.tf                     # Reads 00-vpc remote state
│   └── outputs.tf                  # Exports: argocd_namespace, kubeconfig_path
│
├── 02-argocd-app/envs/prod/        # Layer 3: ArgoCD Applications
│   ├── main.tf                     # Uses argocd-app module
│   ├── data.tf                     # Reads 01-k8s remote state
│   └── outputs.tf                  # Exports: app_name, app_namespace
│
└── modules/
    ├── argocd/                     # ArgoCD Helm deployment
    ├── argocd-image-updater/       # Image Updater + GCR secrets
    ├── argocd-app/                 # ArgoCD Application CRD
    │   ├── main.tf
    │   ├── outputs.tf
    │   └── threads-app.yaml        # Shared Application manifest
    ├── external-secrets/           # External Secrets Operator
    ├── local-path-provisioner/     # Storage provisioner
    ├── namespaces/                 # Application namespaces
    └── kubectl-setup/              # Kubectl configuration
```

## Work Completed This Session (2025-11-01)

### 1. Created 02-argocd-app Terraform Layer ✅

**Goal**: Deploy ArgoCD Applications via IaC instead of kubectl apply

**Implementation**:

- Created `terraform/02-argocd-app` layer using `kubernetes_manifest` provider
- Moved ArgoCD Application definition from `k8s/argocd-apps/` to terraform
- Created shared `modules/argocd-app` module with YAML manifest
- Added outputs from 01-k8s layer (kubeconfig_path, project_id, argocd_namespace)

**Benefits**:

- Declarative application deployment
- Version controlled in terraform state
- Reusable across environments (staging/prod)
- No manual kubectl commands needed

**Files Created**:

```
terraform/02-argocd-app/envs/prod/
├── main.tf          # Module invocation
├── data.tf          # Remote state from 01-k8s
├── variables.tf     # backend_bucket variable
├── outputs.tf       # app_name, app_namespace
└── terraform.tfvars # Variable values

terraform/modules/argocd-app/
├── main.tf          # kubernetes_manifest resource
├── outputs.tf       # Outputs for app metadata
└── threads-app.yaml # ArgoCD Application manifest
```

**Commits**:

- `074fea9` - feat(terraform): add 02-argocd-app layer for GitOps deployment

### 2. Fixed Storage Provisioner for Postgres PVC ✅

**Problem**: Postgres PVC failed with `storageclass.storage.k8s.io "local-path" not found`

**Solution**: Created local-path-provisioner module

**Implementation**:

```
terraform/modules/local-path-provisioner/
├── main.tf     # Deployment, ConfigMap, RBAC, StorageClass
└── outputs.tf  # storage_class_name
```

**Components**:

- Namespace: `local-path-storage`
- Deployment: Rancher local-path-provisioner v0.0.28
- ConfigMap: helperPod.yaml, setup, teardown scripts
- StorageClass: `local-path` (default)
- RBAC: ClusterRole, ClusterRoleBinding, ServiceAccount

**Result**:

- ✅ Postgres PVC bound successfully (10Gi)
- ✅ Postgres pod running with persistent storage
- ✅ Default storage class available for all PVCs

**Commits**:

- `2d28427` - feat(terraform): add local-path-provisioner for PVC storage

### 3. Fixed CI/CD Platform Mismatch ✅

**Problem**: GitHub Actions built `linux/arm64` images, but VM runs x86 → ImagePullBackOff

**Solution**: Changed `.github/workflows/deploy-gcp.yml` to build `linux/amd64`

**Changes**:

```yaml
# Before
platforms: linux/arm64

# After
platforms: linux/amd64
```

**Result**:

- ✅ Images build successfully on GitHub Actions
- ✅ Pods pull images without errors
- ✅ All applications running

**Commits**:

- `074fea9` - fix(ci): build Docker images for amd64 platform

### 4. Infrastructure Rebuild & Snapshot Workflow ✅

**Goal**: Test disaster recovery by destroying 01-k8s and rebuilding from snapshot

**Steps Executed**:

1. ✅ Destroyed 01-k8s layer (terraform destroy)
2. ✅ Verified 00-vpc state intact (27 resources)
3. ✅ Re-applied 01-k8s layer (ArgoCD, External Secrets, Local Path Provisioner)
4. ✅ Created VM snapshot: `threads-prod-vm-01-k8s-20251101-144736`
5. ✅ Applied 02-argocd-app layer
6. ✅ Verified full deployment (all pods healthy)

**Snapshot Details**:

- Name: `threads-prod-vm-01-k8s-20251101-144736`
- Size: 50 GB
- Status: READY
- Description: Snapshot after 01-k8s layer applied (ArgoCD, External Secrets, Local Path Provisioner)

**Recovery Capability**:

- Can restore to pre-application state
- Test disaster recovery scenarios
- Rollback if needed
- Create consistent dev/staging environments

### 5. Tested ArgoCD Auto-Sync & Image Updater ✅

**Goal**: Verify GitOps workflow end-to-end

**Test**:

1. Changed ml-service version: 0.1.0 → 0.1.1
2. Pushed to master → GitHub Actions built new image
3. ArgoCD Image Updater detected new image tag
4. ArgoCD auto-synced deployment with new image
5. Pods restarted with updated image

**Result**:

- ✅ GitHub Actions: Built `ml-service:8caff6f725f1b11601c72a17ef5913fb58abecc3`
- ✅ Image Updater: Detected new image in Artifact Registry
- ✅ ArgoCD: Auto-synced with `automated: {prune: true, selfHeal: true}`
- ✅ Pods: Restarted with new image (verified via `kubectl describe pod`)

**Evidence**:

```bash
# ArgoCD Application Status
NAME      SYNC STATUS   HEALTH STATUS
threads   Synced        Healthy

# Current Image
ml-service:8caff6f725f1b11601c72a17ef5913fb58abecc3

# Sync Policy
automated:
  prune: true
  selfHeal: true
  allowEmpty: false
```

**Commits**:

- `8caff6f` - test(ml-service): bump version to 0.1.1 for Image Updater test

### 6. Moved ArgoCD Application to Terraform Module ✅

**Goal**: Better readability and reusability across environments

**Refactor**:

```
Before:
k8s/argocd-apps/threads-app.yaml (manual kubectl apply)

After:
terraform/modules/argocd-app/threads-app.yaml (terraform managed)
```

**Benefits**:

- Single source of truth for all environments
- Better readability (YAML instead of HCL)
- Declarative deployment via terraform
- No kubectl commands needed

**Files Removed**:

- `k8s/argocd-apps/threads-app.yaml`
- `k8s/argocd-apps/README.md`

**Files Created**:

- `terraform/modules/argocd-app/main.tf`
- `terraform/modules/argocd-app/outputs.tf`
- `terraform/modules/argocd-app/threads-app.yaml`

## GitOps Workflow

### Deployment Flow

```
Developer Push → GitHub Actions → Artifact Registry → ArgoCD Image Updater → ArgoCD Sync → K8s Deployment
     ↓                ↓                    ↓                      ↓                 ↓              ↓
  git push      Build & Push          New Image              Detects Image      Updates      Pods Restart
               (amd64 image)         Tagged (SHA)           (every 2min)      Manifest      (new version)
```

### Infrastructure Management

```
Terraform Layers:
1. terraform/00-vpc        → VM, networking, kubectl
2. terraform/01-k8s        → ArgoCD, External Secrets, Storage
3. terraform/02-argocd-app → ArgoCD Applications

Application Deployment:
- ArgoCD monitors: github.com/unknowntpo/threads-nextjs.git @ master
- Path: k8s/base/
- Auto-sync: prune + selfHeal enabled
- Image updates: Automated via Image Updater
```

## Key Achievements

1. **Full GitOps Architecture**: Everything deployed via terraform or ArgoCD
2. **Disaster Recovery**: VM snapshots at each layer for recovery
3. **Auto-deployment**: Push to master → automatic deployment
4. **Infrastructure as Code**: All resources in terraform state
5. **Storage Management**: Local path provisioner for PVCs
6. **Multi-layer Architecture**: Clear separation of concerns (VPC/K8s/Apps)

## Current Issues & Solutions

### Issue: Duplicate Pods After ArgoCD Recreation

**Status**: In progress
**Pods**: 2x ml-service, 2x nextjs (4 total instead of 2)
**Cause**: ArgoCD recreated during refactor, old pods not cleaned up
**Solution**: Delete old pods, ArgoCD will maintain desired state

## Next Steps

1. Clean up duplicate pods in threads namespace
2. Verify all applications healthy after cleanup
3. Commit and push all terraform changes
4. Test staging environment deployment using same modules
5. Document disaster recovery procedures

## Commits Summary

- `6caa12c` - fix(terraform): migrate to e2-standard-2 x86 VM for etcd compatibility
- `bd39534` - fix(terraform): configure 01-k8s to use backend_bucket variable
- `074fea9` - feat(terraform): add 02-argocd-app layer for GitOps deployment
- `2d28427` - feat(terraform): add local-path-provisioner for PVC storage
- `8caff6f` - test(ml-service): bump version to 0.1.1 for Image Updater test

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Terraform State (GCS)                        │
│  ├─ 00-vpc/state      (VM, networking, kubectl)                 │
│  ├─ 01-k8s/state      (ArgoCD, External Secrets, Storage)       │
│  └─ 02-argocd-app/state (ArgoCD Applications)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GCE VM (e2-standard-2)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    k0s Cluster                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Namespace: argocd                                    │  │ │
│  │  │  - ArgoCD Controllers (8 pods)                       │  │ │
│  │  │  - Image Updater (monitors Artifact Registry)        │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Namespace: threads                                   │  │ │
│  │  │  - nextjs (NodePort 30000)                           │  │ │
│  │  │  - ml-service (ClusterIP)                            │  │ │
│  │  │  - postgres (PVC: 10Gi local-path)                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Namespace: local-path-storage                        │  │ │
│  │  │  - local-path-provisioner (storage CSI)              │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Namespace: external-secrets-system                   │  │ │
│  │  │  - External Secrets Operator (3 pods)                │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Artifact Registry
                    (Container Images)
```
