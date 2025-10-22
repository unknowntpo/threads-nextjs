output "vm_external_ip" {
  description = "External IP of the VM"
  value       = google_compute_instance.vm.network_interface[0].access_config[0].nat_ip
}

output "vm_internal_ip" {
  description = "Internal IP of the VM"
  value       = google_compute_instance.vm.network_interface[0].network_ip
}

output "vm_name" {
  description = "VM instance name"
  value       = google_compute_instance.vm.name
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.vm_sa.email
}
