#!/bin/bash
#
# Setup local kubectl access to k0s cluster on GCP VM via IAP tunnel
#

set -e

# Source the library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/k8s-tunnel.sh"

echo "Setting up kubectl access to k0s cluster..."

# Setup tunnel and kubeconfig
setup_k8s_tunnel

echo ""
echo "✓ Setup complete!"
echo ""
echo "To use kubectl, run:"
echo "  export KUBECONFIG=${KUBECONFIG_PATH}"
echo ""
echo "Then you can use kubectl:"
echo "  kubectl get pods -n threads"
echo "  kubectl get svc -n threads"
echo "  kubectl logs -f deployment/nextjs -n threads"
echo ""
echo "To cleanup the tunnel when done:"
echo "  kill ${IAP_TUNNEL_PID}"
echo ""
