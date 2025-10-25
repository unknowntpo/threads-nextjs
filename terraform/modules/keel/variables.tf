variable "gcp_service_account_key" {
  description = "GCP service account JSON key for Artifact Registry access"
  type        = string
  sensitive   = true
}
