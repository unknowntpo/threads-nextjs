/**
 * Threads Next.js - GCP Infrastructure
 *
 * Main Terraform configuration for deploying the application stack to GCP.
 * Optimized for free tier usage with e2-micro VM and Cloud Run.
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

  # Backend configuration for Terraform state
  # Will be configured via backend.tf or CLI flags
  backend "gcs" {
    # bucket = "threads-nextjs-terraform-state"
    # prefix = "terraform/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Configure Kubernetes provider to connect to k0s cluster on VM
# PREREQUISITE: Run scripts/kubectl-setup.sh to set up IAP tunnel and kubeconfig
# Port 16443 to avoid conflict with local OrbStack on 6443
provider "kubernetes" {
  config_path = "~/.kube/config-threads-k0s"
}

# Configure Helm provider
provider "helm" {
  kubernetes {
    config_path = "~/.kube/config-threads-k0s"
  }
}

# Load GCP service account key from file if path is provided
locals {
  gcp_service_account_key = var.gcp_service_account_key != "" ? file(var.gcp_service_account_key) : ""
}

# Enable required GCP APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "vpcaccess.googleapis.com",
    "cloudscheduler.googleapis.com",
    "iamcredentials.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Networking module - VPC, subnets, firewall rules
module "networking" {
  source = "./modules/networking"

  project_id = var.project_id
  region     = var.region
  env        = var.env

  depends_on = [google_project_service.required_apis]
}

# Compute module: k0s cluster on compute engine
module "compute" {
  source = "./modules/compute"

  project_id = var.project_id
  region     = var.region
  zone       = var.zone
  env        = var.env

  network_name    = module.networking.network_name
  subnet_name     = module.networking.subnet_name

  snapshot_name        = var.snapshot_name
  use_latest_snapshot  = var.use_latest_snapshot

  depends_on = [module.networking]
}

# kubectl-setup module: Establish IAP tunnel and kubeconfig access
module "kubectl_setup" {
  source = "./modules/kubectl-setup"

  vm_name = module.compute.vm_name
  vm_id   = module.compute.vm_id
  zone    = var.zone

  depends_on = [module.compute]
}

# ArgoCD module: Deploy ArgoCD via Helm
module "argocd" {
  source = "./modules/argocd"

  namespace     = "argocd"
  chart_version = "5.51.6"

  depends_on = [module.kubectl_setup]
}

# Namespaces module: Create application namespaces
module "namespaces" {
  source = "./modules/namespaces"

  depends_on = [module.kubectl_setup]
}

# ArgoCD Image Updater module: Auto-update container images
module "argocd_image_updater" {
  source = "./modules/argocd-image-updater"

  gcp_service_account_key = local.gcp_service_account_key
  threads_namespace       = module.namespaces.threads_namespace

  depends_on = [module.kubectl_setup, module.argocd, module.namespaces]
}

# External Secrets Operator module: Sync secrets from GCP Secret Manager
module "external_secrets" {
  source = "./modules/external-secrets"

  project_id                 = var.project_id
  region                     = var.region
  namespace                  = module.namespaces.threads_namespace
  gcp_service_account_email  = module.compute.service_account_email

  depends_on = [module.kubectl_setup]
}
