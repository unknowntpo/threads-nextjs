/**
 * ArgoCD Image Updater Module - Helm Deployment
 *
 * Deploys ArgoCD Image Updater using Helm chart to automatically update
 * container image tags when new versions are pushed to Artifact Registry.
 *
 * ARM64 compatible via official Helm chart.
 */

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }
}

# Secret for Artifact Registry authentication
resource "kubernetes_secret" "gcr_image_updater" {
  metadata {
    name      = "gcr-image-updater-secret"
    namespace = "argocd"
  }

  data = {
    ".dockerconfigjson" = jsonencode({
      auths = {
        "us-east1-docker.pkg.dev" = {
          username = "_json_key"
          password = var.gcp_service_account_key
          auth     = base64encode("_json_key:${var.gcp_service_account_key}")
        }
      }
    })
  }

  type = "kubernetes.io/dockerconfigjson"
}

# Install ArgoCD Image Updater using Helm
resource "helm_release" "argocd_image_updater" {
  name       = "argocd-image-updater"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argocd-image-updater"
  version    = "0.11.0"
  namespace  = "argocd"

  values = [
    yamlencode({
      config = {
        registries = [
          {
            name        = "gcr"
            api_url     = "https://us-east1-docker.pkg.dev"
            prefix      = "us-east1-docker.pkg.dev"
            credentials = "pullsecret:argocd/gcr-image-updater-secret"
            default     = true
          }
        ]
      argocd = {
          grpcWeb    = true
          serverAddr = "argocd-server.argocd.svc.cluster.local"
          insecure   = true
        }
      }
      logLevel = "info"
    })
  ]

  depends_on = [kubernetes_secret.gcr_image_updater]
}

# Role to read secrets in threads namespace
resource "kubernetes_role" "image_updater_threads" {
  metadata {
    name      = "argocd-image-updater"
    namespace = var.threads_namespace
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
    namespace = var.threads_namespace
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
