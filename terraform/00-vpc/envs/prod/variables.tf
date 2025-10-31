/**
 * Variables for 00-vpc Layer
 *
 * Infrastructure-specific variables.
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

# VM Snapshot Configuration
variable "snapshot_name" {
  description = "Full URL of snapshot to use for VM boot disk. Empty string uses base Debian image or auto-detect latest if use_latest_snapshot=true"
  type        = string
  default     = ""
}

variable "use_latest_snapshot" {
  description = "Automatically use the latest snapshot with k0s-cluster label (only applies when snapshot_name is empty)"
  type        = bool
  default     = false
}