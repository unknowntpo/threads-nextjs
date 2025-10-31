# Disk configuration constants
locals {
  boot_disk_size_gb = 50
  boot_disk_type    = "hyperdisk-balanced"
}

# Fetch latest snapshot with k0s-cluster label (if snapshot_name is empty and use_latest_snapshot is true)
data "google_compute_snapshot" "latest_k0s" {
  count = var.snapshot_name == "" && var.use_latest_snapshot ? 1 : 0

  # Find most recent snapshot with matching filter
  filter = "labels.component=k0s-cluster AND labels.environment=${var.env}"
  most_recent = true
}

locals {
  # Determine which snapshot to use:
  # 1. Explicit snapshot_name if provided (must be full URL)
  # 2. If no snapshot_name specified, and use_latest_snapshot=true, then use latest snapshot self_link from data source
  # 3. null (will use base image)
  resolved_snapshot = var.snapshot_name != "" ? var.snapshot_name : (
    var.use_latest_snapshot && length(data.google_compute_snapshot.latest_k0s) > 0 ? data.google_compute_snapshot.latest_k0s[0].self_link : null
  )
}

# Debug output
output "resolved_snapshot_debug" {
  value = local.resolved_snapshot
  description = "Debug: which snapshot is being used"
}

# Instance template for managed instance group
# no snapshot specified: create from image: debian-13-arm64
# if snapshot specified: create from snapshot
resource "google_compute_instance_template" "vm_template" {
  name_prefix  = "threads-${var.env}-vm-"
  machine_type = "c4a-standard-2" # 2 vCPU, 8 GB RAM - ARM
  region       = var.region

  tags = ["ssh", "http-server", "database", "k0s"]

  # Boot disk - use snapshot if available, otherwise base image
  dynamic "disk" {
    for_each = [1]
    content {
      boot         = true
      auto_delete  = true
      disk_size_gb = local.boot_disk_size_gb
      disk_type    = local.boot_disk_type

      # Use snapshot if resolved_snapshot is set, otherwise use base image
      source_image    = local.resolved_snapshot == null ? "debian-13-arm64" : ""
      source_snapshot = local.resolved_snapshot == null ? "" : local.resolved_snapshot
    }
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
