/**
 * Variables for 03-cloudflare Layer
 *
 * Cloudflare Tunnel and DNS configuration
 */

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone:Read, DNS:Edit, Account:Read, Tunnel:Edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for unknowntpo.com"
  type        = string
}

variable "domain" {
  description = "Base domain name"
  type        = string
  default     = "unknowntpo.com"
}

variable "subdomain" {
  description = "Subdomain for threads application"
  type        = string
  default     = "threads"
}

variable "backend_bucket" {
  description = "GCS bucket name for Terraform state"
  type        = string
}
