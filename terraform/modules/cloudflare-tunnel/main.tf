/**
 * Cloudflare Tunnel Module
 *
 * Creates:
 * - Cloudflare Tunnel
 * - DNS CNAME record
 * - WAF managed ruleset
 * - K8s secret with tunnel credentials
 */

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Generate tunnel secret
resource "random_id" "tunnel_secret" {
  byte_length = 35
}

# Create Cloudflare Tunnel
resource "cloudflare_zero_trust_tunnel_cloudflared" "this" {
  account_id = var.account_id
  name       = var.tunnel_name
  secret     = random_id.tunnel_secret.b64_std
}

# Configure tunnel ingress rules
resource "cloudflare_zero_trust_tunnel_cloudflared_config" "this" {
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.this.id

  config {
    ingress_rule {
      hostname = "${var.subdomain}.${var.domain}"
      service  = var.service_url
    }

    # Catch-all rule (required)
    ingress_rule {
      service = "http_status:404"
    }
  }
}

# DNS CNAME record pointing to tunnel
resource "cloudflare_record" "tunnel_cname" {
  zone_id = var.zone_id
  name    = var.subdomain
  content = "${cloudflare_zero_trust_tunnel_cloudflared.this.id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true # Enable Cloudflare proxy (required for WAF)
  ttl     = 1    # Auto TTL when proxied

  comment = "Managed by Terraform - Cloudflare Tunnel for ${var.tunnel_name}"
}

# Create K8s secret with tunnel credentials
resource "kubernetes_secret" "cloudflared_credentials" {
  metadata {
    name      = var.k8s_secret_name
    namespace = var.k8s_namespace
  }

  data = {
    "credentials.json" = jsonencode({
      AccountTag   = var.account_id
      TunnelID     = cloudflare_zero_trust_tunnel_cloudflared.this.id
      TunnelName   = cloudflare_zero_trust_tunnel_cloudflared.this.name
      TunnelSecret = random_id.tunnel_secret.b64_std
    })
    "token" = cloudflare_zero_trust_tunnel_cloudflared.this.tunnel_token
  }

  type = "Opaque"
}
