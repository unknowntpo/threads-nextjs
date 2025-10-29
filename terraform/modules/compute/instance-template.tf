# Instance template for managed instance group
resource "google_compute_instance_template" "vm_template" {
  name_prefix  = "threads-${var.env}-vm-"
  machine_type = "c4a-standard-2" # 2 vCPU, 8 GB RAM - ARM
  region       = var.region

  tags = ["ssh", "http-server", "database", "k0s"]

  disk {
    # Use snapshot if provided, otherwise fall back to base image
    source_image    = "debian-13-arm64"
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
