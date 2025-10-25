#!/bin/bash
#
# View startup script logs from GCP VM
#

ZONE="us-east1-b"
VM_NAME="threads-prod-vm"
PROJECT_ID="web-service-design"

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
