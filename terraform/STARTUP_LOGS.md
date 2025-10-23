# Startup Script Logging Guide

The startup script logs all output to `/var/log/startup-script.log`.

## Features

1. **Progress markers**: Shows `[1/10]`, `[2/10]`, etc. for each major step
2. **Timestamps**: Start and completion times
3. **Persistent logs**: Saved to `/var/log/startup-script.log`
4. **Real-time viewing**: Can tail logs while script runs

## Quick Commands

### View all logs

```bash
./scripts/view-startup-logs.sh
```

### Follow logs in real-time

```bash
./scripts/view-startup-logs.sh -f
```

### Direct SSH access

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap \
  --command="sudo cat /var/log/startup-script.log"
```

### Check progress only

```bash
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap \
  --command="sudo grep '\[' /var/log/startup-script.log"
```

## Startup Steps

The script runs 10 major steps:

1. **[1/10]** Update system packages
2. **[2/10]** Install required packages (curl, wget)
3. **[3/10]** Install k0s
4. **[4/10]** Start k0s controller
5. **[5/10]** Install kubectl
6. **[6/10]** Setup kubeconfig & gcloud CLI
7. **[7/10]** Create namespace & secrets
8. **[8/10]** Deploy PostgreSQL (waits up to 5min for ready)
9. **[9/10]** Deploy ML Service
10. **[10/10]** Deploy Next.js + setup port forwarding

## Example Output

```
==========================================
Starting k0s setup at Thu Oct 23 02:24:00 UTC 2025
==========================================

[1/10] Updating system packages...
[2/10] Installing required packages...
[3/10] Installing k0s...
[4/10] Setting up k0s controller...
[4/10] k0s controller started
[5/10] Installing kubectl...
[5/10] kubectl installed
[6/10] Setting up kubeconfig...
[6/10] gcloud CLI already installed
[6/10] Configuring Docker authentication for Artifact Registry...
[7/10] Creating k8s manifests directory...
[7/10] Creating 'threads' namespace...
[7/10] Creating k8s secrets...
[7/10] Secrets created
[8/10] Deploying PostgreSQL...
[8/10] Waiting for PostgreSQL to be ready (timeout: 5min)...
[8/10] PostgreSQL is ready
[9/10] Deploying ML Service...
[10/10] Deploying Next.js Application...
[10/10] Setting up iptables port forwarding (3000 -> 30000)...

==========================================
k0s cluster setup complete at Thu Oct 23 02:28:45 UTC 2025!
==========================================

Cluster info:
...

Pods:
NAME                        READY   STATUS    RESTARTS   AGE
nextjs-...                  1/1     Running   0          30s
ml-service-...              1/1     Running   0          45s
postgres-...                1/1     Running   0          2m

==========================================
Startup script completed successfully!
==========================================
```

## Debugging Tips

### Check if startup is complete

```bash
sudo grep "Startup script completed" /var/log/startup-script.log
```

### Find errors

```bash
sudo grep -i error /var/log/startup-script.log
```

### Check last 50 lines

```bash
sudo tail -50 /var/log/startup-script.log
```

### Watch logs live during deployment

```bash
./scripts/view-startup-logs.sh -f
# or directly:
sudo tail -f /var/log/startup-script.log
```

### Check progress markers

```bash
sudo grep '\[.*\]' /var/log/startup-script.log
```

## Log Location

- **File**: `/var/log/startup-script.log`
- **Permissions**: Root only (use `sudo`)
- **Persistence**: Survives reboots
- **Format**: Plain text with timestamps
- **Also available in**: `journalctl -u google-startup-scripts.service`

## Next Step After Startup

Once you see "Startup script completed successfully!", you can:

1. Setup kubectl access: `./scripts/kubectl-setup.sh`
2. Start IAP tunnel for k8s API
3. Use kubectl to manage the cluster

See `K8S_ACCESS.md` for full kubectl access guide.
