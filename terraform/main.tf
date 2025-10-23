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
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "~> 1.14"
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
provider "kubernetes" {
  host = "https://${module.compute.vm_external_ip}:6443"

  # Use kubeconfig from VM
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "gcloud"
    args = [
      "compute",
      "ssh",
      module.compute.vm_name,
      "--zone=${var.zone}",
      "--tunnel-through-iap",
      "--command=sudo k0s kubeconfig admin"
    ]
  }
}

# Configure kubectl provider
provider "kubectl" {
  host = "https://${module.compute.vm_external_ip}:6443"

  # Use same exec auth as kubernetes provider
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "gcloud"
    args = [
      "compute",
      "ssh",
      module.compute.vm_name,
      "--zone=${var.zone}",
      "--tunnel-through-iap",
      "--command=sudo k0s kubeconfig admin"
    ]
  }
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

# Compute module - e2-micro VM with PostgreSQL + Dagster
module "compute" {
  source = "./modules/compute"

  project_id = var.project_id
  region     = var.region
  zone       = var.zone
  env        = var.env

  network_name    = module.networking.network_name
  subnet_name     = module.networking.subnet_name

  postgres_password = var.postgres_password
  dagster_postgres_password = var.dagster_postgres_password

  depends_on = [module.networking]
}

# Secrets module - Secret Manager for sensitive data
module "secrets" {
  source = "./modules/secrets"

  project_id = var.project_id
  env        = var.env

  # Database credentials
  postgres_password = var.postgres_password
  dagster_postgres_password = var.dagster_postgres_password
  database_url = "postgresql://postgres:${var.postgres_password}@${module.compute.vm_internal_ip}:5432/threads"
  dagster_database_url = "postgresql://postgres:${var.dagster_postgres_password}@${module.compute.vm_internal_ip}:5432/dagster"

  # NextAuth secrets
  nextauth_secret = var.nextauth_secret
  nextauth_url = var.nextauth_url

  # OAuth credentials
  google_client_id = var.google_client_id
  google_client_secret = var.google_client_secret
  github_client_id = var.github_client_id
  github_client_secret = var.github_client_secret

  depends_on = [google_project_service.required_apis]
}

# k0s Kubernetes cluster runs on the VM
# Applications deployed via ArgoCD GitOps

# ArgoCD module - Deploys ArgoCD and threads application
module "argocd" {
  source = "./modules/argocd"

  postgres_password         = var.postgres_password
  dagster_postgres_password = var.dagster_postgres_password

  # Get GCP access token for Artifact Registry
  gcp_access_token = data.google_client_config.default.access_token

  depends_on = [module.compute]
}

# Data source for GCP access token
data "google_client_config" "default" {}
