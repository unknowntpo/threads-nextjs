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

# C4A Spot Preemptible VM instance (ARM architecture, 2 vCPU, 8GB RAM)
resource "google_compute_instance" "vm" {
  name         = "threads-${var.env}-vm"
  machine_type = "c4a-standard-2"  # 2 vCPU, 8 GB RAM - ARM (Axion) processor
  zone         = var.zone

  tags = ["ssh", "http-server", "database"]

  boot_disk {
    initialize_params {
      image = "debian-13-arm64"
      size  = 50  # GB
      type  = "hyperdisk-balanced"
    }
  }

  # Spot/Preemptible configuration for cost savings (~80% cheaper)
  scheduling {
    preemptible                 = true
    automatic_restart           = false
    on_host_maintenance         = "TERMINATE"
    provisioning_model          = "SPOT"
    instance_termination_action = "STOP"
  }

  network_interface {
    network    = var.network_name
    subnetwork = var.subnet_name

    # Ephemeral external IP (free tier allows 1 external IP)
    access_config {
      network_tier = "STANDARD"  # Use standard tier for free tier
    }
  }

  metadata = {
    startup-script = templatefile("${path.module}/startup-script-k0s.sh", {
      PROJECT_ID                = var.project_id
      POSTGRES_PASSWORD         = var.postgres_password
      DAGSTER_POSTGRES_PASSWORD = var.dagster_postgres_password
      POSTGRES_USER             = "postgres"
      POSTGRES_DB               = "threads"
    })
  }

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  # Allow stopping for maintenance
  allow_stopping_for_update = true

  # Labels for organization
  labels = {
    environment = var.env
    component   = "database-dagster"
  }

  lifecycle {
    ignore_changes = [
      metadata["ssh-keys"],
    ]
  }
}

# Reserve a static internal IP for predictable database connections
# Note: External IP is ephemeral to stay within free tier
resource "google_compute_address" "vm_internal_ip" {
  name         = "threads-${var.env}-vm-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = var.subnet_name
  region       = var.region
}
