#!/bin/bash
#
# Helper script to run Docker commands on GCP VM via IAP tunnel
#

set -e

VM_NAME="threads-prod-vm"
ZONE="us-east1-b"

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
