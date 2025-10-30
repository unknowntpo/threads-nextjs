/**
 * Keel Module - Automated Kubernetes Image Updates
 *
 * Deploys Keel using Helm chart to automatically update
 * container images when new versions are pushed to Artifact Registry.
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

# Keel namespace
resource "kubernetes_namespace" "keel" {
  metadata {
    name = "keel"
  }
}

# Secret for GCP Artifact Registry authentication
resource "kubernetes_secret" "gcr_credentials" {
  metadata {
    name      = "gcr-registry-secret"
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
  version    = var.chart_version
  namespace  = kubernetes_namespace.keel.metadata[0].name

  values = [
    yamlencode({
      service = {
        type = "ClusterIP"
      }
      helmProvider = {
        enabled = false
      }
      # Enable registry polling
      polling = {
        enabled = true
      }
      # GCP Artifact Registry configuration
      googleApplicationCredentials = base64encode(var.gcp_service_account_key)
    })
  ]

  depends_on = [kubernetes_secret.gcr_credentials]
}
