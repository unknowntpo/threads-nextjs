/**
 * Terraform Outputs
 *
 * Export important resource information for reference and CI/CD.
 */

output "vm_external_ip" {
  description = "External IP of the e2-micro VM (for Dagster UI)"
  value       = module.compute.vm_external_ip
}

output "vm_internal_ip" {
  description = "Internal IP of the e2-micro VM (for database connections)"
  value       = module.compute.vm_internal_ip
}

output "nextjs_url" {
  description = "Cloud Run URL for Next.js application"
  value       = module.cloudrun.nextjs_url
}

output "ml_service_url" {
  description = "Cloud Run URL for ML service"
  value       = module.cloudrun.ml_service_url
}

output "dagster_ui_url" {
  description = "URL to access Dagster UI"
  value       = "http://${module.compute.vm_external_ip}:3001"
}

output "postgres_connection_string" {
  description = "PostgreSQL connection string (internal)"
  value       = "postgresql://postgres@${module.compute.vm_internal_ip}:5432/threads"
  sensitive   = true
}

output "service_account_email" {
  description = "Service account email for Cloud Run"
  value       = module.compute.service_account_email
}
