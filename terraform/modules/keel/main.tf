# Keel Terraform Module
# Deploys Keel for automatic image updates

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

# Keel namespace
resource "kubernetes_namespace" "keel" {
  metadata {
    name = "keel"
  }
}

# Docker registry secret for Keel to access Artifact Registry
resource "kubernetes_secret" "keel_registry" {
  metadata {
    name      = "keel-registry"
    namespace = kubernetes_namespace.keel.metadata[0].name
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

# Install Keel using Helm
resource "helm_release" "keel" {
  name       = "keel"
  repository = "https://charts.keel.sh"
  chart      = "keel"
  namespace  = kubernetes_namespace.keel.metadata[0].name
  version    = "1.0.3"

  values = [
    templatefile("${path.module}/values.yaml", {
      registry_secret = kubernetes_secret.keel_registry.metadata[0].name
    })
  ]

  depends_on = [
    kubernetes_namespace.keel,
    kubernetes_secret.keel_registry
  ]
}
