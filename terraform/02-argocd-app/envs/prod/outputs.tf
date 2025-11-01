/**
 * Outputs from 02-argocd-app Layer
 */

output "threads_app_name" {
  description = "Name of the deployed ArgoCD Application"
  value       = kubernetes_manifest.threads_app.manifest.metadata.name
}

output "threads_app_namespace" {
  description = "Namespace of the deployed ArgoCD Application"
  value       = kubernetes_manifest.threads_app.manifest.metadata.namespace
}
