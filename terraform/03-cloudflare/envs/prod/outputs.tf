/**
 * Outputs for 03-cloudflare Layer
 */

output "tunnel_id" {
  description = "Cloudflare Tunnel ID"
  value       = module.cloudflare_tunnel.tunnel_id
}

output "tunnel_name" {
  description = "Cloudflare Tunnel name"
  value       = module.cloudflare_tunnel.tunnel_name
}

output "public_url" {
  description = "Public URL for the application"
  value       = "https://${module.cloudflare_tunnel.public_hostname}"
}

output "tunnel_cname" {
  description = "Tunnel CNAME target"
  value       = module.cloudflare_tunnel.tunnel_cname
}

output "k8s_secret_name" {
  description = "Kubernetes secret name for cloudflared"
  value       = module.cloudflare_tunnel.k8s_secret_name
}
