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
  description = "Environment name"
  type        = string
}

variable "network_name" {
  description = "VPC network name"
  type        = string
}

variable "subnet_name" {
  description = "Subnet name"
  type        = string
}

variable "snapshot_name" {
  description = "Full URL or name of snapshot to use for boot disk (empty string uses base image or auto-detect latest)"
  type        = string
  default     = ""
}

variable "use_latest_snapshot" {
  description = "Automatically use the latest snapshot with k0s-cluster label (only if snapshot_name is empty)"
  type        = bool
  default     = false
}
