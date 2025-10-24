#!/usr/bin/env bash
# Tunnel to ArgoCD UI on production VM
# Usage: ./scripts/tunnel-argocd.sh

set -e

VM_NAME="threads-prod-vm"
ZONE="us-east1-b"
KUBECONFIG_PATH="$HOME/.kube/config-threads-k0s"
ARGOCD_LOCAL_PORT=18080

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting IAP tunnel and ArgoCD port-forward...${NC}"

# Kill existing processes on ports
echo "Cleaning up existing tunnels..."
lsof -ti:16443 | xargs kill -9 2>/dev/null || true
lsof -ti:${ARGOCD_LOCAL_PORT} | xargs kill -9 2>/dev/null || true

# Start IAP tunnel in background
echo "Starting IAP tunnel to k0s API (localhost:16443 -> VM:6443)..."
gcloud compute start-iap-tunnel ${VM_NAME} 6443 \
  --local-host-port=localhost:16443 \
  --zone=${ZONE} > /tmp/iap-tunnel.log 2>&1 &
IAP_PID=$!

# Wait for tunnel
echo "Waiting for tunnel to be ready..."
sleep 5

# Fetch kubeconfig
echo "Fetching kubeconfig..."
gcloud compute ssh ${VM_NAME} \
  --zone=${ZONE} \
  --tunnel-through-iap \
  --command='sudo k0s kubeconfig admin' 2>/dev/null | \
  grep -A 999 'apiVersion:' > ${KUBECONFIG_PATH}

# Update server URL in kubeconfig to use localhost
sed -i.bak 's|server: https://10.0.0.11:6443|server: https://localhost:16443|' ${KUBECONFIG_PATH}

echo -e "${GREEN}Kubeconfig saved to ${KUBECONFIG_PATH}${NC}"

# Port-forward ArgoCD
echo "Starting ArgoCD port-forward (localhost:${ARGOCD_LOCAL_PORT} -> argocd-server:443)..."
export KUBECONFIG=${KUBECONFIG_PATH}
kubectl port-forward svc/argocd-server -n argocd ${ARGOCD_LOCAL_PORT}:443 > /tmp/argocd-port-forward.log 2>&1 &
FORWARD_PID=$!

# Wait for port-forward
sleep 3

echo ""
echo -e "${GREEN}✓ Tunnels established!${NC}"
echo ""
echo "IAP Tunnel PID: ${IAP_PID}"
echo "Port-forward PID: ${FORWARD_PID}"
echo ""
echo -e "${YELLOW}ArgoCD UI:${NC} https://localhost:${ARGOCD_LOCAL_PORT}"
echo ""
echo "Get admin password:"
echo "  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Trap Ctrl+C to cleanup
cleanup() {
  echo ""
  echo "Cleaning up..."
  kill ${IAP_PID} 2>/dev/null || true
  kill ${FORWARD_PID} 2>/dev/null || true
  lsof -ti:16443 | xargs kill -9 2>/dev/null || true
  lsof -ti:${ARGOCD_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
  echo "Done"
  exit 0
}

trap cleanup INT TERM

# Keep script running
wait
