/**
 * Data Sources for 02-argocd-app Layer
 *
 * Reads outputs from 01-k8s layer via terraform_remote_state.
 * Bucket name should match backend-config.hcl at terraform root.
 */

data "terraform_remote_state" "k8s" {
  backend = "gcs"

  config = {
    bucket = var.backend_bucket
    prefix = "01-k8s/state"
  }
}

# Outputs from 01-k8s that we use
locals {
  project_id       = data.terraform_remote_state.k8s.outputs.project_id
  region           = data.terraform_remote_state.k8s.outputs.region
  zone             = data.terraform_remote_state.k8s.outputs.zone
  kubeconfig_path  = data.terraform_remote_state.k8s.outputs.kubeconfig_path
  argocd_namespace = data.terraform_remote_state.k8s.outputs.argocd_namespace
}
