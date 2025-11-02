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
resource "cloudflare_tunnel" "this" {
  account_id = var.account_id
  name       = var.tunnel_name
  secret     = random_id.tunnel_secret.b64_std
}

# Configure tunnel ingress rules
resource "cloudflare_tunnel_config" "this" {
  account_id = var.account_id
  tunnel_id  = cloudflare_tunnel.this.id

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
  value   = "${cloudflare_tunnel.this.id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true # Enable Cloudflare proxy (required for WAF)
  ttl     = 1    # Auto TTL when proxied

  comment = "Managed by Terraform - Cloudflare Tunnel for ${var.tunnel_name}"
}

# WAF Managed Ruleset (OWASP Core, Bot Fight Mode)
resource "cloudflare_ruleset" "waf" {
  count = var.enable_waf ? 1 : 0

  zone_id     = var.zone_id
  name        = "${var.tunnel_name}-waf"
  description = "WAF rules for ${var.subdomain}.${var.domain}"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee" # Cloudflare Managed Ruleset
    }
    expression  = "(http.host eq \"${var.subdomain}.${var.domain}\")"
    description = "Execute Cloudflare Managed Ruleset"
    enabled     = true
  }

  rules {
    action = "execute"
    action_parameters {
      id = "4814384a9e5d4991b9815dcfc25d2f1f" # Cloudflare OWASP Core Ruleset
    }
    expression  = "(http.host eq \"${var.subdomain}.${var.domain}\")"
    description = "Execute OWASP Core Ruleset"
    enabled     = true
  }
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
      TunnelID     = cloudflare_tunnel.this.id
      TunnelName   = cloudflare_tunnel.this.name
      TunnelSecret = random_id.tunnel_secret.b64_std
    })
  }

  type = "Opaque"
}
