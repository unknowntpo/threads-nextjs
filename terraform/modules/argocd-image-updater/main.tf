/**
 * ArgoCD Image Updater Module
 *
 * Deploys ArgoCD Image Updater to automatically update container image tags
 * when new versions are pushed to Artifact Registry.
 */

# Install ArgoCD Image Updater using official manifest
resource "kubectl_manifest" "argocd_image_updater_install" {
  yaml_body = file("${path.module}/argocd-image-updater-install.yaml")

  depends_on = [kubernetes_secret.gcr_image_updater]
}

# ConfigMap for registry configuration
resource "kubernetes_config_map" "argocd_image_updater_config" {
  metadata {
    name      = "argocd-image-updater-config"
    namespace = "argocd"
  }

  data = {
    "registries.conf" = <<-EOT
      registries:
      - name: gcr
        prefix: us-east1-docker.pkg.dev
        api_url: https://us-east1-docker.pkg.dev
        credentials: pullsecret:argocd/gcr-image-updater-secret
        default: true
    EOT

    "log.level" = "info"
    "argocd.grpc_web" = "true"
    "argocd.server_addr" = "argocd-server.argocd.svc.cluster.local"
    "argocd.insecure" = "true"
    "kube.events" = "true"
  }

  depends_on = [kubectl_manifest.argocd_image_updater_install]
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
