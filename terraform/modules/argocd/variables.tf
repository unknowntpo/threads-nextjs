variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "dagster_postgres_password" {
  description = "Dagster PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "gcp_access_token" {
  description = "GCP access token for Artifact Registry"
  type        = string
  sensitive   = true
}

variable "repo_url" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/unknowntpo/threads-nextjs.git"
}
