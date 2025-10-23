output "argocd_namespace" {
  description = "ArgoCD namespace name"
  value       = kubernetes_namespace.argocd.metadata[0].name
}

output "threads_namespace" {
  description = "Threads application namespace name"
  value       = kubernetes_namespace.threads.metadata[0].name
}
