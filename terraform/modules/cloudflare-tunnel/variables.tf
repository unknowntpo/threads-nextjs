/**
 * Cloudflare Tunnel Module Variables
 *
 * Creates Cloudflare Tunnel with DNS and K8s secret integration
 */

variable "tunnel_name" {
  description = "Name of the Cloudflare Tunnel"
  type        = string
}

variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare Zone ID for unknowntpo.com"
  type        = string
}

variable "subdomain" {
  description = "Subdomain for the tunnel (e.g., threads)"
  type        = string
}

variable "domain" {
  description = "Base domain (e.g., unknowntpo.com)"
  type        = string
}

variable "service_url" {
  description = "Internal K8s service URL (e.g., http://nextjs.threads.svc.cluster.local:3000)"
  type        = string
}

variable "k8s_namespace" {
  description = "Kubernetes namespace for the secret"
  type        = string
  default     = "threads"
}

variable "k8s_secret_name" {
  description = "Name of the K8s secret to create"
  type        = string
  default     = "cloudflared-credentials"
}

variable "kubeconfig_path" {
  description = "Path to kubeconfig file for K8s provider"
  type        = string
}
