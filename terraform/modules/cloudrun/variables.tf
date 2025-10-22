variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "env" {
  description = "Environment name"
  type        = string
}

variable "nextjs_image" {
  description = "Next.js Docker image URL"
  type        = string
}

variable "ml_service_image" {
  description = "ML service Docker image URL"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "database_url_secret" {
  description = "Database URL secret ID"
  type        = string
}

variable "nextauth_secret_id" {
  description = "NextAuth secret ID"
  type        = string
}

variable "nextauth_url_secret_id" {
  description = "NextAuth URL secret ID"
  type        = string
}

variable "google_client_id_secret" {
  description = "Google client ID secret ID"
  type        = string
}

variable "google_client_secret_secret" {
  description = "Google client secret secret ID"
  type        = string
}

variable "github_client_id_secret" {
  description = "GitHub client ID secret ID"
  type        = string
}

variable "github_client_secret_secret" {
  description = "GitHub client secret secret ID"
  type        = string
}

variable "vm_internal_ip" {
  description = "VM internal IP for database connection"
  type        = string
}
