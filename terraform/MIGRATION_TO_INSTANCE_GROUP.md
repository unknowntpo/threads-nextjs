# Migration Guide: Single VM → Managed Instance Group

This guide explains how to migrate from a single SPOT VM to a managed instance group with auto-healing.

## Why Migrate?

**Problem**: SPOT VMs can be terminated by GCP at any time, causing downtime.

**Solution**: Managed Instance Group with auto-healing:

- Automatically recreates failed VMs
- Health check monitoring (k0s API server)
- Zero-downtime updates
- Better resilience

## Architecture Changes

### Before (Single VM)

```
google_compute_instance.vm
  ├── SPOT VM (can be terminated)
  ├── No automatic restart
  └── Manual recovery needed
```

### After (Instance Group)

```
google_compute_region_instance_group_manager
  ├── google_compute_instance_template (defines VM config)
  ├── google_compute_health_check (monitors k0s API)
  ├── Auto-healing (recreates on failure)
  └── Target size: 1 (maintains one VM)
```

## Migration Steps

### Step 1: Backup Current Data

**⚠️ CRITICAL**: Backup your k0s cluster data before migration!

```bash
# SSH into current VM
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap

# Backup k0s configuration
sudo tar -czf /tmp/k0s-backup.tar.gz \
    /var/lib/k0s \
    /etc/k0s

# Download backup to local machine
exit
gcloud compute scp threads-prod-vm:/tmp/k0s-backup.tar.gz ~/k0s-backup.tar.gz \
    --zone=us-east1-b --tunnel-through-iap
```

### Step 2: Export Current kubeconfig

```bash
# Get current kubeconfig
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap \
    --command='sudo k0s kubeconfig admin' > ~/.kube/config-threads-k0s.backup

# Backup current kubeconfig
cp ~/.kube/config-threads-k0s ~/.kube/config-threads-k0s.backup
```

### Step 3: Destroy Old VM

```bash
cd terraform

# Set environment variables
export TF_VAR_gcp_service_account_key=$(cat ~/.gcp/terraform-admin-key.json)
export KUBECONFIG=~/.kube/config-threads-k0s

# Destroy old VM resource
terraform destroy -target=module.compute.google_compute_instance.vm

# Confirm destruction
```

### Step 4: Apply Instance Group

```bash
# Apply new instance group resources
terraform apply -target=module.compute

# This will create:
# - Instance template
# - Health checks
# - Managed instance group (with 1 instance)
```

### Step 5: Wait for New VM to Start

```bash
# Check instance group status
gcloud compute instance-groups managed list-instances \
    threads-prod-vm-group \
    --region=us-east1

# Wait until status shows "RUNNING"
# This may take 5-10 minutes (k0s startup + health check)
```

### Step 6: Get New VM IP Address

```bash
# Get new VM name (will be threads-prod-vm-XXXX)
VM_NAME=$(gcloud compute instances list \
    --filter="name~threads-prod-vm" \
    --format="value(name)")

echo "New VM name: $VM_NAME"

# Get external IP
NEW_EXTERNAL_IP=$(gcloud compute instances list \
    --filter="name=$VM_NAME" \
    --format="value(networkInterfaces[0].accessConfigs[0].natIP)")

echo "New external IP: $NEW_EXTERNAL_IP"

# Get internal IP
NEW_INTERNAL_IP=$(gcloud compute instances list \
    --filter="name=$VM_NAME" \
    --format="value(networkInterfaces[0].networkIP)")

echo "New internal IP: $NEW_INTERNAL_IP"
```

### Step 7: Update kubeconfig

```bash
# Get new kubeconfig
gcloud compute ssh $VM_NAME --zone=us-east1-b --tunnel-through-iap \
    --command='sudo k0s kubeconfig admin' > ~/.kube/config-threads-k0s

# Update server endpoint for IAP tunnel
sed -i '' 's|https://[0-9.]*:6443|https://localhost:16443|' ~/.kube/config-threads-k0s

# Start IAP tunnel to new VM
gcloud compute start-iap-tunnel $VM_NAME 6443 \
    --local-host-port=localhost:16443 \
    --zone=us-east1-b &

# Test connection
kubectl get nodes
```

### Step 8: Verify Services

```bash
# Check k0s status
gcloud compute ssh $VM_NAME --zone=us-east1-b --tunnel-through-iap \
    --command='sudo k0s status'

# Check all pods are running
kubectl get pods --all-namespaces

# Check ArgoCD
kubectl get pods -n argocd

# Check application pods
kubectl get pods -n threads
```

### Step 9: Update DNS/Firewall (if needed)

If you have external DNS or firewall rules pointing to the old VM IP:

```bash
# Update any external references to use new IP
echo "Old External IP: (from backup)"
echo "New External IP: $NEW_EXTERNAL_IP"

# Update firewall rules if needed
# Update DNS A records if needed
```

## Verification Checklist

- [ ] Instance group shows 1 instance in RUNNING state
- [ ] Health check is passing (k0s API accessible on port 6443)
- [ ] kubectl can connect to cluster
- [ ] All pods are running (`kubectl get pods -A`)
- [ ] ArgoCD is operational
- [ ] Applications are accessible
- [ ] IAP tunnel works for SSH access
- [ ] Backups are stored safely

## Rollback Plan

If something goes wrong:

```bash
# Stop IAP tunnel
pkill -f "gcloud compute start-iap-tunnel"

# Destroy instance group
terraform destroy -target=module.compute.google_compute_region_instance_group_manager.vm_group
terraform destroy -target=module.compute.google_compute_instance_template.vm_template
terraform destroy -target=module.compute.google_compute_health_check.k0s_api

# Uncomment old VM resource in modules/compute/main.tf
# Then re-apply
terraform apply -target=module.compute

# Restore kubeconfig
cp ~/.kube/config-threads-k0s.backup ~/.kube/config-threads-k0s

# Restore k0s data if needed
gcloud compute scp ~/k0s-backup.tar.gz threads-prod-vm:/tmp/ \
    --zone=us-east1-b --tunnel-through-iap
gcloud compute ssh threads-prod-vm --zone=us-east1-b --tunnel-through-iap \
    --command='sudo tar -xzf /tmp/k0s-backup.tar.gz -C /'
```

## Auto-Healing Behavior

### Health Check Configuration

The instance group monitors k0s API server health:

- **Port**: 6443 (k0s API server)
- **Check interval**: 60 seconds
- **Timeout**: 10 seconds
- **Healthy threshold**: 2 consecutive successes
- **Unhealthy threshold**: 3 consecutive failures

### What Triggers Auto-Healing?

1. **k0s API server down**: If port 6443 is unreachable
2. **VM terminated**: If SPOT VM is preempted by GCP
3. **VM unresponsive**: If VM stops responding to health checks

### Auto-Healing Process

1. Health check fails 3 times (3 minutes)
2. Instance group marks VM as unhealthy
3. New VM is created from template
4. Old VM is deleted
5. New VM starts k0s and joins cluster
6. Health check passes after 5 minutes
7. VM marked as healthy

**Total recovery time**: ~10-15 minutes

## Monitoring

### Check Instance Group Status

```bash
# List instances in group
gcloud compute instance-groups managed list-instances \
    threads-prod-vm-group \
    --region=us-east1

# Check health status
gcloud compute instance-groups managed get-health \
    threads-prod-vm-group \
    --region=us-east1
```

### Check Health Check Logs

```bash
# View health check results
gcloud logging read "resource.type=gce_health_check" \
    --limit=50 \
    --format=json
```

### Monitor Auto-Healing Events

```bash
# View instance group operations
gcloud compute operations list \
    --filter="targetLink:threads-prod-vm-group" \
    --limit=10
```

## Cost Impact

**No change in cost**: Instance group with size=1 costs the same as a single VM.

- SPOT VM pricing: ~$0.01/hour
- No additional charge for instance group management
- No additional charge for health checks

## Troubleshooting

### Problem: VM keeps restarting

**Cause**: Health check failing

**Solution**:

```bash
# Check VM logs
gcloud compute instances get-serial-port-output $VM_NAME --zone=us-east1-b

# Check k0s status
gcloud compute ssh $VM_NAME --zone=us-east1-b --tunnel-through-iap \
    --command='sudo k0s status && sudo journalctl -u k0scontroller -n 100'

# Temporarily disable auto-healing
gcloud compute instance-groups managed update threads-prod-vm-group \
    --region=us-east1 \
    --remove-autohealing
```

### Problem: Can't SSH to new VM

**Cause**: IAP firewall rule or wrong VM name

**Solution**:

```bash
# Verify IAP firewall rule exists
gcloud compute firewall-rules list --filter="name~iap"

# Use correct VM name with wildcard
gcloud compute ssh $(gcloud compute instances list --filter="name~threads-prod-vm" --format="value(name)") \
    --zone=us-east1-b --tunnel-through-iap
```

### Problem: kubectl can't connect

**Cause**: Kubeconfig points to old VM IP

**Solution**:

```bash
# Get fresh kubeconfig
VM_NAME=$(gcloud compute instances list --filter="name~threads-prod-vm" --format="value(name)")
gcloud compute ssh $VM_NAME --zone=us-east1-b --tunnel-through-iap \
    --command='sudo k0s kubeconfig admin' > ~/.kube/config-threads-k0s

# Update for tunnel
sed -i '' 's|https://[0-9.]*:6443|https://localhost:16443|' ~/.kube/config-threads-k0s

# Restart tunnel
pkill -f "gcloud compute start-iap-tunnel"
gcloud compute start-iap-tunnel $VM_NAME 6443 --local-host-port=localhost:16443 --zone=us-east1-b &
```

## Next Steps

After successful migration:

1. **Monitor for 24 hours**: Watch for any auto-healing events
2. **Test failure recovery**: Manually terminate VM to test auto-healing
3. **Update documentation**: Update any docs with new VM naming pattern
4. **Set up alerting**: Add Cloud Monitoring alerts for instance group health

## References

- [GCP Managed Instance Groups](https://cloud.google.com/compute/docs/instance-groups)
- [Auto-healing Documentation](https://cloud.google.com/compute/docs/instance-groups/autohealing-instances-in-migs)
- [Health Checks](https://cloud.google.com/load-balancing/docs/health-checks)
