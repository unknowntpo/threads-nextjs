#!/bin/bash
#
# Startup script for c4a-standard-2 VM with k0s + ArgoCD
# Provisions k8s cluster and installs ArgoCD for GitOps deployment
#
# ArgoCD will automatically deploy applications from GitHub repo
# View logs: sudo cat /var/log/startup-script.log
#            sudo tail -f /var/log/startup-script.log
#

set -e

# Redirect all output to log file and console
exec > >(tee -a /var/log/startup-script.log)
exec 2>&1

echo "=========================================="
echo "Starting k0s setup at $(date)"
echo "=========================================="

# Update system packages
echo "[1/7] Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "[2/7] Installing required packages..."
apt-get install -y curl wget iptables

# Install k0s
if ! command -v k0s &>/dev/null; then
	echo "[3/7] Installing k0s..."
	curl -sSLf https://get.k0s.sh | sudo sh
else
	echo "[3/7] k0s already installed"
fi

# Install k0s as a systemd service (single-node cluster)
if ! systemctl is-active --quiet k0scontroller; then
	echo "[3/7] Setting up k0s controller..."
	sudo k0s install controller --single
	sudo k0s start
	sleep 30 # Wait for k0s to start
	echo "[3/7] k0s controller started"
else
	echo "[3/7] k0s controller already running"
fi

export USERHOME=/home/unknowntpo

echo "alias kc='sudo k0s kubectl'" >>$USERHOME/.bashrc
echo "alias kubectl='sudo k0s kubectl'" >>$USERHOME/.bashrc

# Install kubectl
if ! command -v kubectl &>/dev/null; then
	echo "[4/7] Installing kubectl..."
	curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl"
	chmod +x kubectl
	mv kubectl /usr/local/bin/
else
	echo "[4/7] kubectl already installed"
fi

# Setup kubeconfig
echo "[4/7] Setting up kubeconfig..."
mkdir -p $USERHOME/.kube
sudo k0s kubeconfig admin >$USERHOME/.kube/config
chown -R unknowntpo:unknowntpo $USERHOME/.kube
export KUBECONFIG=$USERHOME/.kube/config

# Install ArgoCD
echo "[5/7] Installing ArgoCD..."
sudo k0s kubectl create namespace argocd --dry-run=client -o yaml | sudo k0s kubectl apply -f -
sudo k0s kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
echo "[5/7] Waiting for ArgoCD to be ready..."
sudo k0s kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Create secrets in threads namespace
echo "[6/7] Creating secrets for applications..."
sudo k0s kubectl create namespace threads --dry-run=client -o yaml | sudo k0s kubectl apply -f -

sudo k0s kubectl create secret generic postgres-password \
	--from-literal=password="${POSTGRES_PASSWORD}" \
	--namespace=threads \
	--dry-run=client -o yaml | sudo k0s kubectl apply -f -

sudo k0s kubectl create secret generic dagster-postgres-password \
	--from-literal=password="${DAGSTER_POSTGRES_PASSWORD}" \
	--namespace=threads \
	--dry-run=client -o yaml | sudo k0s kubectl apply -f -

# Create Docker registry secret for Artifact Registry
# Note: Uses Compute Engine default service account which has Artifact Registry access
DOCKER_PASSWORD=$(gcloud auth print-access-token)
sudo k0s kubectl create secret docker-registry gcr-json-key \
	--docker-server=us-east1-docker.pkg.dev \
	--docker-username=oauth2accesstoken \
	--docker-password="$DOCKER_PASSWORD" \
	--namespace=threads \
	--dry-run=client -o yaml | sudo k0s kubectl apply -f -

# Deploy ArgoCD Application
echo "[7/7] Deploying ArgoCD Application..."
cat <<EOF | sudo k0s kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: threads
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/unknowntpo/threads-nextjs.git
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: threads
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
EOF

# Setup port forwarding for Next.js (NodePort 30000 -> VM port 3000)
echo "[7/7] Setting up port forwarding..."
if ! iptables -t nat -L PREROUTING -n | grep -q "dpt:3000"; then
	iptables -t nat -A PREROUTING -p tcp --dport 3000 -j REDIRECT --to-port 30000
	echo "[7/7] Port forwarding configured: 3000 -> 30000"
else
	echo "[7/7] Port forwarding already configured"
fi

# Show ArgoCD and app status
echo ""
echo "=========================================="
echo "ArgoCD Status:"
echo "=========================================="
sudo k0s kubectl get pods -n argocd
echo ""
echo "Application Status:"
sudo k0s kubectl get application -n argocd
echo ""
echo "Threads Namespace:"
sudo k0s kubectl get all -n threads 2>/dev/null || echo "Waiting for ArgoCD to sync..."

echo ""
echo "=========================================="
echo "k0s + ArgoCD setup complete at $(date)!"
echo "=========================================="
echo "Startup script completed successfully!"
echo ""
echo "ArgoCD will automatically deploy applications from GitHub"
echo "Monitor deployment: kubectl get application -n argocd"
echo "View logs: /var/log/startup-script.log"
echo ""
echo "Access Next.js at: http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google'):3000"
echo "ArgoCD UI: Port-forward to access (kubectl port-forward svc/argocd-server -n argocd 8080:443)"
echo "=========================================="
