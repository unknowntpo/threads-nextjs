#!/bin/bash
#
# View startup script logs from GCP VM
#

ZONE="us-east1-b"
PROJECT_ID="web-service-design"

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
echo "Viewing startup script logs for $VM_NAME..."
echo ""

# Check if -f flag is passed for following logs
if [[ "$1" == "-f" ]]; then
    echo "Following logs (press Ctrl+C to stop)..."
    echo ""
    gcloud compute ssh "$VM_NAME" \
        --zone="$ZONE" \
        --project="$PROJECT_ID" \
        --tunnel-through-iap \
        --command="sudo tail -f /var/log/startup-script.log"
else
    gcloud compute ssh "$VM_NAME" \
        --zone="$ZONE" \
        --project="$PROJECT_ID" \
        --tunnel-through-iap \
        --command="sudo cat /var/log/startup-script.log"
fi
