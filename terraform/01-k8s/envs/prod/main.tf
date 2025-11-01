/**
 * 01-k8s: Kubernetes Resources Layer
 *
 * Deploys Kubernetes resources (ArgoCD, Image Updater, External Secrets, namespaces).
 * Must be applied AFTER 00-vpc layer.
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
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  # Partial backend config - bucket specified in backend-config.hcl
  backend "gcs" {
    prefix = "01-k8s/state"
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

# Configure Helm provider
provider "helm" {
  kubernetes {
    config_path = local.kubeconfig_path
  }
}

# Load GCP service account key from file if path is provided
locals {
  gcp_service_account_key = var.gcp_service_account_key != "" ? file(var.gcp_service_account_key) : ""
}

# Local Path Provisioner: Dynamic local storage for PVCs
module "local_path_provisioner" {
  source = "../../../modules/local-path-provisioner"
}

# ArgoCD module: Deploy ArgoCD via Helm
module "argocd" {
  source = "../../../modules/argocd"

  namespace     = "argocd"
  chart_version = var.argocd_chart_version

  depends_on = [module.local_path_provisioner]
}

# Namespaces module: Create application namespaces
module "namespaces" {
  source = "../../../modules/namespaces"
}

# ArgoCD Image Updater module: Auto-update container images
module "argocd_image_updater" {
  source = "../../../modules/argocd-image-updater"

  gcp_service_account_key = local.gcp_service_account_key
  threads_namespace       = module.namespaces.threads_namespace

  depends_on = [module.argocd, module.namespaces]
}

# External Secrets Operator module: Sync secrets from GCP Secret Manager
module "external_secrets" {
  source = "../../../modules/external-secrets"

  project_id                 = local.project_id
  region                     = local.region
  namespace                  = module.namespaces.threads_namespace
  gcp_service_account_email  = local.service_account_email
}
