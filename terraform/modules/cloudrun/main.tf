/**
 * Cloud Run Module
 *
 * Deploys Next.js and ML service to Cloud Run with Secret Manager integration.
 */

# Next.js Application
resource "google_cloud_run_v2_service" "nextjs" {
  name     = "threads-${var.env}-nextjs"
  location = var.region

  template {
    scaling {
      min_instance_count = 0  # Scale to zero for cost savings
      max_instance_count = 10
    }

    containers {
      image = var.nextjs_image

      # Resources (within free tier: 360K GB-seconds/month)
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true  # Allow CPU to throttle when idle
      }

      # Environment variables from Secret Manager
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.database_url_secret
            version = "latest"
          }
        }
      }

      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.nextauth_secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "NEXTAUTH_URL"
        value_source {
          secret_key_ref {
            secret  = var.nextauth_url_secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "GOOGLE_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = var.google_client_id_secret
            version = "latest"
          }
        }
      }

      env {
        name = "GOOGLE_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.google_client_secret_secret
            version = "latest"
          }
        }
      }

      env {
        name = "GITHUB_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = var.github_client_id_secret
            version = "latest"
          }
        }
      }

      env {
        name = "GITHUB_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = var.github_client_secret_secret
            version = "latest"
          }
        }
      }

      env {
        name  = "ML_SERVICE_URL"
        value = "http://${var.vm_internal_ip}:8000"
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      ports {
        container_port = 3000
      }
    }

    service_account = var.service_account_email

    # VPC access for database connection
    vpc_access {
      connector = var.vpc_connector_id
      egress    = "PRIVATE_RANGES_ONLY"  # Route only private IPs through VPC
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  labels = {
    environment = var.env
    component   = "frontend"
  }
}

# IAM: Allow public access to Next.js (unauthenticated users)
resource "google_cloud_run_v2_service_iam_member" "nextjs_public" {
  location = google_cloud_run_v2_service.nextjs.location
  name     = google_cloud_run_v2_service.nextjs.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# IAM: Grant service account access to secrets
resource "google_secret_manager_secret_iam_member" "service_account_secrets" {
  for_each = toset([
    var.database_url_secret,
    var.nextauth_secret_id,
    var.nextauth_url_secret_id,
    var.google_client_id_secret,
    var.google_client_secret_secret,
    var.github_client_id_secret,
    var.github_client_secret_secret,
  ])

  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.service_account_email}"
}
