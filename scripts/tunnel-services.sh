#!/usr/bin/env bash
# Tunnel to all production services (ArgoCD, Next.js, PostgreSQL, ML Service)
# Usage: ./scripts/tunnel-services.sh

set -e

# Load k8s tunnel library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/k8s-tunnel.sh"

# Configuration
ARGOCD_LOCAL_PORT=18080
NEXTJS_LOCAL_PORT=13000
POSTGRES_LOCAL_PORT=15432
ML_SERVICE_LOCAL_PORT=18000

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting IAP tunnel and service port-forwards...${NC}"

# Clean up all local ports
lsof -ti:${ARGOCD_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti:${NEXTJS_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti:${POSTGRES_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti:${ML_SERVICE_LOCAL_PORT} | xargs kill -9 2>/dev/null || true

# Setup k8s tunnel (sets KUBECONFIG and IAP_TUNNEL_PID)
setup_k8s_tunnel /tmp/iap-tunnel.log

# Port-forward ArgoCD
echo "Starting ArgoCD port-forward (localhost:${ARGOCD_LOCAL_PORT} -> argocd-server:443)..."
kubectl port-forward svc/argocd-server -n argocd ${ARGOCD_LOCAL_PORT}:443 > /tmp/argocd-port-forward.log 2>&1 &
ARGOCD_PID=$!

# Port-forward Next.js
echo "Starting Next.js port-forward (localhost:${NEXTJS_LOCAL_PORT} -> nextjs:3000)..."
kubectl port-forward svc/nextjs -n threads ${NEXTJS_LOCAL_PORT}:3000 > /tmp/nextjs-port-forward.log 2>&1 &
NEXTJS_PID=$!

# Port-forward PostgreSQL
echo "Starting PostgreSQL port-forward (localhost:${POSTGRES_LOCAL_PORT} -> postgres:5432)..."
kubectl port-forward svc/postgres -n threads ${POSTGRES_LOCAL_PORT}:5432 > /tmp/postgres-port-forward.log 2>&1 &
POSTGRES_PID=$!

# Port-forward ML Service
echo "Starting ML Service port-forward (localhost:${ML_SERVICE_LOCAL_PORT} -> ml-service:8000)..."
kubectl port-forward svc/ml-service -n threads ${ML_SERVICE_LOCAL_PORT}:8000 > /tmp/ml-service-port-forward.log 2>&1 &
ML_SERVICE_PID=$!

# Wait for port-forwards to establish
sleep 5

echo ""
echo -e "${GREEN}✓ All tunnels established!${NC}"
echo ""
echo "IAP Tunnel PID: ${IAP_TUNNEL_PID}"
echo "ArgoCD PID: ${ARGOCD_PID}"
echo "Next.js PID: ${NEXTJS_PID}"
echo "PostgreSQL PID: ${POSTGRES_PID}"
echo "ML Service PID: ${ML_SERVICE_PID}"
echo ""
echo -e "${YELLOW}=== Service URLs ===${NC}"
echo ""
echo -e "${YELLOW}ArgoCD UI:${NC} https://localhost:${ARGOCD_LOCAL_PORT}"
echo "  Get admin password:"
echo "  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d"
echo ""
echo -e "${YELLOW}Next.js:${NC} http://localhost:${NEXTJS_LOCAL_PORT}"
echo ""
echo -e "${YELLOW}PostgreSQL:${NC} localhost:${POSTGRES_LOCAL_PORT}"
echo "  Connection string: postgresql://postgres:postgres@localhost:${POSTGRES_LOCAL_PORT}/threads"
echo ""
echo -e "${YELLOW}ML Service:${NC} http://localhost:${ML_SERVICE_LOCAL_PORT}"
echo "  Health check: curl http://localhost:${ML_SERVICE_LOCAL_PORT}/health"
echo ""
echo -e "${YELLOW}Prisma Studio:${NC}"
echo "  Run locally: DATABASE_URL=postgresql://postgres:postgres@localhost:${POSTGRES_LOCAL_PORT}/threads npx prisma studio"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all tunnels${NC}"
echo ""

# Trap Ctrl+C to cleanup
cleanup() {
  echo ""
  echo "Cleaning up..."
  cleanup_k8s_tunnel
  kill ${ARGOCD_PID} 2>/dev/null || true
  kill ${NEXTJS_PID} 2>/dev/null || true
  kill ${POSTGRES_PID} 2>/dev/null || true
  kill ${ML_SERVICE_PID} 2>/dev/null || true
  lsof -ti:${ARGOCD_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
  lsof -ti:${NEXTJS_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
  lsof -ti:${POSTGRES_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
  lsof -ti:${ML_SERVICE_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
  echo "Done"
  exit 0
}

trap cleanup INT TERM

# Keep script running
wait
