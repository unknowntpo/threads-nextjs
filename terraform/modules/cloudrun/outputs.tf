output "nextjs_url" {
  description = "Next.js Cloud Run URL"
  value       = google_cloud_run_v2_service.nextjs.uri
}

output "ml_service_url" {
  description = "ML service Cloud Run URL"
  value       = google_cloud_run_v2_service.ml_service.uri
}

output "nextjs_service_name" {
  description = "Next.js service name"
  value       = google_cloud_run_v2_service.nextjs.name
}

output "ml_service_name" {
  description = "ML service name"
  value       = google_cloud_run_v2_service.ml_service.name
}
