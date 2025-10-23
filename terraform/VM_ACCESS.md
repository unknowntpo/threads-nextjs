# Secure VM Access Guide

All VM services (Dockge, Dagster) are **NOT publicly accessible**. They can only be accessed through encrypted IAP (Identity-Aware Proxy) tunnels.

## 🔐 Security Model

- **No public firewall rules** for Dockge (5001) or Dagster (3001)
- **IAP-only SSH** access (no direct port 22)
- **Encrypted tunneling** for all service access
- **GCP IAM authentication** required

## 📋 Prerequisites

```bash
# Ensure you're authenticated with gcloud
gcloud auth login

# Set your project
gcloud config set project web-service-design
```

## 🚀 Quick Access

### Access Dockge UI (Docker Compose Management)

```bash
# Start tunnel (will open on http://localhost:5001)
./scripts/tunnel-dockge.sh

# Or specify custom local port
./scripts/tunnel-dockge.sh 5555  # Opens on http://localhost:5555
```

Then open in browser: **http://localhost:5001**

### Access Dagster UI (Data Pipeline Monitoring)

```bash
# Start tunnel (will open on http://localhost:3001)
./scripts/tunnel-dagster.sh

# Or specify custom local port
./scripts/tunnel-dagster.sh 3333  # Opens on http://localhost:3333
```

Then open in browser: **http://localhost:3001**

### SSH to VM

```bash
# Secure SSH via IAP
gcloud compute ssh threads-prod-vm \
  --zone=us-east1-b \
  --tunnel-through-iap
```

## 🐳 Docker CLI Access

Control VM Docker from your local machine via SSH:

```bash
# Run Docker commands on VM
./scripts/docker-vm-context.sh ps
./scripts/docker-vm-context.sh "docker logs unknowntpo-postgres-1"
./scripts/docker-vm-context.sh "docker exec -it unknowntpo-postgres-1 bash"

# Or use gcloud compute ssh directly
gcloud compute ssh threads-prod-vm \
  --zone=us-east1-b \
  --tunnel-through-iap \
  --command="docker ps"
```

## 🛠️ Manual Tunnel Commands

If you need custom tunneling:

```bash
# Tunnel any service port
gcloud compute start-iap-tunnel threads-prod-vm <REMOTE_PORT> \
  --local-host-port=localhost:<LOCAL_PORT> \
  --zone=us-east1-b

# Examples:
# PostgreSQL: 5432
# Dagster:    3001
# Dockge:     5001
# ML Service: 8001
# Ollama:     11434
```

## 📊 Available Services on VM

| Service        | Port  | Access Method                 |
| -------------- | ----- | ----------------------------- |
| **Dockge UI**  | 5001  | `./scripts/tunnel-dockge.sh`  |
| **Dagster UI** | 3001  | `./scripts/tunnel-dagster.sh` |
| **PostgreSQL** | 5432  | IAP tunnel (internal only)    |
| **ML Service** | 8001  | IAP tunnel                    |
| **Ollama**     | 11434 | IAP tunnel                    |

## 🔒 Why IAP Tunneling?

**Security Benefits:**

- ✅ No public IP exposure for sensitive services
- ✅ GCP IAM-based authentication and authorization
- ✅ Encrypted traffic end-to-end
- ✅ Audit logging of all access
- ✅ No need to manage firewall IP allowlists
- ✅ Protection against DDoS and unauthorized access

**Cost Benefits:**

- ✅ No egress charges for tunnel traffic
- ✅ No need for Cloud Load Balancer for these services
- ✅ Stays within free tier limits

## 🚨 Troubleshooting

### Tunnel fails to start

```bash
# Check IAP is enabled
gcloud services list --enabled | grep iap

# Enable if needed
gcloud services enable iap.googleapis.com

# Check VM is running
gcloud compute instances list --filter="name=threads-prod-vm"
```

### "Permission denied" errors

```bash
# Ensure you have IAP tunnel user role
gcloud projects add-iam-policy-binding web-service-design \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/iap.tunnelResourceAccessor"
```

### Docker context not working

```bash
# Recreate context
docker context rm gcp-vm
docker context create gcp-vm \
  --docker "host=ssh://threads-prod-vm.us-east1-b.web-service-design" \
  --description "GCP VM Docker context via gcloud ssh"

# Test
docker --context gcp-vm ps
```

## 📝 Best Practices

1. **Always use tunnels** - Never expose services publicly
2. **Close tunnels** when not in use (Ctrl+C)
3. **Use Docker context** for container management instead of SSH
4. **Check IAM permissions** if access fails
5. **Monitor via Dockge UI** instead of manual docker commands

## 🔗 Related Scripts

- `scripts/tunnel-dockge.sh` - Dockge UI tunnel
- `scripts/tunnel-dagster.sh` - Dagster UI tunnel
- `scripts/docker-vm-context.sh` - Docker context management

## 📚 References

- [IAP TCP Forwarding](https://cloud.google.com/iap/docs/tcp-forwarding-overview)
- [Docker Context Documentation](https://docs.docker.com/engine/context/working-with-contexts/)
- [Dockge GitHub](https://github.com/louislam/dockge)
