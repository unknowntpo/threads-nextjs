# Disk created from snapshot (if snapshot is provided)
resource "google_compute_disk" "boot_disk_from_snapshot" {
  count = var.snapshot_name != "" ? 1 : 0

  name     = "threads-${var.env}-boot-disk-from-snapshot"
  type     = "hyperdisk-balanced"
  zone     = var.zone
  snapshot = var.snapshot_name
  size     = 50

  labels = {
    environment = var.env
    component   = "k0s-cluster"
  }
}

# Instance template for managed instance group
resource "google_compute_instance_template" "vm_template" {
  name_prefix  = "threads-${var.env}-vm-"
  machine_type = "c4a-standard-2" # 2 vCPU, 8 GB RAM - ARM
  region       = var.region

  tags = ["ssh", "http-server", "database", "k0s"]

  disk {
    # If snapshot provided, use disk created from snapshot; otherwise use base image
    source       = var.snapshot_name != "" ? google_compute_disk.boot_disk_from_snapshot[0].name : null
    source_image = var.snapshot_name == "" ? "debian-13-arm64" : null
    boot         = true
    auto_delete  = true

    # These are only used when source_image is set (not with source disk)
    disk_size_gb = var.snapshot_name == "" ? 50 : null
    disk_type    = var.snapshot_name == "" ? "hyperdisk-balanced" : null
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
