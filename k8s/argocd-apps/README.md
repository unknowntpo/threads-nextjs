# ArgoCD Applications

This directory contains ArgoCD Application manifests for deploying the Threads application stack.

## Applications

### threads-app.yaml

Main application deployment that includes:

- Next.js frontend/backend
- ML service (sentiment analysis)
- PostgreSQL database

## Deployment

Apply the ArgoCD Application:

```bash
kubectl apply -f k8s/argocd-apps/threads-app.yaml
```

Or let ArgoCD manage itself:

```bash
# Create an App-of-Apps pattern
kubectl apply -f k8s/argocd-apps/
```

## Sync Policy

- **Automated sync**: Enabled with prune and self-heal
- **Source**: GitHub repo `unknowntpo/threads-nextjs` on `master` branch
- **Path**: `k8s/base` (Kustomize base manifests)
- **Destination**: `threads` namespace in local cluster

## Image Updates

ArgoCD Image Updater is configured to:

- Monitor Artifact Registry for new image tags
- Automatically update deployments when new images are pushed
- Configured in deployment annotations (see `k8s/base/*.yaml`)

## Monitoring

Check application status:

```bash
# Via kubectl
kubectl get applications -n argocd

# Via ArgoCD CLI
argocd app get threads

# Via UI
kubectl port-forward svc/argocd-server -n argocd 18080:443
# Visit: https://localhost:18080
```
