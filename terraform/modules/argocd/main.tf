# ArgoCD Terraform Module
# Deploys ArgoCD and the threads application to existing k8s cluster

terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "~> 1.14"
    }
  }
}

# ArgoCD namespace
resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
  }
}

# Install ArgoCD using kubectl provider
resource "kubectl_manifest" "argocd_install" {
  yaml_body = file("${path.module}/argocd-install.yaml")

  depends_on = [kubernetes_namespace.argocd]
}

# Create threads namespace
resource "kubernetes_namespace" "threads" {
  metadata {
    name = "threads"
  }
}

# Postgres password secret
resource "kubernetes_secret" "postgres_password" {
  metadata {
    name      = "postgres-password"
    namespace = kubernetes_namespace.threads.metadata[0].name
  }

  data = {
    password = var.postgres_password
  }

  type = "Opaque"
}

# Dagster postgres password secret
resource "kubernetes_secret" "dagster_postgres_password" {
  metadata {
    name      = "dagster-postgres-password"
    namespace = kubernetes_namespace.threads.metadata[0].name
  }

  data = {
    password = var.dagster_postgres_password
  }

  type = "Opaque"
}

# Docker registry secret for Artifact Registry
resource "kubernetes_secret" "gcr_json_key" {
  metadata {
    name      = "gcr-json-key"
    namespace = kubernetes_namespace.threads.metadata[0].name
  }

  data = {
    ".dockerconfigjson" = jsonencode({
      auths = {
        "us-east1-docker.pkg.dev" = {
          username = "oauth2accesstoken"
          password = var.gcp_access_token
          auth     = base64encode("oauth2accesstoken:${var.gcp_access_token}")
        }
      }
    })
  }

  type = "kubernetes.io/dockerconfigjson"
}

# ArgoCD Application for threads
resource "kubectl_manifest" "argocd_application" {
  yaml_body = templatefile("${path.module}/argocd-application.yaml", {
    repo_url = var.repo_url
  })

  depends_on = [
    kubectl_manifest.argocd_install,
    kubernetes_namespace.threads,
    kubernetes_secret.postgres_password,
    kubernetes_secret.dagster_postgres_password,
    kubernetes_secret.gcr_json_key
  ]
}
