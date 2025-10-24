# GitHub Actions Workflows

## Deploy to GKE Production (`deploy-gke.yml`)

Automated deployment pipeline for GKE using Kustomize and ArgoCD.

### Trigger

- Push to `master` branch
- Manual trigger via `workflow_dispatch`

### What It Does

1. **Builds Docker images** for Next.js and ML Service (ARM64 for GCP Axion VM)
2. **Pushes to Artifact Registry** with git SHA tags
3. **Updates kustomization** in `k8s/overlays/prod/kustomization.yaml`
4. **Commits and pushes** the kustomization change
5. **ArgoCD auto-syncs** within 3 minutes

### Required GitHub Secrets

Add these in repository settings → Secrets and variables → Actions:

- `GCP_SA_KEY`: Service account JSON key with permissions:
  - Artifact Registry Writer
  - Storage Object Viewer

### Setup Instructions

1. **Create GCP Service Account**:

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=web-service-design

# Grant Artifact Registry permissions
gcloud projects add-iam-policy-binding web-service-design \
  --member="serviceAccount:github-actions@web-service-design.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@web-service-design.iam.gserviceaccount.com

# Copy the contents of github-actions-key.json and add as GCP_SA_KEY secret
cat github-actions-key.json
```

2. **Add Secret to GitHub**:
   - Go to: https://github.com/unknowntpo/threads-nextjs/settings/secrets/actions
   - Click "New repository secret"
   - Name: `GCP_SA_KEY`
   - Value: Paste contents of `github-actions-key.json`

3. **Verify Workflow**:

```bash
# Commit and push any change to master
git add .
git commit -m "test: trigger deploy workflow"
git push origin master

# Watch workflow run
# https://github.com/unknowntpo/threads-nextjs/actions
```

### How It Works

```
GitHub Push (master)
  ↓
Build ARM64 images with SHA tags
  ↓
Push to us-east1-docker.pkg.dev/web-service-design/threads
  ↓
Update k8s/overlays/prod/kustomization.yaml
  ↓
Commit and push kustomization change
  ↓
ArgoCD detects git change (polls every 3 min)
  ↓
ArgoCD runs: kustomize build k8s/overlays/prod
  ↓
ArgoCD applies manifests to cluster
  ↓
Kubernetes pulls new images with SHA tags
  ↓
Rolling update to new pods
```

### Troubleshooting

**Workflow fails with "permission denied"**:

- Check `GCP_SA_KEY` secret is set correctly
- Verify service account has `roles/artifactregistry.writer`

**Images not updating in cluster**:

- Check ArgoCD sync status: `kubectl get application threads -n argocd`
- Verify kustomization was updated: `git log k8s/overlays/prod/kustomization.yaml`
- Check image pull secret: `kubectl get secret gcr-json-key -n threads`

**"git push" fails in workflow**:

- Workflow needs `contents: write` permission (already configured)
- Check if branch protection rules block bot commits

**Build times out**:

- ARM64 builds can take 15-20 minutes first time
- Subsequent builds use GitHub Actions cache (faster)
- Consider adding `timeout-minutes: 60` to job

### Other Workflows

- `ci.yml`: Next.js tests
- `ml-service-ci.yml`: ML service tests
- `docker-build-and-publish.yml`: Legacy GHCR builds
- `deploy.yml`: Zeabur deployment (separate platform)
- `provision.yml`: Zeabur provisioning
- `deploy-migrations.yml`: Database migrations

Only `deploy-gke.yml` is used for GKE/ArgoCD deployments.
