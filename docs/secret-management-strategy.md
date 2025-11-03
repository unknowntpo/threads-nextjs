# Secret Management Strategy

**Status**: 📋 Planning Phase
**Last Updated**: 2025-11-03

## Overview

This document outlines our secret management approach for the Threads application, covering current implementation, local development needs, and future migration to Vault as a unified abstraction layer.

## Current Architecture (Production)

### Production: External Secrets Operator + GCP Secret Manager

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION (GKE/k0s)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ClusterSecretStore: gcpsm-secret-store                 │ │
│  │  provider:                                             │ │
│  │    gcpsm:                                              │ │
│  │      projectID: web-service-design                     │ │
│  │      auth: VM service account                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ GCP Secret Manager                                     │ │
│  │   - nextauth-secret (AUTH_SECRET)                      │ │
│  │   - alice-password                                     │ │
│  │   - bob-password                                       │ │
│  │   - postgres-password (future)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼ ESO syncs every 1h                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ K8s Secret: nextauth-secret (ESO-created)              │ │
│  │   data:                                                │ │
│  │     secret: <base64>                                   │ │
│  │     alice_password: <base64>                           │ │
│  │     bob_password: <base64>                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼ secretKeyRef in pod env                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Pod: nextjs-xxxxx                                      │ │
│  │   env:                                                 │ │
│  │     AUTH_SECRET: <from secret>                         │ │
│  │     ALICE_PASSWORD: <from secret>                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Components:**

- **External Secrets Operator**: Deployed via terraform/01-k8s
- **GCP Secret Manager**: Secrets stored in `web-service-design` project
- **VM Service Account**: Has `roles/secretmanager.secretAccessor`
- **ClusterSecretStore**: `gcpsm-secret-store` (needs to be deployed)

**Benefits:**

- ✅ Secrets not in git
- ✅ Centralized management (GCP Console)
- ✅ Audit logging (GCP Cloud Audit Logs)
- ✅ Automatic rotation support

**Limitations:**

- ❌ Requires GCP (not portable)
- ❌ Can't test locally without GCP credentials
- ❌ Different workflow for local vs prod

## Current Approach (Local Development)

### Local: Plain Kubernetes Secrets

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL (Docker Desktop K8s)                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ K8s Secret: nextauth-secret (manual kubectl apply)     │ │
│  │   data:                                                │ │
│  │     secret: ZGV2LXNlY3JldC1mb3ItbG9jYWw=               │ │
│  │     alice_password: MDUzNGZjZGU...                     │ │
│  │     bob_password: MDUzNGZjZGU...                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                     │                                        │
│                     ▼ secretKeyRef in pod env                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Pod: nextjs-xxxxx                                      │ │
│  │   env:                                                 │ │
│  │     AUTH_SECRET: dev-secret-for-local                  │ │
│  │     ALICE_PASSWORD: 0534fcde3061...                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Setup:**

```bash
# Create local secrets
kubectl create secret generic nextauth-secret \
  --from-literal=secret="dev-secret-for-local" \
  --from-literal=alice_password="0534fcde3061dd177f45a9092712cbb83beeda8d" \
  --from-literal=bob_password="0534fcde3061dd177f45a9092712cbb83beeda8d" \
  -n threads
```

**Benefits:**

- ✅ Simple, no external dependencies
- ✅ Fast setup
- ✅ No cloud costs

**Limitations:**

- ❌ Secrets in kubectl commands (shell history)
- ❌ Manual management
- ❌ Different from production

## Future Architecture: Vault as Abstraction Layer

### Goal: Unified Interface for Local + Production

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BOTH LOCAL + PROD                                 │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ClusterSecretStore: vault-backend (same for both!)                  │ │
│  │  provider:                                                          │ │
│  │    vault:                                                           │ │
│  │      server: http://vault:8200                                      │ │
│  │      path: secret                                                   │ │
│  │      version: v2                                                    │ │
│  │      auth:                                                          │ │
│  │        kubernetes:                                                  │ │
│  │          role: external-secrets                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                │                                          │
│                                ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ExternalSecret: nextauth-credentials (same manifest!)               │ │
│  │  spec:                                                              │ │
│  │    secretStoreRef: vault-backend                                    │ │
│  │    data:                                                            │ │
│  │      - secretKey: secret                                            │ │
│  │        remoteRef:                                                   │ │
│  │          key: secret/nextauth                                       │ │
│  │          property: secret                                           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                ▼                                ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│        LOCAL VAULT           │   │     PRODUCTION VAULT         │
│                              │   │                              │
│  Storage: In-memory          │   │  Storage: GCS                │
│  Backend: KV v2              │   │  Backend: GCP SM Engine      │
│                              │   │                              │
│  Secrets:                    │   │  Secrets Engine:             │
│    secret/                   │   │    gcpsm/                    │
│      nextauth/               │   │      ↓                       │
│        secret: "dev-..."     │   │    GCP Secret Manager        │
│        alice_password: "..." │   │      nextauth-secret         │
│                              │   │      alice-password          │
└──────────────────────────────┘   └──────────────────────────────┘
```

### Vault Configuration

#### Local Vault (Dev Mode)

```hcl
# Tiltfile configures Vault in dev mode
k8s_yaml('k8s/vault/local-vault.yaml')

# Vault runs with:
# - In-memory storage
# - Root token auto-generated
# - KV v2 secrets engine enabled
```

#### Production Vault (GCP Backend)

```hcl
# terraform/modules/vault/main.tf
storage "gcs" {
  bucket = "threads-vault-storage"
}

# Mount GCP Secret Manager as secrets engine
vault {
  secrets_engine "gcpsm" {
    path = "gcpsm"
    config {
      credentials = google_service_account_key.vault_sa.private_key
    }
  }
}
```

### Benefits of Vault Abstraction

**Unified Workflow:**

- ✅ Same ClusterSecretStore for local + prod
- ✅ Same ExternalSecret manifests
- ✅ Only Vault backend differs

**Developer Experience:**

- ✅ Local: `tilt up` → Vault dev mode auto-configured
- ✅ Prod: Vault with GCP SM backend
- ✅ Same `vault kv put secret/nextauth secret=...` command

**Security:**

- ✅ Secrets encrypted at rest (Vault)
- ✅ Audit logging (Vault audit device)
- ✅ Fine-grained access control (Vault policies)
- ✅ Secret rotation support

**Portability:**

- ✅ Not locked to GCP (can switch to AWS Secrets Manager, etc.)
- ✅ Multi-cloud ready
- ✅ Can use different backends per environment

## Migration Path

### Phase 1: Current State (✅ DONE)

- External Secrets Operator deployed
- GCP Secret Manager API enabled
- VM service account with secretAccessor role

### Phase 2: Fix Current Issues (🚧 IN PROGRESS)

- [ ] Add IAM role `roles/secretmanager.secretAccessor` to terraform
- [ ] Deploy ClusterSecretStore to k8s
- [ ] Create secrets in GCP Secret Manager
- [ ] Create ExternalSecret manifests
- [ ] Update nextjs.yaml with env vars

### Phase 3: Local Development Setup (📋 NEXT)

- [ ] Set up Tilt for local k8s dev
- [ ] Create k8s/overlays/local with plain secrets
- [ ] Test local workflow
- [ ] Document local setup

### Phase 4: Vault Integration (🔮 FUTURE)

- [ ] Deploy Vault to k8s (terraform module)
- [ ] Configure Vault dev mode for local
- [ ] Configure Vault with GCP SM backend for prod
- [ ] Migrate ClusterSecretStore to Vault provider
- [ ] Test end-to-end workflow
- [ ] Document Vault setup

### Phase 5: Migrate All Secrets (🔮 FUTURE)

- [ ] Migrate postgres-password to Vault
- [ ] Migrate OAuth secrets (Google, GitHub)
- [ ] Remove Kustomize secretGenerator
- [ ] Update all ExternalSecrets

## Implementation Details

### Setting Up Vault (Phase 4)

**Terraform Module: `terraform/modules/vault`**

```hcl
resource "helm_release" "vault" {
  name       = "vault"
  repository = "https://helm.releases.hashicorp.com"
  chart      = "vault"
  namespace  = "vault"

  values = [
    yamlencode({
      server = {
        ha = {
          enabled = true
          replicas = 3
        }
        dataStorage = {
          enabled = true
          storageClass = "local-path"
        }
      }
    })
  ]
}
```

**Local Vault (Tilt)**

```yaml
# k8s/vault/local-vault.yaml
apiVersion: v1
kind: Pod
metadata:
  name: vault-dev
  namespace: vault
spec:
  containers:
    - name: vault
      image: hashicorp/vault:1.15
      args:
        - server
        - -dev
        - -dev-root-token-id=root
      ports:
        - containerPort: 8200
```

**Production Vault Config**

```hcl
# vault-config.hcl
storage "gcs" {
  bucket     = "threads-vault-storage"
  ha_enabled = true
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

seal "gcpckms" {
  project     = "web-service-design"
  region      = "us-east1"
  key_ring    = "vault-keyring"
  crypto_key  = "vault-key"
}
```

## Secrets Inventory

### Current Secrets

| Secret Name         | Location (Prod)           | Location (Local) | Purpose              |
| ------------------- | ------------------------- | ---------------- | -------------------- |
| `nextauth-secret`   | GCP SM (planned)          | K8s Secret       | NextAuth AUTH_SECRET |
| `alice-password`    | GCP SM (planned)          | K8s Secret       | Test user password   |
| `bob-password`      | GCP SM (planned)          | K8s Secret       | Test user password   |
| `postgres-password` | Kustomize                 | Kustomize        | PostgreSQL password  |
| `gcr-json-key`      | External Secrets Operator | N/A              | GCR image pull       |

### Future Secrets (Phase 5)

| Secret Name            | Vault Path                          | Purpose              |
| ---------------------- | ----------------------------------- | -------------------- |
| `nextauth-secret`      | `secret/nextauth/secret`            | NextAuth AUTH_SECRET |
| `nextauth-url`         | `secret/nextauth/url`               | NextAuth AUTH_URL    |
| `alice-password`       | `secret/users/alice`                | Test user            |
| `bob-password`         | `secret/users/bob`                  | Test user            |
| `postgres-password`    | `secret/database/postgres`          | DB password          |
| `google-client-id`     | `secret/oauth/google/client_id`     | OAuth                |
| `google-client-secret` | `secret/oauth/google/client_secret` | OAuth                |
| `github-client-id`     | `secret/oauth/github/client_id`     | OAuth                |
| `github-client-secret` | `secret/oauth/github/client_secret` | OAuth                |

## References

- [External Secrets Operator Docs](https://external-secrets.io/)
- [Vault Documentation](https://www.vaultproject.io/docs)
- [Vault GCP Secrets Engine](https://www.vaultproject.io/docs/secrets/gcp)
- [Vault Kubernetes Auth](https://www.vaultproject.io/docs/auth/kubernetes)
- [GCP Secret Manager](https://cloud.google.com/secret-manager/docs)

## Decision Log

| Date       | Decision                        | Rationale                                 |
| ---------- | ------------------------------- | ----------------------------------------- |
| 2025-11-03 | Use ESO + GCP SM for prod       | Already deployed, simple for single cloud |
| 2025-11-03 | Use plain K8s secrets for local | Fastest path to local dev with Tilt       |
| 2025-11-03 | Plan Vault migration            | Future-proof, portable, unified interface |
