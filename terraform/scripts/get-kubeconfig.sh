#!/bin/bash
# Script to fetch kubeconfig from k0s VM via IAP tunnel
# Used by Terraform kubernetes provider

set -e

VM_NAME="threads-prod-vm"
ZONE="us-east1-b"
PROJECT="web-service-design"

# Fetch kubeconfig via gcloud SSH
gcloud compute ssh "$VM_NAME" \
  --zone="$ZONE" \
  --project="$PROJECT" \
  --tunnel-through-iap \
  --command="sudo k0s kubeconfig admin" 2>/dev/null
