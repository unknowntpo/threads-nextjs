#!/usr/bin/env bash
# Quick kubectl access to production k8s cluster
# Usage: ./scripts/kubectl-prod.sh [kubectl args...]
# Example: ./scripts/kubectl-prod.sh get pods -n threads

set -e

# Load k8s tunnel library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/k8s-tunnel.sh"

# Setup tunnel if not already running
if ! is_tunnel_running; then
  echo "Setting up IAP tunnel..."
  setup_k8s_tunnel /tmp/iap-tunnel-kubectl.log

  # Trap cleanup on exit
  trap cleanup_k8s_tunnel EXIT
else
  echo "IAP tunnel already running on port ${IAP_LOCAL_PORT}"
  export KUBECONFIG="${KUBECONFIG_PATH}"
fi

# Run kubectl with provided args
if [ $# -eq 0 ]; then
  echo "Usage: $0 [kubectl args...]"
  echo "Example: $0 get pods -n threads"
  echo ""
  echo "KUBECONFIG is set to: ${KUBECONFIG}"
  exit 1
fi

kubectl "$@"
