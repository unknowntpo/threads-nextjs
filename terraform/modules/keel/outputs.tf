output "keel_namespace" {
  description = "Keel namespace name"
  value       = kubernetes_namespace.keel.metadata[0].name
}
