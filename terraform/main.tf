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
    # kubernetes = {
    #   source  = "hashicorp/kubernetes"
    #   version = "~> 2.20"
    # }
    # kubectl = {
    #   source  = "gavinbunney/kubectl"
    #   version = "~> 1.14"
    # }
    # helm = {
    #   source  = "hashicorp/helm"
    #   version = "~> 2.10"
    # }
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
# Uses gcloud SSH which automatically handles IAP tunnel
# Port 16443 to avoid conflict with local OrbStack on 6443
# provider "kubernetes" {
#   host                   = "https://localhost:16443"
#   cluster_ca_certificate = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).clusters[0].cluster.certificate-authority-data)
#   client_certificate     = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).users[0].user.client-certificate-data)
#   client_key             = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).users[0].user.client-key-data)
# }
#
# # Configure kubectl provider
# provider "kubectl" {
#   host                   = "https://localhost:16443"
#   cluster_ca_certificate = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).clusters[0].cluster.certificate-authority-data)
#   client_certificate     = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).users[0].user.client-certificate-data)
#   client_key             = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).users[0].user.client-key-data)
#   load_config_file       = false
# }
#
# # Configure Helm provider
# provider "helm" {
#   kubernetes {
#     host                   = "https://localhost:16443"
#     cluster_ca_certificate = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).clusters[0].cluster.certificate-authority-data)
#     client_certificate     = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).users[0].user.client-certificate-data)
#     client_key             = base64decode(yamldecode(base64decode(data.external.kubeconfig.result.kubeconfig)).users[0].user.client-key-data)
#   }
# }

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

  snapshot_name = var.snapshot_name

  depends_on = [module.networking]
}

# Data source for GCP access token
data "google_client_config" "default" {}
