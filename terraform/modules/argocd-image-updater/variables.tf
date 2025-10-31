variable "gcp_service_account_key" {
  description = "GCP service account JSON key for Artifact Registry"
  type        = string
  sensitive   = true
}

variable "threads_namespace" {
  description = "Kubernetes namespace for threads application"
  type        = string
}
