#!/usr/bin/env bash
set -e

# Deploy ML service with git SHA tag
TAG=$(git rev-parse --short HEAD)
IMAGE="us-east1-docker.pkg.dev/web-service-design/threads/ml-service"

echo "Building and pushing ${IMAGE}:${TAG}..."
cd ml-service
docker build -t "${IMAGE}:${TAG}" .
docker push "${IMAGE}:${TAG}"
cd ..

echo "Updating kustomization.yaml with new tag..."
cd k8s/overlays/prod
kustomize edit set image "${IMAGE}=${IMAGE}:${TAG}"

echo "Committing and pushing tag update..."
git add kustomization.yaml
git commit -m "deploy: ml-service ${TAG}"
git push

echo "✓ Deployment complete. ArgoCD will sync automatically."
