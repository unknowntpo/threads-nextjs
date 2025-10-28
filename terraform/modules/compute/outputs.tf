# NOTE: Outputs are temporarily unavailable during migration to instance group
# After instance group is created, you can get VM info with:
# gcloud compute instances list --filter="name~threads-prod-vm"

# output "vm_external_ip" {
#   description = "External IP of the VM (from instance group)"
#   value       = "Run: gcloud compute instances list --filter='name~threads-prod-vm' --format='get(networkInterfaces[0].accessConfigs[0].natIP)'"
# }

# output "vm_internal_ip" {
#   description = "Internal IP of the VM (from instance group)"
#   value       = "Run: gcloud compute instances list --filter='name~threads-prod-vm' --format='get(networkInterfaces[0].networkIP)'"
# }

output "instance_group_name" {
  description = "Name of the managed instance group"
  value       = google_compute_instance_group_manager.vm_group.name
}

output "instance_group_status" {
  description = "Status URL for the instance group"
  value       = google_compute_instance_group_manager.vm_group.status[0].is_stable ? "Stable" : "Updating"
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.vm_sa.email
}
