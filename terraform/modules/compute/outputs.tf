output "vm_name" {
  description = "Name of the VM instance"
  value       = google_compute_instance.vm.name
}

output "vm_id" {
  description = "ID of the VM instance"
  value       = google_compute_instance.vm.id
}

output "vm_internal_ip" {
  description = "Internal IP of the VM"
  value       = google_compute_instance.vm.network_interface[0].network_ip
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.vm_sa.email
}
