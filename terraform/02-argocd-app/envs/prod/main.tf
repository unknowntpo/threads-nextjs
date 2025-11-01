/**
 * 02-argocd-app: ArgoCD Application Deployment Layer
 *
 * Deploys ArgoCD Application CRD to manage threads application.
 * Must be applied AFTER 01-k8s layer.
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }

  # Partial backend config - bucket specified in backend-config.hcl
  backend "gcs" {
    prefix = "02-argocd-app/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = local.project_id
  region  = local.region
  zone    = local.zone
}

# Configure Kubernetes provider to connect to k0s cluster
provider "kubernetes" {
  config_path = local.kubeconfig_path
}

# Deploy ArgoCD Application using shared module
module "argocd_app" {
  source = "../../../modules/argocd-app"

  depends_on = [data.terraform_remote_state.k8s]
}
