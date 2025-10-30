variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace for SecretStore (usually 'threads')"
  type        = string
  default     = "threads"
}

variable "gcp_service_account_email" {
  description = "GCP service account email for External Secrets Operator"
  type        = string
}
