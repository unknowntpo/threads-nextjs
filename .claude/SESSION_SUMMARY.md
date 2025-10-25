# Session Summary: Kustomize Migration & GitOps Setup

**Date:** 2025-10-24
**Status:** ✅ Kustomize structure complete - Ready for GitHub CI/CD

---

## Session Objective

Migrate k8s deployment from sed-based image tagging to Kustomize overlays, and prepare for GitHub Actions CI/CD automation.

## Work Completed This Session

### 1. ✅ Restructured k8s Directory with Kustomize Base/Overlays

**Structure created:**

```
k8s/
├── base/
│   ├── kustomization.yaml      # No image tags, just resources
│   ├── namespace.yaml
│   ├── postgres.yaml
│   ├── ml-service.yaml
│   └── nextjs.yaml
└── overlays/
    └── prod/
        └── kustomization.yaml  # Environment-specific image tags
```

**Files:**

`k8s/base/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - postgres.yaml
  - ml-service.yaml
  - nextjs.yaml
```

`k8s/overlays/prod/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

images:
  - name: us-east1-docker.pkg.dev/web-service-design/threads/nextjs
    newTag: '0000000' # Updated by deploy script with git SHA
  - name: us-east1-docker.pkg.dev/web-service-design/threads/ml-service
    newTag: '0000000' # Updated by deploy script with git SHA
```

**Benefits:**

- Base manifests are environment-agnostic and reusable
- Can add `overlays/staging` or `overlays/dev` with different configs
- Image tags managed declaratively via Kustomize
- No more sed hacks

### 2. ✅ Updated ArgoCD Application to Use Overlays

**File:** `terraform/modules/argocd/argocd-application.yaml`

**Change:** Updated path from `k8s` → `k8s/overlays/prod`

```yaml
spec:
  source:
    repoURL: https://github.com/unknowntpo/threads-nextjs.git
    targetRevision: HEAD
    path: k8s/overlays/prod # Points to prod overlay
```

**Applied via Terraform:**

```bash
KUBECONFIG=~/.kube/config-threads-k0s terraform apply
```

**Result:** ArgoCD now reads kustomize overlay and auto-syncs on git changes.

### 3. ✅ Created Deployment Scripts Using Kustomize

**Files created:**

- `scripts/deploy-nextjs.sh`
- `scripts/deploy-ml-service.sh`

**deploy-nextjs.sh:**

```bash
#!/usr/bin/env bash
set -e

TAG=$(git rev-parse --short HEAD)
IMAGE="us-east1-docker.pkg.dev/web-service-design/threads/nextjs"

echo "Building and pushing ${IMAGE}:${TAG}..."
docker build -t "${IMAGE}:${TAG}" .
docker push "${IMAGE}:${TAG}"

echo "Updating kustomization.yaml with new tag..."
cd k8s/overlays/prod
kustomize edit set image "${IMAGE}=${IMAGE}:${TAG}"

echo "Committing and pushing tag update..."
git add kustomization.yaml
git commit -m "deploy: nextjs ${TAG}"
git push

echo "✓ Deployment complete. ArgoCD will sync automatically."
```

**How it works:**

1. Builds image with git SHA tag (e.g., `abc1234`)
2. Pushes to Artifact Registry
3. Updates `k8s/overlays/prod/kustomization.yaml` using `kustomize edit`
4. Commits and pushes the kustomization change
5. ArgoCD detects git change and deploys new image

**Why git SHA tags:**

- Unique per commit (no caching issues)
- Traceable to exact code version
- Forces Kubernetes to pull new image

### 4. ✅ Integrated ML Service Repository

**Action:** Merged `https://github.com/unknowntpo/threads-ml` into `./ml-service/`

**Steps:**

```bash
git clone https://github.com/unknowntpo/threads-ml ml-service
rm -rf ml-service/.git
git add ml-service/
git commit -m "feat: integrate ml-service repository"
```

**Result:** ML service now part of monorepo, same CI/CD workflow.

### 5. ✅ Fixed TypeScript Build Issues

**File:** `app/api/track/route.ts`

**Changes:**

1. Added Prisma import: `import { Prisma } from '@prisma/client'`
2. Fixed metadata type casting:

```typescript
metadata: interaction.metadata
  ? (interaction.metadata as Prisma.InputJsonValue)
  : Prisma.JsonNull,
```

**Result:** Next.js Docker build now succeeds.

---

## Technical Concepts Explained

### How Kustomize Works with ArgoCD

1. **Base manifests** (`k8s/base/*.yaml`) contain image references like:

   ```yaml
   image: us-east1-docker.pkg.dev/web-service-design/threads/nextjs:latest
   ```

2. **Overlay kustomization** (`k8s/overlays/prod/kustomization.yaml`) specifies:

   ```yaml
   images:
     - name: us-east1-docker.pkg.dev/web-service-design/threads/nextjs
       newTag: abc1234
   ```

3. **Kustomize matches** on image repository (ignoring tag), replaces with `newTag`

4. **ArgoCD auto-detects** `kustomization.yaml`, runs `kustomize build`, applies final manifests

5. **Final deployed manifest** has:
   ```yaml
   image: us-east1-docker.pkg.dev/web-service-design/threads/nextjs:abc1234
   ```

### Git SHA Tagging Strategy

**Problem:** Using `:latest` tag causes Kubernetes to cache images even with `imagePullPolicy: Always`

**Solution:** Tag images with git commit SHA:

- Each commit gets unique tag
- Kubernetes sees different image digest
- Forces re-pull from registry
- Enables rollback to any commit

**Example:**

```bash
git rev-parse --short HEAD  # Returns: abc1234
docker build -t nextjs:abc1234 .
kustomize edit set image nextjs:abc1234
```

---

## Files Modified

1. ✅ `k8s/base/kustomization.yaml` - Created base kustomization
2. ✅ `k8s/base/*.yaml` - Moved from `k8s/*.yaml`
3. ✅ `k8s/overlays/prod/kustomization.yaml` - Created prod overlay
4. ✅ `terraform/modules/argocd/argocd-application.yaml` - Updated path to `k8s/overlays/prod`
5. ✅ `scripts/deploy-nextjs.sh` - Created deployment script
6. ✅ `scripts/deploy-ml-service.sh` - Created deployment script
7. ✅ `ml-service/` - Integrated entire ml-service repo
8. ✅ `app/api/track/route.ts` - Fixed Prisma imports
9. ✅ `.claude/SESSION_SUMMARY.md` - This file

---

## Current Status

### ✅ Working

- Kustomize base/overlay structure
- ArgoCD pointing to `k8s/overlays/prod`
- Deploy scripts using `kustomize edit`
- Git SHA-based image tagging
- ML service integrated into monorepo

### ⏳ Pending

- GitHub Actions workflow for automated deployment
- CI/CD pipeline to:
  1. Build Docker images on push to main
  2. Tag with git SHA
  3. Push to Artifact Registry
  4. Update kustomization.yaml
  5. Commit back to repo
  6. Trigger ArgoCD sync

---

## Next Steps: GitHub CI/CD Setup

### Goal

Automate the deployment process currently done by `scripts/deploy-*.sh` using GitHub Actions.

### Workflow Requirements

**Trigger:** Push to `main` branch

**Jobs:**

1. **Build & Push Next.js Image**
   - Checkout code
   - Set up Docker Buildx
   - Authenticate to Artifact Registry
   - Build multi-arch image (ARM64 for GCP Axion VM)
   - Tag with `${{ github.sha }}`
   - Push to `us-east1-docker.pkg.dev/web-service-design/threads/nextjs:$SHA`

2. **Build & Push ML Service Image**
   - Same steps as Next.js
   - Push to `us-east1-docker.pkg.dev/web-service-design/threads/ml-service:$SHA`

3. **Update Kustomization**
   - Install kustomize CLI
   - Run `kustomize edit set image` for both images
   - Commit `k8s/overlays/prod/kustomization.yaml`
   - Push back to repo

4. **Wait for ArgoCD Sync** (optional)
   - ArgoCD auto-syncs within 3 minutes
   - Or trigger manual sync via ArgoCD API

### Required Secrets

Add to GitHub repository secrets:

- `GCP_SA_KEY` - Service account JSON key with Artifact Registry push permissions
- `GCP_PROJECT_ID` - `web-service-design`

### Example Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  GCP_PROJECT_ID: web-service-design
  GCP_REGION: us-east1
  ARTIFACT_REGISTRY: us-east1-docker.pkg.dev/web-service-design/threads

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Authenticate to Artifact Registry
        uses: docker/login-action@v3
        with:
          registry: us-east1-docker.pkg.dev
          username: _json_key
          password: ${{ secrets.GCP_SA_KEY }}

      - name: Build and push Next.js
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/arm64
          push: true
          tags: ${{ env.ARTIFACT_REGISTRY }}/nextjs:${{ github.sha }}

      - name: Build and push ML Service
        uses: docker/build-push-action@v5
        with:
          context: ./ml-service
          platforms: linux/arm64
          push: true
          tags: ${{ env.ARTIFACT_REGISTRY }}/ml-service:${{ github.sha }}

      - name: Update kustomization
        run: |
          cd k8s/overlays/prod
          kustomize edit set image \
            ${{ env.ARTIFACT_REGISTRY }}/nextjs=${{ env.ARTIFACT_REGISTRY }}/nextjs:${{ github.sha }} \
            ${{ env.ARTIFACT_REGISTRY }}/ml-service=${{ env.ARTIFACT_REGISTRY }}/ml-service:${{ github.sha }}

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add k8s/overlays/prod/kustomization.yaml
          git commit -m "deploy: update images to ${{ github.sha }}"
          git push
```

---

## Architecture

```
GitHub Repository (main branch)
  |
  |-- Push triggers GitHub Actions
  |
  v
GitHub Actions Workflow
  |
  |-- Build Docker images (ARM64)
  |-- Push to Artifact Registry with SHA tags
  |-- Update k8s/overlays/prod/kustomization.yaml
  |-- Commit and push back to repo
  |
  v
ArgoCD (running on GCP VM)
  |
  |-- Detects git change (poll every 3 min)
  |-- Runs: kustomize build k8s/overlays/prod
  |-- Applies rendered manifests to cluster
  |
  v
Kubernetes Pods
  |
  |-- Pulls images with new SHA tags
  |-- Rolling update deployment
  |-- Health checks pass
  |-- Service routes to new pods
```

---

## Key Design Decisions

### 1. Git SHA Tags Over Semantic Versioning

- **Why:** Ensures every commit is deployable and traceable
- **Trade-off:** Less human-readable than `v1.2.3`, but more granular

### 2. Kustomize Over Helm

- **Why:** Simpler, declarative, native kubectl support
- **Trade-off:** Less templating power, but easier to understand

### 3. Overlays for Environments

- **Why:** Separation of base config from environment-specific overrides
- **Future:** Add `overlays/staging` with lower replicas, different secrets

### 4. GitHub Actions Over Cloud Build

- **Why:** Free for public repos, simpler secrets management
- **Trade-off:** Must authenticate to GCP, but GitHub Actions has good GCP support

### 5. Auto-commit from CI

- **Why:** Single source of truth (git), human-readable diffs
- **Trade-off:** Creates extra commits, but enables GitOps

---

## Troubleshooting

### Issue: "Skipping sync attempt: auto-sync will wipe out all resources"

**Cause:** ArgoCD detected that changing from `path: k8s` to `path: k8s/overlays/prod` would delete existing resources.

**Solution:**

1. Temporarily disable auto-prune: `kubectl patch application threads -n argocd --type merge -p '{"spec":{"syncPolicy":{"automated":{"prune":false}}}}'`
2. Delete and recreate Application: `terraform state rm module.argocd.kubectl_manifest.argocd_application && terraform apply`
3. Re-enable auto-prune

### Issue: Image not pulling despite new tag

**Check:**

1. Is tag actually updated in kustomization.yaml?
   ```bash
   cat k8s/overlays/prod/kustomization.yaml
   ```
2. Did ArgoCD sync?
   ```bash
   kubectl get application threads -n argocd
   ```
3. Is OAuth token expired in gcr-json-key secret?
   ```bash
   kubectl get secret gcr-json-key -n threads -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d
   ```

### Issue: GitHub Actions can't push commits

**Cause:** Default `GITHUB_TOKEN` has limited permissions

**Solution:** Use PAT (Personal Access Token) or enable workflow permissions:

```yaml
permissions:
  contents: write
```

---

## Lessons Learned

1. **Kustomize matching:** The `name:` field in `images:` matches only the repository part (no tag), making it flexible for different base tags.

2. **ArgoCD path changes:** Changing `path:` in an Application causes ArgoCD to think resources should be pruned. Safer to delete and recreate.

3. **Git SHA strategy:** Using short SHA (7 chars) is sufficient and keeps tags readable. Full SHA is overkill.

4. **Terraform state sync:** When manually deleting k8s resources, Terraform state can get out of sync. Use `terraform state rm` before recreating.

5. **OAuth vs Service Account:** OAuth tokens expire after 1 hour. For CI/CD, use service account JSON keys in gcr-json-key secret.

---

## References

- [Kustomize Documentation](https://kustomize.io/)
- [ArgoCD Kustomize Support](https://argo-cd.readthedocs.io/en/stable/user-guide/kustomize/)
- [GitHub Actions - Docker Build Push](https://github.com/docker/build-push-action)
- [GCP Artifact Registry Authentication](https://cloud.google.com/artifact-registry/docs/docker/authentication)
- [Kubernetes Image Pull Policies](https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy)

---

**End of Session Summary**
