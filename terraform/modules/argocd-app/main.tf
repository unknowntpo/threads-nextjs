/**
 * ArgoCD Application Module
 *
 * Deploys ArgoCD Application CRD for threads application.
 * Shared across all environments.
 */

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
}

# Deploy ArgoCD Application from YAML
resource "kubernetes_manifest" "threads_app" {
  manifest = yamldecode(file("${path.module}/threads-app.yaml"))
}
