# Session Summary - Terraform Restructure & x86 Migration

**Date**: 2025-10-31
**Status**: ✅ COMPLETED - Layered Terraform + Snapshots Ready

## Current State

### VM Status

- ✅ VM: Running on x86 (e2-standard-2), spot instance
- ✅ k0s cluster: Healthy (fresh install from debian-13)
- ✅ All pods: 15/15 Running (kube-system, argocd, external-secrets)
- ✅ kubectl tunnel: Working (localhost:16443)

### Snapshots

- ✅ `snapshot-00-vpc-20251031-151137` (layer=00-vpc, after base infra)
- ✅ `snapshot-01-k8s-20251031-151618` (layer=01-k8s, after k8s resources)

## Work Completed This Session (2025-10-31)

### 1. Migration from ARM to x86 ✅

**Problem**: ARM (c4a-standard-2) had etcd networking issues

- kube-router, coredns, metrics-server couldn't connect to API server (10.96.0.1:443)
- Root cause: etcd not fully supported on ARM architecture

**Solution**: Migrated to x86 e2-standard-2

**Changes**:

- ✅ `machine_type`: c4a-standard-2 → e2-standard-2
- ✅ `disk type`: hyperdisk-balanced → pd-balanced (e2 requirement)
- ✅ `boot image`: debian-13-arm64 → debian-cloud/debian-13
- ✅ Kept spot VM configuration (~70% cost savings)

**Commit**: `6caa12c` - fix(terraform): migrate to e2-standard-2 x86 VM for etcd compatibility

### 2. Terraform Restructure (00-vpc / 01-k8s) ✅

**Completed**: Full layered architecture implementation

**Structure**:

```
terraform/
├── backend-config.hcl           # Shared: GCS bucket config
├── 00-vpc/envs/prod/            # Layer 1: Base infrastructure
│   ├── main.tf                  # VPC module + kubectl-setup
│   ├── variables.tf             # project_id, region, zone, env
│   ├── outputs.tf               # Exports for 01-k8s
│   ├── terraform.tfvars         # use_latest_snapshot=false
│   └── .terraform.lock.hcl      # Provider version locks
│
├── 01-k8s/envs/prod/            # Layer 2: Kubernetes resources
│   ├── main.tf                  # ArgoCD, Image Updater, External Secrets
│   ├── data.tf                  # Read 00-vpc remote state
│   ├── variables.tf             # backend_bucket, gcp_service_account_key
│   ├── terraform.tfvars         # backend_bucket (from backend-config.hcl)
│   └── .terraform.lock.hcl      # Provider version locks
│
└── modules/
    ├── vpc/                     # Self-contained VPC module
    │   ├── main.tf              # GCP APIs, networking, compute
    │   ├── networking/          # Submodule: VPC, subnets, firewall
    │   └── compute/             # Submodule: VM, disks, scheduler
    ├── kubectl-setup/           # IAP tunnel + kubeconfig
    ├── argocd/                  # ArgoCD Helm release
    ├── argocd-image-updater/    # Image Updater Helm + RBAC
    ├── external-secrets/        # External Secrets Operator
    └── namespaces/              # threads namespace
```

**Backend Configuration**:

```hcl
# terraform/backend-config.hcl
bucket = "threads-tf-state-0bcb17db57fe8e84"

# 00-vpc uses: prefix = "00-vpc/state"
# 01-k8s uses: prefix = "01-k8s/state"
```

**Key Fix**: `repo_root` variable

- Problem: kubectl-setup couldn't find `scripts/kubectl-setup.sh` from nested terraform directory
- Solution: Pass `repo_root = "${path.root}/../../../.."` to kubectl-setup module
- Module uses: `cd "${var.repo_root}" && bash scripts/kubectl-setup.sh`

**Commits**:

- `378b639` - refactor(terraform): restructure to layered architecture with spot VM
- `bd39534` - fix(terraform): configure 01-k8s to use backend_bucket variable

### 3. Clean Infrastructure Deployment ✅

**Workflow**:

```bash
# Destroy everything
cd terraform/01-k8s/envs/prod && terraform destroy -auto-approve
cd ../../00-vpc/envs/prod && terraform destroy -auto-approve

# Deploy Layer 1: Base infrastructure
cd terraform/00-vpc/envs/prod
terraform init -backend-config=../../../backend-config.hcl
terraform apply -auto-approve
# → 28 resources created (VM, VPC, kubectl-setup, etc.)

# Take snapshot after 00-vpc
gcloud compute disks snapshot threads-prod-vm \
  --snapshot-names=snapshot-00-vpc-$(date +%Y%m%d-%H%M%S) \
  --zone=us-east1-b \
  --labels=environment=prod,component=k0s-cluster,layer=00-vpc

# Deploy Layer 2: Kubernetes resources
cd ../../../01-k8s/envs/prod
terraform init -backend-config=../../../backend-config.hcl
terraform apply -auto-approve
# → 8 resources created (ArgoCD, Image Updater, External Secrets)

# Take snapshot after 01-k8s
gcloud compute disks snapshot threads-prod-vm \
  --snapshot-names=snapshot-01-k8s-$(date +%Y%m%d-%H%M%S) \
  --zone=us-east1-b \
  --labels=environment=prod,component=k0s-cluster,layer=01-k8s
```

**Result**: All pods healthy (no networking issues)

```
NAMESPACE                 NAME                                    READY   STATUS    RESTARTS   AGE
argocd                    argocd-application-controller-0         1/1     Running   0          88s
argocd                    argocd-applicationset-controller-...   1/1     Running   0          88s
argocd                    argocd-dex-server-...                   1/1     Running   0          88s
argocd                    argocd-image-updater-...                1/1     Running   0          27s
argocd                    argocd-notifications-controller-...     1/1     Running   0          88s
argocd                    argocd-redis-...                        1/1     Running   0          88s
argocd                    argocd-repo-server-...                  1/1     Running   0          88s
argocd                    argocd-server-...                       1/1     Running   0          88s
external-secrets-system   external-secrets-...                    1/1     Running   0          108s
external-secrets-system   external-secrets-cert-controller-...    1/1     Running   0          108s
external-secrets-system   external-secrets-webhook-...            1/1     Running   0          108s
kube-system               coredns-...                             1/1     Running   0          6m14s
kube-system               kube-proxy-...                          1/1     Running   0          6m12s
kube-system               kube-router-...                         1/1     Running   0          6m12s
kube-system               metrics-server-...                      1/1     Running   0          6m11s
```

## Snapshots Created

| Name                                  | Labels                                                        | Purpose                      | Size  | Status   |
| ------------------------------------- | ------------------------------------------------------------- | ---------------------------- | ----- | -------- |
| `snapshot-00-vpc-20251031-151137`     | environment=prod, component=k0s-cluster, layer=00-vpc         | After base infra deployment  | 50 GB | ✅ READY |
| `snapshot-01-k8s-20251031-151618`     | environment=prod, component=k0s-cluster, layer=01-k8s         | After k8s resources deployed | 50 GB | ✅ READY |
| `snapshot-k0s-spot-20251031-123541`   | environment=prod, component=k0s-cluster, snapshot-type=manual | Pre-migration ARM backup     | 50 GB | ✅ READY |
| `snapshot-k0s-backup-20251030-212108` | (none)                                                        | Pre-restructure backup       | 50 GB | ✅ READY |

**What's in Each Snapshot**:

**snapshot-00-vpc**:

- Fresh k0s cluster (x86, e2-standard-2)
- kube-system pods only (coredns, kube-proxy, kube-router, metrics-server)

**snapshot-01-k8s**:

- Everything from 00-vpc PLUS:
- ArgoCD (8 pods)
- ArgoCD Image Updater (1 pod)
- External Secrets Operator (3 pods)
- ClusterSecretStore configured for GCP Secret Manager

## Key Architectural Decisions

### 1. Layered Terraform (00-vpc → 01-k8s)

**Why**:

- Eliminates provider timing issues (providers initialize AFTER kubectl_setup)
- Clear workflow for new users
- Can destroy k8s resources without touching VM

**Trade-off**: Two terraform commands vs. one-command apply

### 2. x86 over ARM

**Why**:

- etcd fully supported on x86
- No networking issues with kube-router/coredns
- Industry standard for Kubernetes

**Trade-off**: Slightly higher cost vs. ARM (but mitigated by spot VM)

### 3. Spot VM for Development

**Why**: ~70% cost savings during development
**Trade-off**: Can be preempted (but good for dev/testing)

### 4. Backend Configuration

**Pattern**: Shared backend-config.hcl at terraform root

- 00-vpc: `prefix = "00-vpc/state"`
- 01-k8s: `prefix = "01-k8s/state"` + reads 00-vpc via `terraform_remote_state`

**Why**: Forces sequential apply, no hardcoded bucket names

### 5. Boot Disk Naming

**Observation**: Boot disk name depends on creation method

- From snapshot: `threads-prod-vm-boot` (explicitly created resource)
- From image: `threads-prod-vm` (auto-named after VM)

**Impact**: Snapshot commands must use correct disk name

## Errors & Fixes

### Error 1: ARM etcd Networking Issues

**Problem**: All networking pods couldn't connect to API server (10.96.0.1:443)

```
kube-router: dial tcp 10.96.0.1:443: i/o timeout
coredns: plugin/kubernetes: Failed to watch
metrics-server: connection refused
```

**Root Cause**: etcd not fully supported on ARM architecture
**Fix**: Migrated to e2-standard-2 (x86)

### Error 2: hyperdisk-balanced on e2

**Problem**: `Error 400: hyperdisk-balanced disk type cannot be used by e2-standard-2`
**Fix**: Changed to `pd-balanced` disk type

### Error 3: kubectl-setup Script Not Found

**Problem**: `bash: scripts/kubectl-setup.sh: No such file or directory`
**Root Cause**: Relative path from nested terraform directory
**Fix**: Added `repo_root` variable passed as `"${path.root}/../../../.."`

### Error 4: Terraform State Locks

**Problem**: Multiple `Error acquiring the state lock` after interrupted operations
**Fix**: `terraform force-unlock -force <lock-id>`

## Next Steps

### Immediate

1. ✅ Complete terraform restructure
2. ✅ Migrate to x86
3. ✅ Create clean snapshots (00-vpc + 01-k8s)
4. ⏳ Add ArgoCD Application manifests for nextjs + ml-service
5. ⏳ Deploy applications to threads namespace
6. ⏳ Test ArgoCD Image Updater auto-deployment

### Future

- Multi-env support (dev/staging) using same structure
- CI/CD pipeline integration with layered terraform
- Snapshot-based disaster recovery testing
- Cost optimization analysis (spot VM vs. scheduled on-demand)

## Lessons Learned

1. **ARM etcd issues are real**: Stick with x86 for production Kubernetes
2. **Layered terraform works**: No more provider timing issues
3. **Disk naming is inconsistent**: Boot disk name changes based on creation method
4. **Spot VMs are viable for dev**: 70% savings, acceptable for non-prod
5. **Backend config pattern**: Shared backend-config.hcl works well for multi-layer
6. **Snapshot labels are critical**: Makes recovery and organization much easier
7. **pd-balanced for e2**: e2 instances don't support hyperdisk-balanced

## Commands Reference

### Terraform Workflow

```bash
# Initialize and apply 00-vpc
cd terraform/00-vpc/envs/prod
terraform init -backend-config=../../../backend-config.hcl
terraform apply -auto-approve

# Initialize and apply 01-k8s
cd ../../../01-k8s/envs/prod
terraform init -backend-config=../../../backend-config.hcl
terraform apply -auto-approve

# Destroy (reverse order)
cd terraform/01-k8s/envs/prod && terraform destroy -auto-approve
cd ../../00-vpc/envs/prod && terraform destroy -auto-approve
```

### Snapshot Operations

```bash
# Check current disk name
gcloud compute disks list --filter="name:threads-prod"

# Create snapshot (use correct disk name: threads-prod-vm or threads-prod-vm-boot)
gcloud compute disks snapshot threads-prod-vm \
  --snapshot-names=snapshot-01-k8s-$(date +%Y%m%d-%H%M%S) \
  --zone=us-east1-b \
  --labels=environment=prod,component=k0s-cluster,layer=01-k8s

# List snapshots
gcloud compute snapshots list \
  --filter="labels.component=k0s-cluster" \
  --format="table(name,creationTimestamp,diskSizeGb,labels)" \
  --sort-by=creationTimestamp
```

### kubectl Access

```bash
# Use threads k0s kubeconfig
export KUBECONFIG=~/.kube/config-threads-k0s

# Check pods
kubectl get pods -A
kubectl get nodes

# Check IAP tunnel process
ps aux | grep "gcloud.*compute.*start-iap-tunnel"
```

---

**Status**: ✅ Infrastructure complete, snapshots ready, ready to deploy applications

**VM**: e2-standard-2 (x86, spot), 50GB pd-balanced
**Cost**: ~$0.02/hour (spot pricing)
**Snapshots**: 2 (00-vpc + 01-k8s)
**Bucket**: `threads-tf-state-0bcb17db57fe8e84`
