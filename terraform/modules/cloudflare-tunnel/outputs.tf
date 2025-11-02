/**
 * Cloudflare Tunnel Module Outputs
 */

output "tunnel_id" {
  description = "Cloudflare Tunnel ID"
  value       = cloudflare_zero_trust_tunnel_cloudflared.this.id
}

output "tunnel_name" {
  description = "Cloudflare Tunnel name"
  value       = cloudflare_zero_trust_tunnel_cloudflared.this.name
}

output "tunnel_cname" {
  description = "Tunnel CNAME target"
  value       = "${cloudflare_zero_trust_tunnel_cloudflared.this.id}.cfargotunnel.com"
}

output "public_hostname" {
  description = "Public hostname for the tunnel"
  value       = "${var.subdomain}.${var.domain}"
}

output "dns_record_id" {
  description = "Cloudflare DNS record ID"
  value       = cloudflare_record.tunnel_cname.id
}

output "k8s_secret_name" {
  description = "Kubernetes secret name containing tunnel credentials"
  value       = kubernetes_secret.cloudflared_credentials.metadata[0].name
}
