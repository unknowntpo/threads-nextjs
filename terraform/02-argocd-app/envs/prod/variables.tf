/**
 * Variables for 02-argocd-app Layer
 */

variable "backend_bucket" {
  description = "GCS bucket name for terraform state backend"
  type        = string
}
