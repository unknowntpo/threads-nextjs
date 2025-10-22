/**
 * Compute Module
 *
 * Creates e2-micro VM with PostgreSQL + Dagster services via Docker Compose.
 */

# Service account for the VM
resource "google_service_account" "vm_sa" {
  account_id   = "threads-${var.env}-vm-sa"
  display_name = "Threads VM Service Account"
  description  = "Service account for e2-micro VM running PostgreSQL and Dagster"
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

resource "google_project_iam_member" "vm_sa_artifact_registry" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.vm_sa.email}"
}

# Read startup script
data "local_file" "startup_script" {
  filename = "${path.module}/startup-script.sh"
}

# e2-micro VM instance (always-free tier eligible)
resource "google_compute_instance" "vm" {
  name         = "threads-${var.env}-vm"
  machine_type = "e2-micro"  # 0.25-0.5 vCPU, 1 GB RAM - always free
  zone         = var.zone

  tags = ["ssh", "dagster", "database"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"  # Ubuntu 22.04 LTS - supports Docker Compose
      size  = 30  # GB - free tier allows up to 30 GB
      type  = "pd-standard"
    }
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
    startup-script = templatefile("${path.module}/startup-script.sh", {
      POSTGRES_PASSWORD         = var.postgres_password
      DAGSTER_POSTGRES_PASSWORD = var.dagster_postgres_password
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
