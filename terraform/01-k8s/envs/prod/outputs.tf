/**
 * Outputs from 01-k8s Layer
 *
 * Exported for use by downstream layers (02-argocd-app, etc.)
 */

output "kubeconfig_path" {
  description = "Path to kubeconfig file"
  value       = local.kubeconfig_path
}

output "project_id" {
  description = "GCP project ID"
  value       = local.project_id
}

output "region" {
  description = "GCP region"
  value       = local.region
}

output "zone" {
  description = "GCP zone"
  value       = local.zone
}

output "argocd_namespace" {
  description = "ArgoCD namespace name"
  value       = module.argocd.argocd_namespace
}
