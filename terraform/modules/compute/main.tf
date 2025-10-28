/**
 * Compute Module
 *
 * Creates c4a-standard-2 VM with PostgreSQL + Dagster services via Docker Compose.
 */

# Service account for the VM
resource "google_service_account" "vm_sa" {
  account_id   = "threads-${var.env}-vm-sa"
  display_name = "Threads VM Service Account"
  description  = "Service account for c4a-standard-2 VM running PostgreSQL and Dagster"
}

# IAM role bindings for service account
resource "google_project_iam_member" "vm_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.vm_sa.email}"
}

resource "google_project_iam_member" "vm_sa_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.vm_sa.email}"
}

# Read startup script
data "local_file" "startup_script" {
  filename = "${path.module}/startup-script.sh"
}

# OLD: Single VM instance - REPLACED BY INSTANCE GROUP BELOW
# This resource is commented out to migrate to managed instance group
# with auto-healing capabilities. The instance group provides:
# - Automatic restart on failure
# - Health check monitoring
# - Better resilience against SPOT VM termination
#
# To migrate:
# 1. Destroy old VM: terraform destroy -target=module.compute.google_compute_instance.vm
# 2. Apply instance group: terraform apply -target=module.compute
# 3. Update kubeconfig with new VM IP
#
# resource "google_compute_instance" "vm" {
#   name         = "threads-${var.env}-vm"
#   machine_type = "c4a-standard-2"
#   zone         = var.zone
#   tags = ["ssh", "http-server", "database"]
#   ...
# }

# Reserve a static internal IP for predictable database connections
# Note: External IP is ephemeral to stay within free tier
resource "google_compute_address" "vm_internal_ip" {
  name         = "threads-${var.env}-vm-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = var.subnet_name
  region       = var.region
}
