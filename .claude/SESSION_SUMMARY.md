# Session Summary: k8s Cluster Setup and kubectl Access

**Date:** 2025-10-23
**Status:** ✅ Complete - kubectl access configured

---

## What We Accomplished

### 1. Added Remote k8s Cluster to Local kubeconfig

**Problem:** User had working k8s cluster on GCP VM but needed local kubectl access.

**Solution:**

- Fetched kubeconfig from VM using `sudo k0s kubeconfig admin`
- Saved to `~/.kube/config-threads-k0s`
- Updated server URL to `https://localhost:6443` for IAP tunnel
- Updated `scripts/kubectl-setup.sh` to use correct k0s command

**Files Modified:**

- `scripts/kubectl-setup.sh` - Updated to use IAP tunnel and k0s kubeconfig command

**Commands to Use kubectl:**

```bash
# 1. Export kubeconfig
export KUBECONFIG=$HOME/.kube/config-threads-k0s

# 2. Start IAP tunnel (separate terminal)
gcloud compute start-iap-tunnel threads-prod-vm 6443 \
  --local-host-port=localhost:6443 \
  --zone=us-east1-b \
  --project=web-service-design

# 3. Use kubectl
kubectl get nodes
kubectl get pods -n threads
kubectl get svc -n threads
```

---

## Current Architecture

### Infrastructure

- **Compute:** c4a-standard-2 VM (ARM Axion, 2 vCPU, 8GB RAM) in us-east1-b
- **Kubernetes:** k0s single-node cluster
- **VM IP:** 35.211.171.77
- **Access:** IAP tunnel for SSH (22) and k8s API (6443)

### Applications in k8s (namespace: threads)

1. **PostgreSQL** - postgres:17-alpine, 10Gi PVC, ClusterIP service
2. **ML Service** - ARM64 image from Artifact Registry, ClusterIP service (port 8000)
3. **Next.js** - ARM64 image from Artifact Registry, NodePort service (30000)
   - Port forwarding: VM port 3000 → NodePort 30000 (via iptables)
   - Public access: http://35.211.171.77:3000

### Networking

- **VPC:** threads-prod-vpc (10.0.0.0/24)
- **Firewall Rules:**
  - IAP tunnel: SSH (22), k8s API (6443) from 35.235.240.0/20
  - HTTP: Port 3000 for Next.js (public)
  - PostgreSQL: Port 5432 (VPC internal only)
- **Cloud NAT:** For VM egress (Docker image pulls)

---

## IMPORTANT: Pending Refactor

### k8s Manifests Need to be Moved

**Current State:** k8s YAML manifests are embedded in `terraform/modules/compute/startup-script-k0s.sh` using heredocs.

**Required Change:** User removed k8s YAML from startup script. Manifests need to be defined in:

```
project_root/k8s/
├── postgres.yaml
├── ml-service.yaml
└── nextjs.yaml
```

**Why:** Separation of concerns - k8s manifests should be version controlled separately from infrastructure provisioning scripts.

**Next Steps for Future Agent:**

1. Create `k8s/` directory in project root
2. Extract PostgreSQL, ML Service, and Next.js manifests from startup script
3. Create separate YAML files for each application
4. Update startup script to pull manifests from GCS bucket or clone from repo
5. Consider using kubectl apply -f k8s/ pattern

**Manifest Locations in Current Startup Script:**

- Lines 112-193: PostgreSQL deployment + PVC + service
- Lines 204-264: ML Service deployment + service
- Lines 270-335: Next.js deployment + service

---

## Key Files

### Infrastructure (Terraform)

- `terraform/main.tf` - Main config (removed Cloud Run, uses k0s on VM)
- `terraform/modules/compute/main.tf` - VM definition with k0s startup script
- `terraform/modules/compute/startup-script-k0s.sh` - **Contains embedded k8s manifests (needs refactoring)**
- `terraform/modules/networking/main.tf` - VPC, firewall, Cloud NAT

### Scripts

- `scripts/kubectl-setup.sh` - Fetch kubeconfig from VM and configure for local use
- `scripts/view-startup-logs.sh` - View VM startup logs at `/var/log/startup-script.log`

### Documentation

- `terraform/K8S_ACCESS.md` - Complete kubectl access guide
- `terraform/STARTUP_LOGS.md` - Startup script logging guide
- `terraform/VM_ACCESS.md` - VM SSH access guide

---

## Startup Script Features

**Location:** `terraform/modules/compute/startup-script-k0s.sh`

**Features:**

- Progress markers: `[1/10]` through `[10/10]`
- Comprehensive logging to `/var/log/startup-script.log`
- Idempotent (checks if services already running)
- Waits for PostgreSQL to be ready (5min timeout)
- Sets up iptables port forwarding (3000 → 30000)
- Configures Docker authentication for Artifact Registry

**Steps:**

1. Update system packages
2. Install required packages (curl, wget)
3. Install k0s
4. Start k0s controller
5. Install kubectl
6. Setup kubeconfig + gcloud CLI + Docker auth
7. Create namespace + secrets
8. Deploy PostgreSQL (wait for ready)
9. Deploy ML Service
10. Deploy Next.js + setup port forwarding

**View Logs:**

```bash
# View all logs
./scripts/view-startup-logs.sh

# Follow logs in real-time
./scripts/view-startup-logs.sh -f

# Check progress markers
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap \
  --command="sudo grep '\[' /var/log/startup-script.log"
```

---

## Secrets Management

**Current Approach:** Secrets passed via Terraform variables and injected as k8s secrets.

**Secrets in k8s:**

- `postgres-password` - PostgreSQL password
- `dagster-postgres-password` - Dagster PostgreSQL password
- `gcr-json-key` - Docker registry credentials (ImagePullSecret)

**Terraform Variables:**

- `var.postgres_password` - From GitHub Secrets
- `var.dagster_postgres_password` - From GitHub Secrets
- Docker auth uses `gcloud auth print-access-token`

---

## Testing kubectl Access

**Prerequisites:**

1. IAP tunnel running on port 6443
2. KUBECONFIG set to `~/.kube/config-threads-k0s`

**Basic Commands:**

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# View resources
kubectl get all -n threads
kubectl get pods -n threads -o wide
kubectl get svc -n threads

# Check logs
kubectl logs -f deployment/nextjs -n threads
kubectl logs -f deployment/ml-service -n threads
kubectl logs -f deployment/postgres -n threads

# Port forward services
kubectl port-forward -n threads svc/postgres 5432:5432
kubectl port-forward -n threads svc/ml-service 8000:8000

# Execute commands in pods
kubectl exec -it -n threads deployment/postgres -- psql -U postgres -d threads
```

---

## Known Issues

### 1. Startup Script Contains k8s Manifests

**Impact:** Manifests are not version controlled separately, hard to update.
**Solution:** Move to `k8s/` directory (user requested, pending implementation).

### 2. IAP Tunnel Required for kubectl

**Impact:** Must keep terminal open with tunnel for kubectl to work.
**Workaround:** Run tunnel in background or use tmux/screen.

---

## Verification Checklist

After VM deployment, verify:

- [ ] VM is running: `gcloud compute instances list`
- [ ] Startup script completed: `./scripts/view-startup-logs.sh | grep "completed successfully"`
- [ ] All pods running: `kubectl get pods -n threads`
- [ ] Next.js accessible: `curl http://35.211.171.77:3000`
- [ ] kubectl access works: `kubectl get nodes`

---

## Git Status (at session end)

Modified files:

- `scripts/kubectl-setup.sh` - Updated to use IAP tunnel + k0s kubeconfig command

Untracked files:

- `terraform/SESSION_SUMMARY.md` - This file

---

## Next Agent Tasks

1. **PRIORITY: Refactor k8s Manifests**
   - Create `k8s/` directory in project root
   - Extract manifests from `startup-script-k0s.sh` (lines 112-335)
   - Create separate files: `postgres.yaml`, `ml-service.yaml`, `nextjs.yaml`
   - Update startup script to use manifests from repo/GCS
   - Test deployment with new manifest structure

2. **Optional: Improve Secrets Management**
   - Consider using GCP Secret Manager with Workload Identity
   - Or use external-secrets operator
   - Document secret rotation process

3. **Optional: Monitoring/Observability**
   - Add Prometheus/Grafana for metrics
   - Add Loki for log aggregation
   - Setup alerts for pod failures

---

## Quick Reference

**VM Access:**

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap
```

**kubectl Access:**

```bash
# Terminal 1: Start tunnel
gcloud compute start-iap-tunnel threads-prod-vm 6443 \
  --local-host-port=localhost:6443 \
  --zone=us-east1-b \
  --project=web-service-design

# Terminal 2: Use kubectl
export KUBECONFIG=$HOME/.kube/config-threads-k0s
kubectl get pods -n threads
```

**View Logs:**

```bash
./scripts/view-startup-logs.sh -f
```

**Application URLs:**

- Next.js: http://35.211.171.77:3000
- ML Service: Internal only (http://ml-service.threads.svc.cluster.local:8000)
- PostgreSQL: Internal only (postgres.threads.svc.cluster.local:5432)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│  Local Machine                                  │
│  ┌─────────────────┐                            │
│  │ kubectl         │                            │
│  │ KUBECONFIG set  │                            │
│  └────────┬────────┘                            │
│           │                                     │
│           │ IAP Tunnel                          │
│           │ localhost:6443                      │
└───────────┼─────────────────────────────────────┘
            │
            │ HTTPS (IAP)
            ▼
┌─────────────────────────────────────────────────┐
│  GCP VM (35.211.171.77)                         │
│  ┌───────────────────────────────────────────┐  │
│  │ k0s Kubernetes Cluster                    │  │
│  │                                           │  │
│  │  Namespace: threads                       │  │
│  │  ┌─────────────┐  ┌──────────────┐       │  │
│  │  │ PostgreSQL  │  │  ML Service  │       │  │
│  │  │ ClusterIP   │  │  ClusterIP   │       │  │
│  │  │ port 5432   │  │  port 8000   │       │  │
│  │  └─────────────┘  └──────────────┘       │  │
│  │                                           │  │
│  │  ┌──────────────────────────────────┐    │  │
│  │  │  Next.js                         │    │  │
│  │  │  NodePort 30000                  │    │  │
│  │  │  (iptables → VM port 3000)       │    │  │
│  │  └──────────────────────────────────┘    │  │
│  │                                           │  │
│  │  k8s API: 6443                            │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  iptables: 3000 → 30000                         │
└──────────────────┬───────────────────────────────┘
                   │
                   │ HTTP (public)
                   ▼
            Internet Users
         http://35.211.171.77:3000
```

---

**End of Session Summary**

---

## UPDATE: k8s Manifests Extracted

**Status:** ✅ Complete

The k8s manifests have been extracted from `startup-script-k0s.sh` and moved to separate files:

```
k8s/
├── README.md           - Documentation for k8s manifests
├── namespace.yaml      - threads namespace definition
├── postgres.yaml       - PostgreSQL deployment + PVC + service
├── ml-service.yaml     - ML service deployment + service
└── nextjs.yaml         - Next.js deployment + service (NodePort)
```

### Next Steps for Deployment

The startup script now needs to be updated to:

1. Clone the repo or pull manifests from GCS
2. Substitute environment variables (${POSTGRES_PASSWORD})
3. Apply manifests: `kubectl apply -f /path/to/k8s/`

### Deployment Order

1. Create namespace: `kubectl apply -f k8s/namespace.yaml`
2. Create secrets (in startup script)
3. Deploy PostgreSQL: `kubectl apply -f k8s/postgres.yaml`
4. Wait for PostgreSQL ready
5. Deploy ML service: `kubectl apply -f k8s/ml-service.yaml`
6. Deploy Next.js: `kubectl apply -f k8s/nextjs.yaml`

Or simply: `kubectl apply -f k8s/` (after namespace + secrets created)

**Files Modified:**

- Created: `k8s/namespace.yaml`
- Created: `k8s/postgres.yaml`
- Created: `k8s/ml-service.yaml`
- Created: `k8s/nextjs.yaml`
- Created: `k8s/README.md`

**UPDATE 2:** ✅ Startup script now deploys applications!

The startup script has been updated to:

1. Install k0s + kubectl + git + iptables
2. Clone repo from GitHub to get k8s manifests
3. Create namespace + secrets (postgres-password, dagster-postgres-password, gcr-json-key)
4. Deploy PostgreSQL and wait for ready (5min timeout)
5. Deploy ML Service
6. Deploy Next.js
7. Setup iptables port forwarding (3000 → 30000)
8. Show deployment status at the end

**Files Modified:**

- `terraform/modules/compute/startup-script-k0s.sh` - Now fully automated deployment

**Deployment Flow:**

```bash
# Startup script now does:
1. Install packages (curl, wget, git, iptables)
2. Install k0s
3. Start k0s controller
4. Install kubectl
5. Setup kubeconfig
6. Install gcloud + configure Docker auth
7. Clone repo → /opt/threads-nextjs
8. Apply namespace.yaml
9. Create k8s secrets (passwords + Docker registry)
10. Deploy postgres.yaml + wait for ready
11. Deploy ml-service.yaml
12. Deploy nextjs.yaml
13. Setup iptables forwarding
14. Show status
```

**Key Features:**

- Idempotent: Uses `kubectl apply` and checks before re-installing
- Waits for PostgreSQL to be ready before continuing
- Uses OAuth2 access token for Artifact Registry (via gcloud)
- Clones repo to get latest manifests
- Shows deployment status at end
