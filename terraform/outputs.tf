/**
 * Terraform Outputs
 *
 * Export important resource information for reference and CI/CD.
 */

# VM IPs temporarily unavailable - use gcloud commands
# gcloud compute instances list --filter="name~threads-prod-vm"

output "instance_group_name" {
  description = "Managed instance group name"
  value       = module.compute.instance_group_name
}

output "instance_group_status" {
  description = "Instance group status"
  value       = module.compute.instance_group_status
}

output "service_account_email" {
  description = "Service account email for VMs"
  value       = module.compute.service_account_email
}
