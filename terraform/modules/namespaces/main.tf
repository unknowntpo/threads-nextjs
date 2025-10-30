# Namespaces Module
# Manages Kubernetes namespaces for applications

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
}

# Threads application namespace
resource "kubernetes_namespace" "threads" {
  metadata {
    name = "threads"
  }
}
