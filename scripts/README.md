# Scripts

Production deployment and management scripts for threads-nextjs.

## IAP Tunnel & Kubernetes Access

### Library: `lib/k8s-tunnel.sh`

Reusable functions for managing IAP tunnel to k8s API server. Source this in other scripts:

```bash
source "$(dirname "$0")/lib/k8s-tunnel.sh"

# Setup tunnel and kubeconfig
setup_k8s_tunnel /tmp/iap-tunnel.log

# Check if tunnel is running
if is_tunnel_running; then
  echo "Tunnel active"
fi

# Cleanup
cleanup_k8s_tunnel
```

**Configuration (override via env vars):**

- `VM_NAME` - default: `threads-prod-vm`
- `ZONE` - default: `us-east1-b`
- `KUBECONFIG_PATH` - default: `~/.kube/config-threads-k0s`
- `IAP_LOCAL_PORT` - default: `16443`

### Scripts Using the Library

#### `tunnel-argocd.sh`

Opens IAP tunnel + ArgoCD UI port-forward. Access at https://localhost:18080

```bash
./scripts/tunnel-argocd.sh
# Get password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```

#### `kubectl-prod.sh`

Quick kubectl access to production cluster

```bash
./scripts/kubectl-prod.sh get pods -n threads
./scripts/kubectl-prod.sh logs -n threads deployment/nextjs
```

## Deployment Scripts

### `deploy-nextjs.sh`

Deploy Next.js app to production (manual trigger)

### `deploy-ml-service.sh`

Deploy ML service to production (manual trigger)

## Other

### `docker-vm-context.sh`

Switch local docker context to production VM

### `view-startup-logs.sh`

View VM startup script logs for debugging
