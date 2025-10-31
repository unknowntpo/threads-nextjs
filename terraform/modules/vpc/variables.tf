/**
 * Variables for VPC Module
 */

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "zone" {
  description = "GCP zone"
  type        = string
}

variable "env" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "snapshot_name" {
  description = "Full URL of snapshot to use for VM boot disk"
  type        = string
  default     = ""
}

variable "use_latest_snapshot" {
  description = "Automatically use the latest snapshot with k0s-cluster label"
  type        = bool
  default     = false
}
