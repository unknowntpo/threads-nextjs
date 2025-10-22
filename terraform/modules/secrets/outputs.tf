output "database_url_secret_id" {
  description = "Database URL secret ID"
  value       = google_secret_manager_secret.database_url.secret_id
}

output "dagster_database_url_secret_id" {
  description = "Dagster database URL secret ID"
  value       = google_secret_manager_secret.dagster_database_url.secret_id
}

output "nextauth_secret_id" {
  description = "NextAuth secret ID"
  value       = google_secret_manager_secret.nextauth_secret.secret_id
}

output "nextauth_url_secret_id" {
  description = "NextAuth URL secret ID"
  value       = google_secret_manager_secret.nextauth_url.secret_id
}

output "google_client_id_secret_id" {
  description = "Google OAuth client ID secret ID"
  value       = google_secret_manager_secret.google_client_id.secret_id
}

output "google_client_secret_secret_id" {
  description = "Google OAuth client secret secret ID"
  value       = google_secret_manager_secret.google_client_secret.secret_id
}

output "github_client_id_secret_id" {
  description = "GitHub OAuth client ID secret ID"
  value       = google_secret_manager_secret.github_client_id.secret_id
}

output "github_client_secret_secret_id" {
  description = "GitHub OAuth client secret secret ID"
  value       = google_secret_manager_secret.github_client_secret.secret_id
}
