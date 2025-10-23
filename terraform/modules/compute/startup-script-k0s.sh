#!/bin/bash
#
# Startup script for c4a-standard-2 VM with k0s
# Installs k0s, kubectl, and deploys PostgreSQL + applications on Kubernetes
#
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
echo "[1/10] Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "[2/10] Installing required packages..."
apt-get install -y curl wget git iptables

# Install k0s
if ! command -v k0s &>/dev/null; then
	echo "[3/10] Installing k0s..."
	curl -sSLf https://get.k0s.sh | sudo sh
else
	echo "[3/10] k0s already installed"
fi

# Install k0s as a systemd service (single-node cluster)
if ! systemctl is-active --quiet k0scontroller; then
	echo "[4/10] Setting up k0s controller..."
	sudo k0s install controller --single
	sudo k0s start
	sleep 30 # Wait for k0s to start
	echo "[4/10] k0s controller started"
else
	echo "[4/10] k0s controller already running"
fi

export USERHOME=/home/unknowntpo

echo "user home: $(ls -la $USERHOME)"

echo "alias kc='sudo k0s kubectl'" >>$USERHOME/.bashrc
echo "alias kubectl='sudo k0s kubectl'" >>$USERHOME/.bashrc

source $USERHOME/.bashrc

# Install kubectl
if ! command -v kubectl &>/dev/null; then
	echo "[5/10] Installing kubectl..."
	curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/arm64/kubectl"
	chmod +x kubectl
	mv kubectl /usr/local/bin/
else
	echo "[5/10] kubectl already installed"
fi

# Setup kubeconfig for kubectl
echo "[5/10] Setting up kubeconfig..."
mkdir -p $USERHOME/.kube
sudo k0s kubeconfig admin >$USERHOME/.kube/config
chown -R unknowntpo:unknowntpo $USERHOME/.kube
export KUBECONFIG=$USERHOME/.kube/config

# Install gcloud CLI for Docker authentication
if ! command -v gcloud &>/dev/null; then
	echo "[6/10] Installing gcloud CLI..."
	curl https://sdk.cloud.google.com | bash
	exec -l $SHELL
	gcloud init
else
	echo "[6/10] gcloud CLI already installed"
fi

# Configure Docker to use gcloud as credential helper for Artifact Registry
echo "[6/10] Configuring Docker authentication for Artifact Registry..."
gcloud auth configure-docker us-east1-docker.pkg.dev --quiet

# Clone repository to get k8s manifests
echo "[7/10] Cloning repository for k8s manifests..."
K8S_REPO_DIR="/opt/threads-nextjs"
if [ ! -d "$K8S_REPO_DIR" ]; then
	git clone https://github.com/unknowntpo/threads-nextjs.git $K8S_REPO_DIR
else
	echo "[7/10] Repository already cloned, pulling latest..."
	cd $K8S_REPO_DIR && git pull
fi

# Create namespace
echo "[7/10] Creating namespace..."
sudo k0s kubectl apply -f $K8S_REPO_DIR/k8s/namespace.yaml

# Create secrets
echo "[7/10] Creating k8s secrets..."
sudo k0s kubectl create secret generic postgres-password \
	--from-literal=password="${POSTGRES_PASSWORD}" \
	--namespace=threads \
	--dry-run=client -o yaml | sudo k0s kubectl apply -f -

sudo k0s kubectl create secret generic dagster-postgres-password \
	--from-literal=password="${DAGSTER_POSTGRES_PASSWORD}" \
	--namespace=threads \
	--dry-run=client -o yaml | sudo k0s kubectl apply -f -

# Create Docker registry secret for pulling images from Artifact Registry
echo "[7/10] Creating Docker registry secret..."
# Use gcloud to generate access token
DOCKER_PASSWORD=$(gcloud auth print-access-token)
sudo k0s kubectl create secret docker-registry gcr-json-key \
	--docker-server=us-east1-docker.pkg.dev \
	--docker-username=oauth2accesstoken \
	--docker-password="$DOCKER_PASSWORD" \
	--namespace=threads \
	--dry-run=client -o yaml | sudo k0s kubectl apply -f -

# Deploy PostgreSQL
echo "[8/10] Deploying PostgreSQL..."
sudo k0s kubectl apply -f $K8S_REPO_DIR/k8s/postgres.yaml

# Wait for PostgreSQL to be ready
echo "[8/10] Waiting for PostgreSQL to be ready (timeout: 5 minutes)..."
TIMEOUT=300
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
	if sudo k0s kubectl wait --for=condition=ready pod -l app=postgres -n threads --timeout=10s 2>/dev/null; then
		echo "[8/10] PostgreSQL is ready!"
		break
	fi
	echo "[8/10] PostgreSQL not ready yet, waiting... ($ELAPSED/$TIMEOUT seconds)"
	sleep 10
	ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
	echo "[8/10] WARNING: PostgreSQL did not become ready within timeout!"
	sudo k0s kubectl get pods -n threads
	sudo k0s kubectl describe pod -l app=postgres -n threads
fi

# Deploy ML Service
echo "[9/10] Deploying ML Service..."
sudo k0s kubectl apply -f $K8S_REPO_DIR/k8s/ml-service.yaml

# Deploy Next.js
echo "[9/10] Deploying Next.js..."
sudo k0s kubectl apply -f $K8S_REPO_DIR/k8s/nextjs.yaml

# Setup port forwarding for Next.js (NodePort 30000 -> VM port 3000)
echo "[10/10] Setting up port forwarding..."
# Get VM internal IP
VM_INTERNAL_IP=$(hostname -I | awk '{print $1}')

# Setup iptables rule for port forwarding (VM port 3000 -> NodePort 30000)
if ! iptables -t nat -L PREROUTING -n | grep -q "dpt:3000"; then
	iptables -t nat -A PREROUTING -p tcp --dport 3000 -j REDIRECT --to-port 30000
	echo "[10/10] Port forwarding configured: 3000 -> 30000"
else
	echo "[10/10] Port forwarding already configured"
fi

# Show deployment status
echo ""
echo "=========================================="
echo "Deployment Status:"
echo "=========================================="
sudo k0s kubectl get all -n threads

echo ""
echo "=========================================="
echo "k0s cluster setup complete at $(date)!"
echo "=========================================="
echo "Startup script completed successfully!"
echo "View logs: /var/log/startup-script.log"
echo ""
echo "Access Next.js at: http://$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H 'Metadata-Flavor: Google'):3000"
echo "=========================================="
