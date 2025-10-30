# External Secrets Operator Module
# Installs ESO via Helm to sync secrets from GCP Secret Manager to Kubernetes

resource "helm_release" "external_secrets" {
  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  version    = "0.9.11" # Latest stable as of 2024
  namespace  = "external-secrets-system"

  create_namespace = true
  wait             = true
  timeout          = 600 # 10 minutes

  values = [
    yamlencode({
      installCRDs = true
      webhook = {
        port = 9443
      }
      certController = {
        requeueInterval = "5m"
      }
    })
  ]
}

# ClusterSecretStore for GCP Secret Manager
# Uses VM's default service account credentials (no Workload Identity needed for k0s)
#
# Note: Using null_resource + kubectl instead of kubernetes_manifest because
# kubernetes_manifest validates CRDs at plan time (before Helm installs them).
# This approach runs kubectl at apply time, after the CRD is registered.
# Alternative: upgrade to kubernetes provider >= 2.23 and use `wait { fields = {} }`
resource "null_resource" "gcp_secret_store" {
  provisioner "local-exec" {
    command = <<-EOT
      kubectl apply -f - <<EOF
      apiVersion: external-secrets.io/v1beta1
      kind: ClusterSecretStore
      metadata:
        name: gcpsm-secret-store
      spec:
        provider:
          gcpsm:
            projectID: ${var.project_id}
      EOF
    EOT

    environment = {
      KUBECONFIG = pathexpand("~/.kube/config-threads-k0s")
    }
  }

  # Ensure Helm chart completes before creating ClusterSecretStore
  depends_on = [helm_release.external_secrets]

  # Trigger recreation if Helm version changes
  triggers = {
    helm_version = helm_release.external_secrets.version
    project_id   = var.project_id
  }
}
