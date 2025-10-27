/**
 * ArgoCD Image Updater Module
 *
 * Deploys ArgoCD Image Updater to automatically update container image tags
 * when new versions are pushed to Artifact Registry.
 */

resource "helm_release" "argocd_image_updater" {
  name       = "argocd-image-updater"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-image-updater"
  namespace  = "argocd"
  version    = "0.11.0"

  values = [
    yamlencode({
      config = {
        # Registry configuration for GCP Artifact Registry
        registries = [
          {
            name   = "gcr"
            prefix = "us-east1-docker.pkg.dev"
            api_url = "https://us-east1-docker.pkg.dev"
            credentials = "pullsecret:threads/gcr-json-key"
            default = true
          }
        ]
      }

      # Update strategy
      argocd = {
        grpcWeb     = true
        serverAddress = "argocd-server.argocd.svc.cluster.local"
        insecure    = true
      }

      # Check for new images every 2 minutes
      interval = "2m"

      # Log level
      logLevel = "info"

      # RBAC to allow reading secrets
      rbac = {
        enabled = true
        rules = [
          {
            apiGroups = [""]
            resources = ["secrets"]
            verbs     = ["get", "list", "watch"]
          }
        ]
      }
    })
  ]

  depends_on = [kubernetes_secret.gcr_image_updater]
}

# Secret for Artifact Registry authentication
resource "kubernetes_secret" "gcr_image_updater" {
  metadata {
    name      = "gcr-image-updater-secret"
    namespace = "argocd"
  }

  data = {
    creds = "gcr:_json_key:${var.gcp_service_account_key}"
  }

  type = "Opaque"
}

# Role to read secrets in threads namespace
resource "kubernetes_role" "image_updater_threads" {
  metadata {
    name      = "argocd-image-updater"
    namespace = "threads"
  }

  rule {
    api_groups = [""]
    resources  = ["secrets"]
    verbs      = ["get", "list", "watch"]
  }
}

# RoleBinding to allow image-updater service account to read secrets in threads namespace
resource "kubernetes_role_binding" "image_updater_threads" {
  metadata {
    name      = "argocd-image-updater"
    namespace = "threads"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.image_updater_threads.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = "argocd-image-updater"
    namespace = "argocd"
  }
}
