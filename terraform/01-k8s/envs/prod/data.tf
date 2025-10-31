/**
 * Data Sources for 01-k8s Layer
 *
 * Reads outputs from 00-vpc layer via terraform_remote_state.
 */

data "terraform_remote_state" "infra" {
  backend = "gcs"

  config = {
    bucket = "threads-tf-state-0bcb17db57fe8e84"
    prefix = "00-vpc/state"
  }
}

# Outputs from 00-vpc that we use
locals {
  project_id      = data.terraform_remote_state.infra.outputs.project_id
  region          = data.terraform_remote_state.infra.outputs.region
  zone            = data.terraform_remote_state.infra.outputs.zone
  env             = data.terraform_remote_state.infra.outputs.env
  vm_name         = data.terraform_remote_state.infra.outputs.vm_name
  vm_id           = data.terraform_remote_state.infra.outputs.vm_id
  kubeconfig_path = data.terraform_remote_state.infra.outputs.kubeconfig_path
}
