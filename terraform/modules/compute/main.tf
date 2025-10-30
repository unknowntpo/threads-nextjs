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

# Boot disk from snapshot (conditionally created)
resource "google_compute_disk" "boot_from_snapshot" {
  count = var.use_latest_snapshot || var.snapshot_name != "" ? 1 : 0

  name     = "threads-${var.env}-vm-boot"
  zone     = var.zone
  type     = "hyperdisk-balanced"
  snapshot = var.snapshot_name != "" ? var.snapshot_name : data.google_compute_snapshot.latest_k0s[0].self_link

  labels = {
    environment = var.env
    component   = "k0s-cluster"
  }
}

# Single VM instance with k0s cluster
# Note: Using single instance instead of MIG due to GCP limitation with snapshot-based boot disks
resource "google_compute_instance" "vm" {
  name         = "threads-${var.env}-vm"
  machine_type = "c4a-standard-2" # 2 vCPU, 8 GB RAM - ARM
  zone         = var.zone

  tags = ["ssh", "http-server", "database", "k0s"]

  # Boot disk - use pre-created disk from snapshot or create from image
  boot_disk {
    auto_delete = true  # Delete disk when VM destroyed (data preserved in snapshot)
    source      = var.use_latest_snapshot || var.snapshot_name != "" ? google_compute_disk.boot_from_snapshot[0].self_link : null

    # Only use initialize_params when creating from image (no snapshot)
    dynamic "initialize_params" {
      for_each = var.snapshot_name == "" && !var.use_latest_snapshot ? [1] : []
      content {
        size  = 50
        type  = "hyperdisk-balanced"
        image = "debian-13-arm64"
      }
    }
  }

  # Non-preemptible VM with scheduled start/stop (9am-9pm) for cost savings
  scheduling {
    preemptible         = false
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
  }

  network_interface {
    network    = var.network_name
    subnetwork = var.subnet_name
    # No external IP - use IAP tunnel for SSH and Cloud NAT for outbound
  }

  metadata = {
    startup-script = templatefile("${path.module}/startup-script-k0s.sh", {
      PROJECT_ID = var.project_id
    })
  }

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  labels = {
    environment = var.env
    component   = "k0s-cluster"
  }

  lifecycle {
    create_before_destroy = true
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
