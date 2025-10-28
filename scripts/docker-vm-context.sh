#!/bin/bash
#
# Helper script to run Docker commands on GCP VM via IAP tunnel
#

set -e

ZONE="us-east1-b"

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

if [ $# -eq 0 ]; then
    echo "Usage: $0 <docker-command>"
    echo ""
    echo "Examples:"
    echo "  $0 ps                           # List containers"
    echo "  $0 'logs unknowntpo-postgres-1' # View logs"
    echo "  $0 'exec -it postgres bash'     # Interactive shell"
    echo ""
    echo "Or run full commands:"
    echo "  $0 'docker ps'"
    echo "  $0 'docker-compose ps'"
    exit 1
fi

CMD="$@"

# If command doesn't start with 'docker', prepend it
if [[ ! "$CMD" =~ ^docker ]]; then
    CMD="docker $CMD"
fi

# Use sudo for Docker commands on VM
CMD="sudo $CMD"

echo "🔐 Running on VM via IAP tunnel: $CMD"
echo ""

gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --tunnel-through-iap \
  --command="$CMD"
