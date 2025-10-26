#!/usr/bin/env bash
# Reusable functions for managing IAP tunnel and kubeconfig
# Source this file in other scripts: source "$(dirname "$0")/lib/k8s-tunnel.sh"

# Default configuration
: "${VM_NAME:=threads-prod-vm}"
: "${ZONE:=us-east1-b}"
: "${KUBECONFIG_PATH:=$HOME/.kube/config-threads-k0s}"
: "${IAP_LOCAL_PORT:=16443}"

# Setup IAP tunnel to k0s API server and configure kubeconfig
# Returns: Sets KUBECONFIG environment variable
setup_k8s_tunnel() {
  local log_file="${1:-/tmp/iap-tunnel.log}"

  echo "Setting up IAP tunnel to k0s API server..."

  # Kill existing tunnel on port
  lsof -ti:${IAP_LOCAL_PORT} | xargs kill -9 2>/dev/null || true

  # Start IAP tunnel in background
  echo "Starting IAP tunnel (localhost:${IAP_LOCAL_PORT} -> VM:6443)..."
  gcloud compute start-iap-tunnel ${VM_NAME} 6443 \
    --local-host-port=localhost:${IAP_LOCAL_PORT} \
    --zone=${ZONE} > "${log_file}" 2>&1 &

  export IAP_TUNNEL_PID=$!

  # Wait for tunnel
  echo "Waiting for tunnel to be ready..."
  sleep 5

  # Fetch kubeconfig
  echo "Fetching kubeconfig from VM..."
  gcloud compute ssh ${VM_NAME} \
    --zone=${ZONE} \
    --tunnel-through-iap \
    --command='sudo k0s kubeconfig admin' 2>/dev/null | \
    grep -A 999 'apiVersion:' > "${KUBECONFIG_PATH}"

  # Get VM internal IP dynamically
  local vm_internal_ip=$(gcloud compute instances describe ${VM_NAME} \
    --zone=${ZONE} \
    --format='get(networkInterfaces[0].networkIP)')

  echo "VM internal IP: ${vm_internal_ip}"

  # Update server URL in kubeconfig to use localhost tunnel
  sed -i.bak "s|server: https://${vm_internal_ip}:6443|server: https://localhost:${IAP_LOCAL_PORT}|" "${KUBECONFIG_PATH}"

  # Set kubeconfig permissions
  chmod 600 "${KUBECONFIG_PATH}"

  # Export for use in calling script
  export KUBECONFIG="${KUBECONFIG_PATH}"

  echo "✓ Kubeconfig configured at ${KUBECONFIG_PATH}"
  echo "✓ IAP tunnel PID: ${IAP_TUNNEL_PID}"
}

# Cleanup IAP tunnel
cleanup_k8s_tunnel() {
  echo "Cleaning up IAP tunnel..."
  if [ -n "${IAP_TUNNEL_PID}" ]; then
    kill ${IAP_TUNNEL_PID} 2>/dev/null || true
  fi
  lsof -ti:${IAP_LOCAL_PORT} | xargs kill -9 2>/dev/null || true
}

# Check if tunnel is running
is_tunnel_running() {
  lsof -i:${IAP_LOCAL_PORT} >/dev/null 2>&1
  return $?
}
