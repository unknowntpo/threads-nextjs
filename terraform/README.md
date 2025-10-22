# Threads Next.js - GCP Infrastructure (Terraform)

This directory contains Terraform configuration for deploying the Threads Next.js application to Google Cloud Platform, optimized for free tier usage.

## Architecture Overview

```
GCP Infrastructure (us-east1)
├── Compute Engine: e2-micro VM (always-free)
│   ├── PostgreSQL 16 (threads + dagster databases)
│   ├── Dagster daemon
│   ├── Dagster webserver (:3001)
│   └── Ollama service (:11434)
├── Cloud Run Services (2M requests/mo free)
│   ├── Next.js application
│   └── ML service (FastAPI)
├── VPC & Networking
│   ├── Custom VPC with subnet
│   ├── Firewall rules
│   └── Cloud NAT
└── Secret Manager (6 secrets free)
    ├── Database credentials
    ├── NextAuth secrets
    └── OAuth credentials
```

## Prerequisites

1. **GCP Project**: Create a new GCP project or use an existing one
2. **Terraform**: Install Terraform >= 1.5.0
   ```bash
   brew install terraform  # macOS
   ```
3. **Google Cloud SDK**: Install and authenticate
   ```bash
   brew install google-cloud-sdk  # macOS
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project YOUR_PROJECT_ID
   ```
4. **Docker Images**: Build and push Next.js and ML service images to Artifact Registry
   ```bash
   # See docs/GCP_DEPLOYMENT.md for detailed instructions
   ```

## Quick Start

### 1. Enable Required APIs

```bash
gcloud services enable compute.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable iam.googleapis.com
```

### 2. Create Terraform State Bucket

```bash
# Create GCS bucket for Terraform state (replace with your project ID)
gsutil mb -p YOUR_PROJECT_ID -l us-east1 gs://YOUR_PROJECT_ID-terraform-state

# Enable versioning
gsutil versioning set on gs://YOUR_PROJECT_ID-terraform-state
```

### 3. Configure Secrets (GitHub Secrets - Recommended)

**🔐 All secrets are stored in GitHub Secrets for security!**

Secrets are centrally managed in GitHub and never committed to the repository. This prevents:

- ✅ Accidental exposure of credentials
- ✅ Cost exploitation from bucket enumeration
- ✅ Secrets scattered across local files

**Required GitHub Secrets:**

```bash
# Critical secrets (already configured)
TF_STATE_BUCKET              # Random bucket name: threads-tf-state-{16-char-hex}
GCP_PROJECT_ID               # web-service-design
POSTGRES_PASSWORD            # Auto-generated strong password
DAGSTER_POSTGRES_PASSWORD    # Auto-generated strong password
NEXTAUTH_SECRET              # Auto-generated secret
GOOGLE_CLIENT_SECRET         # Already configured

# Still needed (get from OAuth providers)
GOOGLE_CLIENT_ID             # From Google Cloud Console
GITHUB_CLIENT_ID             # From GitHub Settings > Developer
GITHUB_CLIENT_SECRET         # From GitHub Settings > Developer
NEXTAUTH_URL                 # Update after first Cloud Run deployment
```

**Add missing secrets:**

```bash
# Google OAuth (get from https://console.cloud.google.com/apis/credentials)
echo 'your-google-client-id' | gh secret set GOOGLE_CLIENT_ID

# GitHub OAuth (get from https://github.com/settings/developers)
echo 'your-github-client-id' | gh secret set GITHUB_CLIENT_ID
echo 'your-github-client-secret' | gh secret set GITHUB_CLIENT_SECRET
```

**For local development:**

```bash
# Run helper script to check secrets
./scripts/setup-terraform-secrets.sh

# Copy example and fill in values manually
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with values from GitHub Secrets
```

**For CI/CD (recommended):**

Secrets are automatically injected in GitHub Actions - no local `terraform.tfvars` needed!

### 4. Initialize Terraform

```bash
terraform init \
  -backend-config="bucket=YOUR_PROJECT_ID-terraform-state" \
  -backend-config="prefix=terraform/state"
```

### 5. Plan and Apply

```bash
# Review planned changes
terraform plan

# Apply changes
terraform apply
```

## Module Structure

```
terraform/
├── main.tf                    # Root configuration
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars.example   # Template for variables
├── modules/
│   ├── networking/            # VPC, firewall, Cloud NAT
│   ├── compute/               # e2-micro VM with Docker Compose
│   ├── secrets/               # Secret Manager
│   └── cloudrun/              # Cloud Run services
```

## Important Outputs

After `terraform apply`, you'll get:

- `vm_external_ip`: External IP for SSH and Dagster UI
- `vm_internal_ip`: Internal IP for database connections
- `nextjs_url`: Cloud Run URL for Next.js app
- `ml_service_url`: Cloud Run URL for ML service
- `dagster_ui_url`: URL to access Dagster UI (http://VM_IP:3001)

## Free Tier Limits

- **Compute Engine**: 1x e2-micro in us-east1 (0.25-0.5 vCPU, 1 GB RAM)
- **Cloud Run**: 2M requests/mo, 360K GB-seconds, 180K vCPU-seconds
- **Networking**: 1 GB egress/mo (North America)
- **Secret Manager**: 6 active secret versions
- **Persistent Disk**: 30 GB standard disk
- **Target monthly cost**: ≤ $5 after free tier credits

## Common Commands

```bash
# Format Terraform files
terraform fmt -recursive

# Validate configuration
terraform validate

# Show current state
terraform show

# List all resources
terraform state list

# Get specific output
terraform output vm_external_ip

# Destroy all resources
terraform destroy
```

## Accessing Services

### SSH to VM (via IAP)

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b
```

### View Docker Compose logs

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b \
  --command="cd /opt/threads && sudo docker-compose logs -f"
```

### Dagster UI

Open `http://VM_EXTERNAL_IP:3001` in your browser

### Next.js App

Open the Cloud Run URL from `terraform output nextjs_url`

## Troubleshooting

### VM startup script failed

```bash
# Check startup script logs
gcloud compute instances get-serial-port-output threads-prod-vm --zone=us-east1-b

# SSH and check Docker Compose
gcloud compute ssh threads-prod-vm --zone=us-east1-b
cd /opt/threads
sudo docker-compose ps
sudo docker-compose logs
```

### Cloud Run deployment failed

```bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --format json
```

### Database connection issues

```bash
# Test PostgreSQL from VM
gcloud compute ssh threads-prod-vm --zone=us-east1-b
sudo docker exec -it threads-postgres-1 psql -U postgres -d threads
```

## Security Notes

### GitHub Secrets Management

- ✅ **All secrets in GitHub Secrets** - Central, encrypted storage
- ✅ **Bucket name randomized** - `threads-tf-state-{16-char-hex}` prevents enumeration
- ✅ **No local secret files** - `terraform.tfvars` is gitignored
- ✅ **CI/CD ready** - GitHub Actions automatically injects secrets
- ✅ **Access control** - Only authorized GitHub users can view/edit

### Additional Security

- **Never commit `terraform.tfvars`** - Use GitHub Secrets instead
- **Use IAP for SSH access** - Don't expose port 22 publicly
- **Restrict Dagster UI** - Limit to your IP in production
- **Rotate secrets regularly** - Update GitHub Secrets monthly
- **Enable VPC Service Controls** - For production deployments
- **Monitor bucket access** - Check GCS logs for unauthorized attempts

## Next Steps

1. Configure custom domain for Cloud Run
2. Set up Cloud Monitoring dashboards
3. Configure alert policies
4. Set up automated backups for PostgreSQL
5. Implement CI/CD with GitHub Actions

## References

- [GCP Free Tier](https://cloud.google.com/free/docs/free-cloud-features)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Compute Engine Documentation](https://cloud.google.com/compute/docs)
