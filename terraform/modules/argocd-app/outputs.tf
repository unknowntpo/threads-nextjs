output "app_name" {
  description = "Name of the ArgoCD Application"
  value       = kubernetes_manifest.threads_app.object.metadata.name
}

output "app_namespace" {
  description = "Namespace of the ArgoCD Application"
  value       = kubernetes_manifest.threads_app.object.metadata.namespace
}
