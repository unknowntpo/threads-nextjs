/**
 * 03-cloudflare Layer - Production Environment
 *
 * Creates Cloudflare Tunnel for exposing threads.unknowntpo.com
 *
 * Prerequisites:
 * - 00-vpc layer applied (VM infrastructure)
 * - 01-k8s layer applied (k8s cluster, ArgoCD)
 * - 02-argocd-app layer applied (applications deployed)
 *
 * Usage:
 *   terraform init -backend-config=../../../backend-config.hcl
 *   terraform plan
 *   terraform apply
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }

  backend "gcs" {
    prefix = "03-cloudflare/state"
  }
}

# Cloudflare provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Kubernetes provider (uses kubeconfig from 01-k8s layer)
provider "kubernetes" {
  config_path = local.kubeconfig_path
}

# Cloudflare Tunnel module
module "cloudflare_tunnel" {
  source = "../../../modules/cloudflare-tunnel"

  tunnel_name     = "threads-prod-k0s-tunnel"
  account_id      = var.cloudflare_account_id
  zone_id         = var.cloudflare_zone_id
  subdomain       = var.subdomain
  domain          = var.domain
  service_url     = "http://nextjs.threads.svc.cluster.local:3000"
  k8s_namespace   = "threads"
  k8s_secret_name = "cloudflared-credentials"
  kubeconfig_path = local.kubeconfig_path
}
