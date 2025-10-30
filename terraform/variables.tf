/**
 * Terraform Variables
 *
 * Define all input variables for the infrastructure.
 * Actual values are set in terraform.tfvars or via environment variables.
 */

# GCP Project Configuration
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for resources (us-east1 for free tier)"
  type        = string
  default     = "us-east1"
}

variable "zone" {
  description = "GCP zone for compute resources"
  type        = string
  default     = "us-east1-b"
}

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Container Images
variable "nextjs_image" {
  description = "Next.js Docker image URL"
  type        = string
  default     = "ghcr.io/unknowntpo/threads-nextjs:latest"
}

variable "ml_service_image" {
  description = "ML service Docker image URL"
  type        = string
  default     = "ghcr.io/unknowntpo/threads-ml:latest"
}

# Database Credentials
variable "postgres_password" {
  description = "PostgreSQL password for threads database"
  type        = string
  sensitive   = true
}

variable "dagster_postgres_password" {
  description = "PostgreSQL password for dagster database"
  type        = string
  sensitive   = true
}

# NextAuth Configuration
variable "nextauth_secret" {
  description = "NextAuth secret for session encryption"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth URL (Cloud Run URL)"
  type        = string
}

# OAuth Credentials
variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "github_client_id" {
  description = "GitHub OAuth client ID"
  type        = string
  sensitive   = true
}

variable "github_client_secret" {
  description = "GitHub OAuth client secret"
  type        = string
  sensitive   = true
}

# GCP Service Account Key for ArgoCD Image Updater
variable "gcp_service_account_key" {
  description = "Path to GCP service account JSON key file for ArgoCD Image Updater to access Artifact Registry. Example: ~/.gcloud/keys/github-actions-artifact-registry-push.json"
  type        = string
  sensitive   = true
  default     = ""  # Set in tfvars or will prompt
}

# VM Snapshot Configuration
variable "snapshot_name" {
  description = "Full URL of snapshot to use for VM boot disk. Empty string uses base Debian image or auto-detect latest if use_latest_snapshot=true. Example: projects/web-service-design/global/snapshots/snapshot-k0s"
  type        = string
  default     = ""
}

variable "use_latest_snapshot" {
  description = "Automatically use the latest snapshot with k0s-cluster label (only applies when snapshot_name is empty)"
  type        = bool
  default     = false
}
