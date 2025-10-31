/**
 * Outputs from VPC Module
 */

# Compute outputs
output "vm_name" {
  description = "VM instance name"
  value       = module.compute.vm_name
}

output "vm_id" {
  description = "VM instance ID"
  value       = module.compute.vm_id
}

output "vm_internal_ip" {
  description = "VM internal IP"
  value       = module.compute.vm_internal_ip
}

output "service_account_email" {
  description = "VM service account email"
  value       = module.compute.service_account_email
}

# Networking outputs
output "network_name" {
  description = "VPC network name"
  value       = module.networking.network_name
}

output "subnet_name" {
  description = "Subnet name"
  value       = module.networking.subnet_name
}
