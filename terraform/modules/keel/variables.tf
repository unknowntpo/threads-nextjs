variable "chart_version" {
  description = "Keel Helm chart version"
  type        = string
  default     = "1.0.3"
}

variable "gcp_service_account_key" {
  description = "GCP service account JSON key for Artifact Registry"
  type        = string
  sensitive   = true
}
