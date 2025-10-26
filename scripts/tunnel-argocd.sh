#!/usr/bin/env bash
# Tunnel to ArgoCD UI on production VM
# Usage: ./scripts/tunnel-argocd.sh

set -e

# Load k8s tunnel library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/k8s-tunnel.sh"

# Configuration
ARGOCD_LOCAL_PORT=18080

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting IAP tunnel and ArgoCD port-forward...${NC}"

# Clean up ArgoCD port
lsof -ti:${ARGOCD_LOCAL_PORT} | xargs kill -9 2>/dev/null || true

# Setup k8s tunnel (sets KUBECONFIG and IAP_TUNNEL_PID)
setup_k8s_tunnel /tmp/iap-tunnel.log

# Port-forward ArgoCD
echo "Starting ArgoCD port-forward (localhost:${ARGOCD_LOCAL_PORT} -> argocd-server:443)..."
kubectl port-forward svc/argocd-server -n argocd ${ARGOCD_LOCAL_PORT}:443 > /tmp/argocd-port-forward.log 2>&1 &
FORWARD_PID=$!

# Wait for port-forward
sleep 3

echo ""
echo -e "${GREEN}✓ Tunnels established!${NC}"
echo ""
echo "IAP Tunnel PID: ${IAP_TUNNEL_PID}"
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
  cleanup_k8s_tunnel
  kill ${FORWARD_PID} 2>/dev/null || true
  lsof -ti:${ARGOCD_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
  echo "Done"
  exit 0
}

trap cleanup INT TERM

# Keep script running
wait
