output "setup_complete" {
  description = "Completion signal for kubectl setup (IAP tunnel + kubeconfig)"
  value       = null_resource.kubectl_setup.id
}
