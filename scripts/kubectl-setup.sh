#!/bin/bash
#
# Setup local kubectl access to k0s cluster on GCP VM via IAP tunnel
#

set -e

ZONE="us-east1-b"
PROJECT_ID="web-service-design"
KUBECONFIG_PATH="$HOME/.kube/config-threads-k0s"

echo "Setting up kubectl access to k0s cluster..."

# Auto-detect VM name from instance group
echo "Detecting VM name from instance group..."
VM_NAME=$(gcloud compute instances list \
	--filter="name~threads-prod-vm" \
	--format="value(name)" \
	--limit=1)

if [ -z "$VM_NAME" ]; then
	echo "Error: No VM found matching 'threads-prod-vm'"
	exit 1
fi

echo "Found VM: $VM_NAME"

# Create kubeconfig directory if it doesn't exist
mkdir -p "$HOME/.kube"

# Fetch kubeconfig from VM
echo "Fetching kubeconfig from VM..."
gcloud compute ssh "$VM_NAME" \
	--zone="$ZONE" \
	--project="$PROJECT_ID" \
	--command="sudo cat /root/.kube/config admin" \
	>"$KUBECONFIG_PATH"

# Get VM internal IP
VM_INTERNAL_IP=$(gcloud compute instances describe "$VM_NAME" \
	--zone="$ZONE" \
	--project="$PROJECT_ID" \
	--format='get(networkInterfaces[0].networkIP)')

echo "VM Internal IP: $VM_INTERNAL_IP"

# Update kubeconfig to use localhost:6443 (will tunnel through IAP)
# Replace the server URL with localhost
sed -i.bak "s|https://.*:6443|https://localhost:6443|g" "$KUBECONFIG_PATH"

echo ""
echo "✓ Kubeconfig saved to: $KUBECONFIG_PATH"
echo ""
echo "To use this config, run:"
echo "  export KUBECONFIG=$KUBECONFIG_PATH"
echo ""
echo "Then start the IAP tunnel for k8s API server (port 6443):"
echo "  gcloud compute start-iap-tunnel $VM_NAME 6443 --local-host-port=localhost:6443 --zone=$ZONE --project=$PROJECT_ID"
echo ""
echo "After the tunnel is running, you can use kubectl:"
echo "  kubectl get pods -n threads"
echo "  kubectl get svc -n threads"
echo "  kubectl logs -f deployment/nextjs -n threads"
echo ""
