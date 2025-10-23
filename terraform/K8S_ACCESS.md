# Kubernetes Cluster Access Guide

This guide explains how to access the k0s Kubernetes cluster running on the GCP VM from your local machine.

## Architecture

- **Cluster**: k0s single-node cluster on c4a-standard-2 VM (8GB RAM)
- **Location**: GCP us-east1-b
- **Access**: Via IAP tunnel (no public k8s API endpoint)
- **Applications**: PostgreSQL, ML-service, Next.js (all in `threads` namespace)

## Prerequisites

1. gcloud CLI installed and authenticated
2. kubectl installed locally
3. IAM permissions for the project

## Setup kubectl Access

### Step 1: Run the setup script

```bash
./scripts/kubectl-setup.sh
```

This script will:

1. SSH into the VM and fetch the kubeconfig
2. Save it to `~/.kube/config-threads-k0s`
3. Update the server URL to use localhost:6443

### Step 2: Set the kubeconfig environment variable

```bash
export KUBECONFIG=$HOME/.kube/config-threads-k0s
```

Add this to your `~/.bashrc` or `~/.zshrc` to make it permanent:

```bash
echo 'export KUBECONFIG=$HOME/.kube/config-threads-k0s' >> ~/.zshrc
```

### Step 3: Start the IAP tunnel

In a separate terminal, run:

```bash
gcloud compute start-iap-tunnel threads-prod-vm 6443 \
  --local-host-port=localhost:6443 \
  --zone=us-east1-b \
  --project=web-service-design
```

Keep this terminal open while using kubectl.

## Using kubectl

Once the tunnel is running, you can use kubectl normally:

```bash
# View cluster info
kubectl cluster-info
kubectl get nodes

# View pods in threads namespace
kubectl get pods -n threads

# View services
kubectl get svc -n threads

# View deployments
kubectl get deployments -n threads

# Check logs
kubectl logs -f deployment/nextjs -n threads
kubectl logs -f deployment/ml-service -n threads
kubectl logs -f deployment/postgres -n threads

# Port forward to access services locally
kubectl port-forward -n threads svc/nextjs 3000:3000
kubectl port-forward -n threads svc/ml-service 8000:8000
kubectl port-forward -n threads svc/postgres 5432:5432

# Execute commands in pods
kubectl exec -it -n threads deployment/postgres -- psql -U postgres -d threads

# Describe resources
kubectl describe pod <pod-name> -n threads
kubectl describe deployment nextjs -n threads

# View events
kubectl get events -n threads --sort-by='.lastTimestamp'
```

## Useful kubectl Commands

### Scaling

```bash
# Scale Next.js replicas
kubectl scale deployment/nextjs --replicas=3 -n threads

# Scale ML service
kubectl scale deployment/ml-service --replicas=2 -n threads
```

### Updates

```bash
# Update Next.js image
kubectl set image deployment/nextjs nextjs=us-east1-docker.pkg.dev/web-service-design/threads/nextjs:arm64 -n threads

# Rollout status
kubectl rollout status deployment/nextjs -n threads

# Rollout history
kubectl rollout history deployment/nextjs -n threads

# Rollback
kubectl rollout undo deployment/nextjs -n threads
```

### Debugging

```bash
# Get pod details
kubectl get pod <pod-name> -n threads -o yaml

# Check resource usage
kubectl top nodes
kubectl top pods -n threads

# Shell into pod
kubectl exec -it <pod-name> -n threads -- /bin/sh

# Copy files from pod
kubectl cp threads/<pod-name>:/path/to/file ./local-file

# View all resources in namespace
kubectl get all -n threads
```

## Helper Scripts

### Quick Access Script

Create `~/.local/bin/k0s-tunnel`:

```bash
#!/bin/bash
gcloud compute start-iap-tunnel threads-prod-vm 6443 \
  --local-host-port=localhost:6443 \
  --zone=us-east1-b \
  --project=web-service-design
```

Make it executable:

```bash
chmod +x ~/.local/bin/k0s-tunnel
```

### Alias for quick kubectl

Add to `~/.zshrc`:

```bash
alias k='kubectl'
alias kgp='kubectl get pods -n threads'
alias kgs='kubectl get svc -n threads'
alias kgd='kubectl get deployments -n threads'
alias kl='kubectl logs -f -n threads'
```

## Accessing Applications

### Next.js Application

**Via VM External IP:**

```
http://<VM_EXTERNAL_IP>:3000
```

**Via Port Forward:**

```bash
kubectl port-forward -n threads svc/nextjs 3000:3000
# Access at http://localhost:3000
```

### ML Service

**Internal only (within cluster):**

```
http://ml-service.threads.svc.cluster.local:8000
```

**Via Port Forward:**

```bash
kubectl port-forward -n threads svc/ml-service 8000:8000
# Access at http://localhost:8000
```

### PostgreSQL

**Via Port Forward:**

```bash
kubectl port-forward -n threads svc/postgres 5432:5432
# Connect with: psql postgresql://postgres:<PASSWORD>@localhost:5432/threads
```

## Viewing Startup Logs

The startup script logs to `/var/log/startup-script.log`.

### View complete logs

```bash
./scripts/view-startup-logs.sh
```

### Follow logs in real-time

```bash
./scripts/view-startup-logs.sh -f
```

### View logs via SSH

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap \
  --command="sudo tail -f /var/log/startup-script.log"
```

### Check startup progress

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap \
  --command="sudo grep '\[' /var/log/startup-script.log | tail -20"
```

The logs show progress markers like:

- `[1/10] Updating system packages...`
- `[2/10] Installing required packages...`
- ...
- `[10/10] Deploying Next.js Application...`

See `STARTUP_LOGS.md` for complete logging guide.

## Troubleshooting

### Tunnel Issues

If the tunnel disconnects:

1. Kill the tunnel process: `Ctrl+C`
2. Restart: `gcloud compute start-iap-tunnel threads-prod-vm 6443 --local-host-port=localhost:6443 --zone=us-east1-b`

### Connection Refused

If kubectl shows "connection refused":

1. Check tunnel is running
2. Verify kubeconfig server URL is `https://localhost:6443`
3. Re-fetch kubeconfig: `./scripts/kubectl-setup.sh`

### Certificate Issues

If you see certificate errors:

1. The kubeconfig contains the CA cert
2. Re-run setup script to get fresh kubeconfig
3. Check `~/.kube/config-threads-k0s` has correct certificate-authority-data

### SSH into VM

Direct access to VM:

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b --project=web-service-design
```

On VM, use k0s kubectl:

```bash
sudo k0s kubectl get pods -n threads
```

## Security Notes

- k8s API is NOT exposed publicly (only via IAP tunnel)
- IAP tunnel requires GCP IAM authentication
- Secrets stored in k8s secrets (passwords, credentials)
- No LoadBalancer services (using NodePort for Next.js)

## Additional Resources

- [k0s Documentation](https://docs.k0sproject.io/)
- [GCP IAP Tunneling](https://cloud.google.com/iap/docs/using-tcp-forwarding)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
