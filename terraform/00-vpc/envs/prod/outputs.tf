/**
 * Outputs from 00-vpc Layer
 *
 * These values are exported to 01-k8s layer via terraform_remote_state.
 */

# Compute outputs
output "vm_name" {
  description = "VM instance name"
  value       = module.vpc.vm_name
}

output "vm_id" {
  description = "VM instance ID"
  value       = module.vpc.vm_id
}

output "vm_internal_ip" {
  description = "VM internal IP"
  value       = module.vpc.vm_internal_ip
}

output "service_account_email" {
  description = "VM service account email"
  value       = module.vpc.service_account_email
}

# Networking outputs
output "network_name" {
  description = "VPC network name"
  value       = module.vpc.network_name
}

output "subnet_name" {
  description = "Subnet name"
  value       = module.vpc.subnet_name
}

# kubectl-setup outputs
output "kubectl_setup_complete" {
  description = "kubectl setup completion signal"
  value       = module.kubectl_setup.setup_complete
}

output "kubeconfig_path" {
  description = "Path to kubeconfig file"
  value       = "~/.kube/config-threads-k0s"
}

# GCP config for 01-k8s layer
output "project_id" {
  description = "GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP region"
  value       = var.region
}

output "zone" {
  description = "GCP zone"
  value       = var.zone
}

output "env" {
  description = "Environment name"
  value       = var.env
}
