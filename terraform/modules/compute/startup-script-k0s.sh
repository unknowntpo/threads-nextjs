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
apt-get install -y curl wget

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

echo ""
echo "=========================================="
echo "k0s cluster setup complete at $(date)!"
echo "=========================================="
echo "Startup script completed successfully!"
echo "View logs: /var/log/startup-script.log"
echo "=========================================="
