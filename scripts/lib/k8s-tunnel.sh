#!/usr/bin/env bash
# Reusable functions for managing IAP tunnel and kubeconfig
# Source this file in other scripts: source "$(dirname "$0")/lib/k8s-tunnel.sh"

# Default configuration
: "${ZONE:=us-east1-b}"
: "${KUBECONFIG_PATH:=$HOME/.kube/config-threads-k0s}"
: "${IAP_LOCAL_PORT:=16443}"

# Auto-detect VM name if not provided
get_vm_name() {
  if [ -z "${VM_NAME}" ]; then
    VM_NAME=$(gcloud compute instances list \
      --filter="name~threads-prod-vm" \
      --format="value(name)" \
      --limit=1 2>/dev/null)

    if [ -z "$VM_NAME" ]; then
      echo "Error: No VM found matching 'threads-prod-vm'" >&2
      return 1
    fi

    export VM_NAME
  fi
  echo "$VM_NAME"
}

# Setup IAP tunnel to k0s API server and configure kubeconfig
# Returns: Sets KUBECONFIG environment variable
setup_k8s_tunnel() {
  local log_file="${1:-/tmp/iap-tunnel.log}"

  echo "Setting up IAP tunnel to k0s API server..."

  # Auto-detect VM name
  VM_NAME=$(get_vm_name) || return 1
  echo "Using VM: ${VM_NAME}"

  # Check instance health
  echo "Checking instance health..."
  local vm_status=$(gcloud compute instances describe ${VM_NAME} \
    --zone=${ZONE} \
    --format="value(status)")

  if [ "$vm_status" != "RUNNING" ]; then
    echo "Error: VM is not running (status: $vm_status)" >&2
    return 1
  fi

  # Fetch kubeconfig using --tunnel-through-iap (creates temporary tunnel)
  echo "Fetching kubeconfig from VM via IAP..."
  local kubeconfig_output
  local temp_file=$(mktemp)

  # SSH with IAP handles tunneling for us
  if ! gcloud compute ssh ${VM_NAME} \
    --zone=${ZONE} \
    --tunnel-through-iap \
    --command='sudo k0s kubeconfig admin' > "${temp_file}" 2>&1; then
    echo "Error: Failed to fetch kubeconfig from VM" >&2
    cat "${temp_file}" >&2
    rm -f "${temp_file}"
    return 1
  fi

  kubeconfig_output=$(cat "${temp_file}")
  rm -f "${temp_file}"

  # Extract kubeconfig (skip any warnings/errors before apiVersion)
  echo "$kubeconfig_output" | grep -A 999 'apiVersion:' > "${KUBECONFIG_PATH}"

  if [ ! -s "${KUBECONFIG_PATH}" ]; then
    echo "Error: Kubeconfig file is empty" >&2
    return 1
  fi

  # Get VM internal IP dynamically
  local vm_internal_ip=$(gcloud compute instances describe ${VM_NAME} \
    --zone=${ZONE} \
    --format='get(networkInterfaces[0].networkIP)')

  echo "VM internal IP: ${vm_internal_ip}"

  # Update server URL in kubeconfig to use localhost tunnel
  sed -i.bak "s|server: https://${vm_internal_ip}:6443|server: https://localhost:${IAP_LOCAL_PORT}|" "${KUBECONFIG_PATH}"

  # Set kubeconfig permissions
  chmod 600 "${KUBECONFIG_PATH}"

  # Kill existing tunnel on port
  lsof -ti:${IAP_LOCAL_PORT} | xargs kill -9 2>/dev/null || true

  # Now start persistent IAP tunnel for kubectl access
  echo "Starting persistent IAP tunnel (localhost:${IAP_LOCAL_PORT} -> VM:6443)..."
  gcloud compute start-iap-tunnel ${VM_NAME} 6443 \
    --local-host-port=localhost:${IAP_LOCAL_PORT} \
    --zone=${ZONE} > /tmp/iap-tunnel.log 2>&1 &

  export IAP_TUNNEL_PID=$!

  # Wait for tunnel to establish
  echo "Waiting for tunnel to establish..."
  sleep 3

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
