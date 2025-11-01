/**
 * Outputs from 02-argocd-app Layer
 */

output "threads_app_name" {
  description = "Name of the deployed ArgoCD Application"
  value       = module.argocd_app.app_name
}

output "threads_app_namespace" {
  description = "Namespace of the deployed ArgoCD Application"
  value       = module.argocd_app.app_namespace
}
