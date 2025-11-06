# Epic: GCP Deployment with Terraform 🚀

**Status:** ✅ Core Complete (2025-11-05)
**Priority:** High - Required for cost optimization and production deployment
**Effort:** ~40-60 hours (Core: ~25 hours actual)

## Goal

Deploy entire application stack to GCP using Infrastructure as Code with k0s Kubernetes, maximizing cost efficiency.

## Deliverable

Production-ready GCP deployment with Terraform, k0s Kubernetes cluster, ArgoCD GitOps, and automated CI/CD pipeline.

## Architecture

```
Terraform-managed GCP Resources (us-east1-b)
├── VPC & Networking
│   ├── Custom VPC network
│   ├── Firewall rules (SSH via IAP)
│   └── Cloudflare Tunnel (public access)
├── Compute Engine c4a-standard-2 (ARM64, preemptible)
│   ├── k0s Kubernetes v1.34.1
│   ├── PostgreSQL (StatefulSet)
│   ├── ArgoCD (GitOps)
│   ├── Keel (Image auto-update)
│   └── Local-path storage provisioner
├── Artifact Registry
│   └── Docker images (nextjs, ml-service) ARM64
└── Secret Manager (planned)
    ├── Database credentials
    ├── NextAuth secrets
    └── OAuth credentials
```

## Infrastructure as Code (Terraform)

### Implemented ✅

- [x] Terraform project structure (`terraform/`)
- [x] VPC and networking resources
- [x] Compute Engine VM with startup script (c4a-standard-2 ARM64, preemptible)
- [x] IAM service accounts and roles
- [x] Firewall rules (SSH via IAP)
- [x] k0s Kubernetes cluster on VM
- [x] ArgoCD for GitOps deployments
- [x] Keel for automatic image updates from Artifact Registry
- [x] GitHub Actions CI/CD (build ARM64 images, push to Artifact Registry)

### Pending ⏳

- [ ] State backend (GCS bucket with versioning) - using local state
- [ ] Secret Manager integration - using k8s secrets
- [ ] Cloud NAT for VM egress - using direct internet access

## VM Setup (c4a-standard-2 ARM64, preemptible)

### Implemented ✅

- [x] k0s Kubernetes v1.34.1 installed via startup script
- [x] PostgreSQL deployed as k8s StatefulSet
- [x] ArgoCD deployed for GitOps
- [x] Keel deployed for image auto-updates (keelhq/keel-aarch64)
- [x] Local-path storage provisioner for PVCs
- [x] IAP tunnel for k8s API access

### Pending ⏳

- [ ] Automated backups (Cloud Storage)
- [ ] Monitoring and health checks
- [ ] Dagster daemon container (planned)
- [ ] Dagster webserver container (:3001) (planned)

## Kubernetes Deployment (k0s on VM)

### Implemented ✅

- [x] Build and push Docker images to Artifact Registry (ARM64)
- [x] Next.js app deployed as Deployment
- [x] ML service deployed as Deployment
- [x] Environment variables configured with k8s secrets
- [x] Keel polling Artifact Registry for :latest tag updates
- [x] ArgoCD syncing from Git repository
- [x] Services exposed via NodePort (Next.js: 30000)
- [x] Cloudflare Tunnel for public access

### Pending ⏳

- [ ] Configure custom domain (if applicable)
- [ ] Enable logging and monitoring

## CI/CD Integration

### Implemented ✅

- [x] GitHub Actions workflow (deploy-gke.yml)
- [x] Docker build and push to Artifact Registry (ARM64)
- [x] Automatic deployment via Keel (polls every 1min)
- [x] Removed Zeabur workflows

### Pending ⏳

- [ ] Terraform plan on PR
- [ ] Terraform apply on merge to main
- [ ] Prisma migrations in CI/CD
- [ ] Smoke tests after deployment

## What's Complete

### Core Infrastructure ✅

- ✅ Terraform infrastructure (VPC, VM, IAM, firewall)
- ✅ k0s Kubernetes cluster on ARM64 VM
- ✅ ArgoCD + Keel GitOps pipeline
- ✅ GitHub Actions CI/CD with ARM64 builds
- ✅ Next.js and ML service deployments
- ✅ Script library for IAP tunnel management

### Application Fixes ✅

- ✅ NextAuth v4 OAuth integration fixes (Google, GitHub)
- ✅ Custom PrismaAdapter for auto-generating usernames from email
- ✅ Session security improvements (1-day token expiry, NEXTAUTH_SECRET)
- ✅ Production database reset with proper seed data from GSM secrets
- ✅ Cloudflare Tunnel integration for public access
- ✅ Profile management with Threads-style sidebar

## Testing

### Infrastructure Tests

1. ✅ Terraform plan succeeds without errors
2. ✅ All GCP resources created in us-east1-b
3. ✅ PostgreSQL accessible within k8s cluster
4. ✅ Next.js app deployed and accessible via Cloudflare Tunnel
5. ✅ ML service deployed and accessible
6. ✅ CI/CD pipeline builds and pushes ARM64 images successfully
7. ✅ Keel automatically updates pods when new :latest images pushed
8. ✅ ArgoCD syncs manifests from Git
9. ⏳ Monthly cost monitoring (preemptible VM reduces costs)
10. ⏳ Dagster deployment (planned)

## Cost Optimization

**Compute Engine:**

- c4a-standard-2 (ARM64, preemptible)
- Reduced cost vs standard instances
- Auto-restart on preemption

**Artifact Registry:**

- Only stores :latest tags
- Automatic cleanup of old images

**Networking:**

- Cloudflare Tunnel (free)
- Direct internet access (no Cloud NAT costs)

## Technical Decisions

### Why k0s over GKE?

- **Cost**: Free vs GKE cluster management fees
- **Control**: Full cluster configuration
- **Lightweight**: Minimal overhead on VM
- **ARM64**: Native support for ARM architecture

### Why Preemptible VM?

- **Cost savings**: ~80% cheaper than regular instances
- **Acceptable downtime**: Can handle occasional restarts
- **Auto-recovery**: k0s and services auto-restart

### Why ArgoCD + Keel?

- **ArgoCD**: GitOps for declarative deployments
- **Keel**: Automatic image updates on :latest tag
- **Separation**: ArgoCD for manifests, Keel for images
- **Reliability**: Both tools are production-ready

## Scripts and Tools

### IAP Tunnel Management

```bash
# Connect to k8s via IAP
./scripts/connect-k8s.sh

# Port forward to services
kubectl port-forward -n threads svc/postgres 5432:5432
kubectl port-forward -n threads svc/nextjs-app 3000:3000
```

### Database Operations

```bash
# Reset database
./scripts/reset-db.sh

# Run migrations
kubectl exec -it <postgres-pod> -- psql -U threads -d threads
```

## Future Enhancements

- [ ] Migrate to proper GKE cluster (if budget allows)
- [ ] Cloud SQL migration (if budget allows)
- [ ] Dagster deployment for ML pipeline orchestration
- [ ] Multi-region deployment
- [ ] CDN integration (Cloud CDN)
- [ ] Load balancing for high availability
- [ ] Monitoring and alerting setup (Prometheus, Grafana)

## Related Documentation

- [Terraform Configuration](../terraform/)
- [K8s Manifests](../k8s/)
- [GitHub Actions Workflow](../.github/workflows/deploy-gke.yml)
- [Scripts](../scripts/)

## Deployment History

- **2025-11-05**: Initial GCP deployment
  - Terraform infrastructure provisioned
  - k0s Kubernetes cluster deployed
  - ArgoCD and Keel configured
  - Next.js and ML service deployed

- **2025-11-06**: Production stabilization
  - Cloudflare Tunnel integrated
  - OAuth fixes deployed
  - Profile management features added

## Status

✅ **Core deployment complete**

- Infrastructure provisioned
- Applications running in production
- GitOps pipeline operational
- CI/CD automated

⏳ **Enhancements pending**

- Monitoring and observability
- Automated backups
- Dagster integration
