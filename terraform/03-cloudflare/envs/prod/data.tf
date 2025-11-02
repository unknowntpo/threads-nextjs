/**
 * Data Sources for 03-cloudflare Layer
 *
 * Reads outputs from previous terraform layers
 */

# Read outputs from 01-k8s layer
data "terraform_remote_state" "k8s" {
  backend = "gcs"

  config = {
    bucket = var.backend_bucket
    prefix = "01-k8s/state"
  }
}

# Kubeconfig path from 01-k8s layer
locals {
  kubeconfig_path = data.terraform_remote_state.k8s.outputs.kubeconfig_path
  project_id      = data.terraform_remote_state.k8s.outputs.project_id
}
