/**
 * Terraform Outputs
 *
 * Export important resource information for reference and CI/CD.
 */

output "vm_name" {
  description = "VM instance name"
  value       = module.compute.vm_name
}

output "vm_internal_ip" {
  description = "VM internal IP (access via IAP tunnel)"
  value       = module.compute.vm_internal_ip
}

output "service_account_email" {
  description = "Service account email for VMs"
  value       = module.compute.service_account_email
}
