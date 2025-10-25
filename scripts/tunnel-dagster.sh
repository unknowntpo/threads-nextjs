#!/bin/bash
#
# IAP Tunnel to Dagster UI (Data pipeline monitoring)
#

set -e

VM_NAME="threads-prod-vm"
ZONE="us-east1-b"
LOCAL_PORT="${1:-3001}"
REMOTE_PORT="3001"

echo "🔐 Starting secure IAP tunnel to Dagster UI..."
echo "VM: $VM_NAME"
echo "Local:  http://localhost:$LOCAL_PORT"
echo "Remote: $REMOTE_PORT"
echo ""
echo "Press Ctrl+C to stop the tunnel"
echo ""

gcloud compute start-iap-tunnel "$VM_NAME" "$REMOTE_PORT" \
  --local-host-port="localhost:$LOCAL_PORT" \
  --zone="$ZONE"
