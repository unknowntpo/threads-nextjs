#!/bin/bash
# Emergency shutdown script for GCP resources
# Run this to stop all threads-app related resources

set -e

PROJECT_ID="web-service-design"
CLUSTER_NAME="threads-cluster"
ZONE="us-central1-a"

echo "🛑 Shutting down GCP resources for threads app..."

# Delete GKE cluster (this removes all running pods/services)
echo "Deleting GKE cluster: $CLUSTER_NAME"
gcloud container clusters delete $CLUSTER_NAME \
  --zone=$ZONE \
  --project=$PROJECT_ID \
  --quiet

echo "✅ GKE cluster deleted"

# List and optionally delete container images
echo "Container images in registry:"
gcloud container images list --project=$PROJECT_ID

echo ""
echo "To delete images, run:"
echo "gcloud container images delete gcr.io/$PROJECT_ID/threads-app --quiet"

echo ""
echo "🎉 Shutdown complete! No more compute costs."
echo "Note: Container Registry storage may still incur minimal costs."