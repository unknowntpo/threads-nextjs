/**
 * 00-vpc: Base Infrastructure Layer
 *
 * Deploys base GCP infrastructure (VM, networking, kubectl setup).
 * Must be applied BEFORE 01-k8s layer.
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    # bucket configured via backend-config.hcl or -backend-config CLI flag
    prefix = "00-vpc/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# VPC module: GCP APIs, networking, compute
module "vpc" {
  source = "../../../modules/vpc"

  project_id = var.project_id
  region     = var.region
  zone       = var.zone
  env        = var.env

  snapshot_name        = var.snapshot_name
  use_latest_snapshot  = var.use_latest_snapshot
}

# kubectl-setup module: Establish IAP tunnel and kubeconfig access
module "kubectl_setup" {
  source = "../../../modules/kubectl-setup"

  vm_name   = module.vpc.vm_name
  vm_id     = module.vpc.vm_id
  zone      = var.zone
  repo_root = "${path.root}/../../../.."

  depends_on = [module.vpc]
}
