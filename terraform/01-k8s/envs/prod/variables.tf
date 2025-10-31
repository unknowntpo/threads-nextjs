/**
 * Variables for 01-k8s Layer
 *
 * Kubernetes and application-specific variables.
 */

# GCP Service Account Key for ArgoCD Image Updater
variable "gcp_service_account_key" {
  description = "Path to GCP service account key JSON file for ArgoCD Image Updater"
  type        = string
  default     = "~/.gcloud/keys/github-actions-artifact-registry-push.json"
}

# ArgoCD Configuration
variable "argocd_chart_version" {
  description = "ArgoCD Helm chart version"
  type        = string
  default     = "5.51.6"
}
