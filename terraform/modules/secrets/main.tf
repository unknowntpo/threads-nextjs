/**
 * Secrets Module
 *
 * Manages secrets in Google Secret Manager for secure storage and access.
 */

# Database URL secret
resource "google_secret_manager_secret" "database_url" {
  secret_id = "threads-${var.env}-database-url"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "database"
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.database_url
}

# Dagster Database URL secret
resource "google_secret_manager_secret" "dagster_database_url" {
  secret_id = "threads-${var.env}-dagster-database-url"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "dagster"
  }
}

resource "google_secret_manager_secret_version" "dagster_database_url" {
  secret      = google_secret_manager_secret.dagster_database_url.id
  secret_data = var.dagster_database_url
}

# NextAuth Secret
resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "threads-${var.env}-nextauth-secret"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "auth"
  }
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = var.nextauth_secret
}

# NextAuth URL
resource "google_secret_manager_secret" "nextauth_url" {
  secret_id = "threads-${var.env}-nextauth-url"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "auth"
  }
}

resource "google_secret_manager_secret_version" "nextauth_url" {
  secret      = google_secret_manager_secret.nextauth_url.id
  secret_data = var.nextauth_url
}

# Google OAuth Client ID
resource "google_secret_manager_secret" "google_client_id" {
  secret_id = "threads-${var.env}-google-client-id"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "oauth"
  }
}

resource "google_secret_manager_secret_version" "google_client_id" {
  secret      = google_secret_manager_secret.google_client_id.id
  secret_data = var.google_client_id
}

# Google OAuth Client Secret
resource "google_secret_manager_secret" "google_client_secret" {
  secret_id = "threads-${var.env}-google-client-secret"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "oauth"
  }
}

resource "google_secret_manager_secret_version" "google_client_secret" {
  secret      = google_secret_manager_secret.google_client_secret.id
  secret_data = var.google_client_secret
}

# GitHub OAuth Client ID
resource "google_secret_manager_secret" "github_client_id" {
  secret_id = "threads-${var.env}-github-client-id"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "oauth"
  }
}

resource "google_secret_manager_secret_version" "github_client_id" {
  secret      = google_secret_manager_secret.github_client_id.id
  secret_data = var.github_client_id
}

# GitHub OAuth Client Secret
resource "google_secret_manager_secret" "github_client_secret" {
  secret_id = "threads-${var.env}-github-client-secret"

  replication {
    auto {}
  }

  labels = {
    environment = var.env
    component   = "oauth"
  }
}

resource "google_secret_manager_secret_version" "github_client_secret" {
  secret      = google_secret_manager_secret.github_client_secret.id
  secret_data = var.github_client_secret
}
