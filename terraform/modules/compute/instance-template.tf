# Data source to find the latest snapshot matching our naming pattern
# Snapshots created with: threads-prod-k0s-snapshot-YYYYMMDD-HHMMSS
data "google_compute_snapshot" "latest_k0s_snapshot" {
  name    = var.snapshot_name != "" ? var.snapshot_name : null
  project = var.project_id

  # If no specific snapshot name provided, this will fail gracefully
  # and we'll fall back to base image
}

# Instance template for managed instance group
resource "google_compute_instance_template" "vm_template" {
  name_prefix  = "threads-${var.env}-vm-"
  machine_type = "c4a-standard-2" # 2 vCPU, 8 GB RAM - ARM
  region       = var.region

  tags = ["ssh", "http-server", "database", "k0s"]

  disk {
    # Use snapshot if provided, otherwise fall back to base image
    source_image    = var.snapshot_name == "" ? "debian-13-arm64" : null
    source_snapshot = var.snapshot_name != "" ? data.google_compute_snapshot.latest_k0s_snapshot.self_link : null
    disk_size_gb    = 50
    disk_type       = "hyperdisk-balanced"
    boot            = true
    auto_delete     = true
  }

  # Spot/Preemptible for cost savings
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

    # Ephemeral external IP
    access_config {
      network_tier = "STANDARD"
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

  labels = {
    environment = var.env
    component   = "k0s-cluster"
  }

  lifecycle {
    create_before_destroy = true
  }
}
