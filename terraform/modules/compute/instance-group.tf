# DISABLED: Managed instance group with auto-healing (zonal)
# Issue: GCP MIG doesn't properly support snapshot-based boot disks in templates
# Error: "Boot disk specified in template must reference to image or existing disk"
# Using single instance instead (see main.tf)
#
# resource "google_compute_instance_group_manager" "vm_group" {
#   name               = "threads-${var.env}-vm-group"
#   zone               = var.zone
#   base_instance_name = "threads-${var.env}-vm"
#
#   version {
#     instance_template = google_compute_instance_template.vm_template.id
#   }
#
#   # Keep exactly 1 instance running
#   target_size = 1
#
#   # Named ports for load balancing (if needed later)
#   named_port {
#     name = "k0s-api"
#     port = 6443
#   }
#
#   # Auto-healing configuration
#   auto_healing_policies {
#     health_check      = google_compute_health_check.k0s_api.id
#     initial_delay_sec = 300 # 5 minutes for k0s to start
#   }
#
#   # Update policy for zonal instance group
#   update_policy {
#     type                           = "PROACTIVE"
#     minimal_action                 = "REPLACE"
#     most_disruptive_allowed_action = "REPLACE"
#     max_surge_fixed                = 1
#     max_unavailable_fixed          = 0
#   }
#
#   # Note: Stateful disks are not configured for SPOT VMs
#   # as they are expected to be terminated and recreated.
#   # Data persistence should be handled by:
#   # 1. External storage (GCS buckets, Cloud SQL)
#   # 2. k0s data backup/restore mechanisms
#
#   lifecycle {
#     create_before_destroy = true
#     ignore_changes        = [target_size]
#   }
# }
