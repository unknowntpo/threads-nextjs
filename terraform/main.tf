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
# Applications deployed via k8s manifests
