/**
 * Data Sources for 01-k8s Layer
 *
 * Reads outputs from 00-vpc layer via terraform_remote_state.
 * Bucket name should match backend-config.hcl at terraform root.
 */

data "terraform_remote_state" "vpc" {
  backend = "gcs"

  config = {
    bucket = var.backend_bucket
    prefix = "00-vpc/state"
  }
}

# Outputs from 00-vpc that we use
locals {
  project_id      = data.terraform_remote_state.vpc.outputs.project_id
  region          = data.terraform_remote_state.vpc.outputs.region
  zone            = data.terraform_remote_state.vpc.outputs.zone
  env             = data.terraform_remote_state.vpc.outputs.env
  vm_name         = data.terraform_remote_state.vpc.outputs.vm_name
  vm_id           = data.terraform_remote_state.vpc.outputs.vm_id
  kubeconfig_path = data.terraform_remote_state.vpc.outputs.kubeconfig_path
  service_account_email = data.terraform_remote_state.vpc.outputs.service_account_email
}
