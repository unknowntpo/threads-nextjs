# Cloud Scheduler for VM start/stop (9am-9pm Asia/Taipei)

# Stop VM at 9pm daily
resource "google_cloud_scheduler_job" "stop_vm" {
  name             = "threads-${var.env}-vm-stop"
  description      = "Stop VM at 9pm daily (Asia/Taipei)"
  schedule         = "0 21 * * *" # 9pm Taipei time
  time_zone        = "Asia/Taipei"
  attempt_deadline = "180s"

  http_target {
    http_method = "POST"
    uri         = "https://compute.googleapis.com/compute/v1/projects/${var.project_id}/zones/${var.zone}/instances/${google_compute_instance.vm.name}/stop"

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}

# Start VM at 9am daily
resource "google_cloud_scheduler_job" "start_vm" {
  name             = "threads-${var.env}-vm-start"
  description      = "Start VM at 9am daily (Asia/Taipei)"
  schedule         = "0 9 * * *" # 9am Taipei time
  time_zone        = "Asia/Taipei"
  attempt_deadline = "180s"

  http_target {
    http_method = "POST"
    uri         = "https://compute.googleapis.com/compute/v1/projects/${var.project_id}/zones/${var.zone}/instances/${google_compute_instance.vm.name}/start"

    oauth_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}

# Service account for Cloud Scheduler
resource "google_service_account" "scheduler_sa" {
  account_id   = "threads-${var.env}-scheduler"
  display_name = "Cloud Scheduler SA for VM start/stop"
}

# Grant compute.instanceAdmin.v1 role to scheduler SA
resource "google_project_iam_member" "scheduler_compute_admin" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.scheduler_sa.email}"
}
