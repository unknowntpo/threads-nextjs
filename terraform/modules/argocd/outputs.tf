output "argocd_namespace" {
  description = "ArgoCD namespace name"
  value       = helm_release.argocd.namespace
}
